import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faTimes, faPaperPlane, faSmile, faReply, faCircle, faVideo, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "../../context/ToastContext";
import EmojiPicker from "emoji-picker-react";
import { getRankTitle, getAvatarFrameClass, addXpAndCheckLevelUp, formatWhatsAppDate } from "../../utils/xp.utils";

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [userMeta, setUserMeta] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [showVideoBg, setShowVideoBg] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-menu-container")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDeleteLiveChat = async (msgId) => {
    try {
      const { error } = await supabase.from("live_chats").delete().eq("id", msgId);
      if (error) throw error;
      addToast("Pesan berhasil dihapus", "success");
      setDeleteConfirmId(null);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      addToast("Gagal menghapus pesan: " + err.message, "error");
    }
  };

  const messagesEndRef = useRef(null);
  const { addToast } = useToast();
  const location = useLocation();
  const isComicReader = location.pathname.startsWith("/comic/read/");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Fungsi khusus untuk mengambil Level & Title tanpa memberatkan query utama
  const fetchUserMeta = async (userIds) => {
    const uniqueIds = [...new Set(userIds.filter((id) => id && !userMeta[id]))];
    if (uniqueIds.length === 0) return;

    const [statsRes, customsRes] = await Promise.all([
      supabase.from("profiles").select("id, level, role").in("id", uniqueIds),
      supabase.from("user_customizations").select("user_id, custom_title, title_color, name_color").in("user_id", uniqueIds),
    ]);

    const newMeta = {};
    uniqueIds.forEach((id) => {
      const stat = statsRes.data?.find((s) => s.id === id);
      const custom = customsRes.data?.find((c) => c.user_id === id);
      newMeta[id] = {
        level: stat?.level || 1,
        role: stat?.role || 'user',
        title: custom?.custom_title || getRankTitle(stat?.level || 1),
        titleColor: custom?.title_color || "#ffbade",
        nameColor: custom?.name_color || "#ffffff",
      };
    });
    setUserMeta((prev) => ({ ...prev, ...newMeta }));
  };

  useEffect(() => {
    let room = null;
    let chatSubscription = null;

    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session ? session.user : null;
      setUser(currentUser);

      // Fitur 4: Supabase Presence (Orang Online)
      room = supabase.channel("presence_live_chat", {
        config: { presence: { key: currentUser ? currentUser.id : "anon-" + Math.random() } },
      });

      room
        .on("presence", { event: "sync" }, () => {
          const state = room.presenceState();
          // Hitung total orang unik yang terkoneksi
          setOnlineUsers(Math.max(1, Object.keys(state).length));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await room.track({ online_at: new Date().toISOString() });
          }
        });

      // Ambil pesan awal (Kita gunakan relasi profiles() yang bersifat LEFT JOIN agar anonim tidak hilang)
      let chatData = null;
      const response = await supabase
        .from("live_chat")
        .select(`
          id,
          message,
          created_at,
          user_id,
          reply_to_id,
          profiles(display_name, username, avatar_url, level, role, is_vip)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (response.error) {
        console.warn("Kolom reply_to_id mungkin belum ada, fallback query:", response.error.message);
        const fallbackRes = await supabase
          .from("live_chat")
          .select(`id, message, created_at, user_id, profiles(display_name, username, avatar_url, level, role)`)
          .order("created_at", { ascending: false })
          .limit(50);
        chatData = fallbackRes.data;
      } else {
        chatData = response.data;
      }

      if (chatData) {
        const msgs = chatData.reverse();
        setMessages(msgs);
        fetchUserMeta(msgs.map((m) => m.user_id));
      }

      // Realtime listener
      chatSubscription = supabase
        .channel("db_changes_live_chat")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "live_chat" },
          async (payload) => {
            let profileData = null;
            if (payload.new.user_id) {
              const { data } = await supabase
                .from("profiles")
                .select("display_name, username, avatar_url, level, role")
                .eq("id", payload.new.user_id)
                .single();
              profileData = data;
              fetchUserMeta([payload.new.user_id]);
            }

            const newMessageWithProfile = {
              ...payload.new,
              profiles: profileData,
            };

            setMessages((prev) => [...prev, newMessageWithProfile]);
          }
        )
        .subscribe();
    };

    initChat();

    return () => {
      if (room) supabase.removeChannel(room);
      if (chatSubscription) supabase.removeChannel(chatSubscription);
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);

    const payload = {
      user_id: user ? user.id : null,
      message: newMessage.trim(),
    };
    if (replyTo) payload.reply_to_id = replyTo.id;

    const { error } = await supabase.from("live_chat").insert([payload]);

    if (error) {
      addToast("Gagal mengirim pesan: " + error.message, "error");
    } else {
      setNewMessage("");
      setReplyTo(null);
      setShowEmojiPicker(false);

      // Tambah XP +5 untuk Live Chat jika user terautentikasi (Max 10 chat/hari)
      if (user) {
        addXpAndCheckLevelUp(user.id, "live_chat", 5, null, addToast);
      }
    }
    setLoading(false);
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
  };

  const renderMessage = (text) => {
    if (!text) return "";
    const mentionRegex = /(@\w+)/g;
    const parts = text.split(mentionRegex);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-[#ffbade] font-bold shadow-[0_0_5px_rgba(255,186,222,0.4)] px-1 rounded">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`fixed right-6 z-50 flex flex-col items-end font-sans transition-all duration-300 ${isComicReader ? "bottom-24" : "bottom-6"}`}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-[#ffbade] to-[#ff7eb3] text-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,186,222,0.4)] hover:scale-110 transition-transform relative"
        >
          <FontAwesomeIcon icon={faComments} className="text-2xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-[#161523]">
            {onlineUsers}
          </span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-[#161523] border border-[#ffbade]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
          {/* Header */}
          <div className="bg-[#201F31] p-4 flex justify-between items-center border-b border-[#ffbade]/20 z-10">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <FontAwesomeIcon icon={faComments} className="text-[#ffbade]" />
              Live Chat
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVideoBg(!showVideoBg)}
                title={showVideoBg ? "Matikan Background Animasi" : "Aktifkan Background Animasi"}
                className={`text-xs px-2 py-1 rounded-md transition-colors border flex items-center gap-1 ${showVideoBg ? "border-[#ffbade] text-[#ffbade] bg-[#ffbade]/10" : "border-gray-600 text-gray-400 hover:text-white"}`}
              >
                <FontAwesomeIcon icon={faVideo} /> {showVideoBg ? "Video On" : "Video Off"}
              </button>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                <FontAwesomeIcon icon={faCircle} className="text-[8px] animate-pulse" /> {onlineUsers}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>
          </div>

          {/* Area Pesan dengan Background Video / Animasi */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-[#161523] relative z-0" onClick={() => setShowEmojiPicker(false)}>
            {showVideoBg && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-25">
                <div className="absolute inset-0 bg-gradient-to-b from-[#161523]/80 via-transparent to-[#161523]/90 z-10"></div>
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover filter blur-[1px]"
                >
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-4006-large.mp4" type="video/mp4" />
                </video>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm text-center relative z-10">
                Belum ada pesan. Jadilah yang pertama menyapa!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = user && msg.user_id === user.id;
                const meta = userMeta[msg.user_id];
                const isAnon = !msg.user_id;
                const frameClass = getAvatarFrameClass(meta?.level || 1, msg.profiles?.is_vip);
                const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"} group relative z-10`}
                  >
                    {/* Avatar with Crown on top & VIP badge below */}
                    <div className="relative shrink-0 self-start mt-1">
                      {msg.profiles?.is_vip && (
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs z-10 drop-shadow">
                          👑
                        </span>
                      )}
                      <img
                        src={
                          msg.profiles?.avatar_url ||
                          "https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg"
                        }
                        alt="Avatar"
                        className={`w-8 h-8 rounded-full object-cover bg-[#201F31] ${frameClass}`}
                      />
                      {msg.profiles?.is_vip && (
                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 py-0.2 text-[7px] font-black rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400 shadow-md">
                          VIP
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col max-w-[78%] min-w-[50%]">
                      {/* Info Pengirim: Sisi Kategori (2 Baris Nama & Title dekat Avatar, 1 Baris Waktu & Titik 3 di Pojok Lawan) */}
                      <div className={`flex items-start justify-between w-full mb-1 gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Sisi Dekat Foto Profil - 2 Baris: Nama & Title */}
                        <div className={`flex flex-col overflow-hidden ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                          <span className="text-xs font-bold truncate" style={{ color: meta?.nameColor || "#cccccc" }}>
                            {isAnon ? "Anonim" : msg.profiles?.display_name || msg.profiles?.username || "Anime Fan"}
                          </span>
                          {!isAnon && meta && (
                            <span className="text-[9px] font-bold text-[#ffbade] truncate">
                              Lv.{meta.level} • {meta.title}
                            </span>
                          )}
                        </div>

                        {/* Sisi Jauh dari Foto Profil - 1 Baris: Waktu + Titik 3 */}
                        <div className={`flex items-center gap-1.5 shrink-0 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          <span className="text-[9px] text-gray-500 whitespace-nowrap">
                            {formatWhatsAppDate(msg.created_at)}
                          </span>

                          {/* 3-Dots Action Button for owner */}
                          {isMe && (
                            <div className="relative action-menu-container">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }}
                                className="text-gray-400 hover:text-white p-0.5 text-[10px]"
                                title="Pilihan"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} />
                              </button>

                              {activeMenuId === msg.id && (
                                <div className="absolute right-0 top-5 w-28 bg-[#1C1B2B] border border-gray-700 rounded-xl shadow-xl py-1 z-30 text-xs text-left">
                                  <button 
                                    onClick={() => { setDeleteConfirmId(msg.id); setActiveMenuId(null); }}
                                    className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-500/20 font-semibold flex items-center gap-1.5 text-[11px]"
                                  >
                                    🗑️ Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bubble Pesan */}
                      <div
                        className={`relative rounded-2xl p-3 shadow-md ${isMe
                            ? "bg-[#ffbade] text-black rounded-tr-sm"
                            : "bg-[#2D2B44] text-white rounded-tl-sm"
                          }`}
                      >
                        {/* Quote Reply */}
                        {repliedMsg && (
                          <div className={`text-xs p-2 mb-2 rounded-lg border-l-4 ${isMe ? 'bg-black/10 border-black/50' : 'bg-black/30 border-[#ffbade]'}`}>
                            <span className="font-bold block mb-0.5 opacity-80">
                              {repliedMsg.profiles?.display_name || "Anonim"}
                            </span>
                            <span className="line-clamp-1 opacity-70">{repliedMsg.message}</span>
                          </div>
                        )}

                        <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">{renderMessage(msg.message)}</p>

                        {/* Tombol Reply saat hover */}
                        <button
                          onClick={() => setReplyTo(msg)}
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 bg-[#201F31] text-gray-300 rounded-full shadow-lg hover:text-[#ffbade] border border-gray-700 ${isMe ? "-left-10" : "-right-10"}`}
                          title="Balas Pesan"
                        >
                          <FontAwesomeIcon icon={faReply} className="text-xs" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 right-0 z-[60] shadow-2xl animate-fade-in">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={300} height={350} />
            </div>
          )}

          {/* Input Area */}
          <div className="bg-[#201F31] p-3 border-t border-gray-800 relative z-50">
            {/* Pratinjau Reply */}
            {replyTo && (
              <div className="mb-3 p-2 bg-[#161523] rounded-lg border-l-4 border-[#ffbade] text-xs relative shadow-inner">
                <span className="font-bold text-[#ffbade] block mb-1">Membalas pesan {replyTo.profiles?.display_name || "Anonim"}</span>
                <p className="text-gray-300 line-clamp-1 italic">"{replyTo.message}"</p>
                <button onClick={() => setReplyTo(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white bg-black/20 rounded-full w-5 h-5 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center ${showEmojiPicker ? 'bg-gray-800 text-[#ffbade]' : 'text-gray-400 hover:bg-gray-800 hover:text-[#ffbade]'}`}
              >
                <FontAwesomeIcon icon={faSmile} className="text-xl" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={user ? "Ketik pesan..." : "Ketik sebagai Anonim..."}
                className="flex-1 bg-[#161523] text-white text-sm px-4 py-2.5 rounded-full border border-gray-700 focus:border-[#ffbade] focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="w-10 h-10 bg-gradient-to-br from-[#ffbade] to-[#ff7eb3] text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0 shadow-lg"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-[#1C1B2B] border border-gray-700 p-6 rounded-2xl max-w-xs w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Hapus Pesan Chat?</h3>
            <p className="text-xs text-gray-300">Pesan yang dihapus tidak dapat dikembalikan lagi.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteLiveChat(deleteConfirmId)}
                className="px-4 py-2 text-xs bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
