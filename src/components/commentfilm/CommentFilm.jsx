import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { FaHeart, FaRegHeart, FaReply, FaChevronDown } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import BouncingLoader from "@/src/components/ui/bouncingloader/Bouncingloader";
import AuthModal from "@/src/components/auth/AuthModal";
import { useToast } from "@/src/context/ToastContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faCrown, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getRankTitle, getAvatarFrameClass, addXpAndCheckLevelUp, formatWhatsAppDate } from "@/src/utils/xp.utils";
import UserProfileModal from "@/src/components/profile/UserProfileModal";

export default function CommentFilm({ targetId, episodeTitle }) {
  const { addToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // stores comment id to reply to
  const [sortBy, setSortBy] = useState("Terbaru"); // Terbaru, Terlama

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [selectedUsername, setSelectedUsername] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenUserProfile = (username) => {
    if (!username) return;
    setSelectedUsername(username);
    setIsProfileModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-menu-container")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchSession();

    // Listen for auth state changes so UI updates instantly when logged in via AuthModal
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentUser(session.user);
        fetchProfileData(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (targetId) {
      fetchComments();
    }
  }, [targetId, sortBy]);

  const fetchProfileData = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*, user_stats(*)")
      .eq("id", userId)
      .single();
    if (data) setCurrentProfile(data);
  };

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUser(session.user);
      fetchProfileData(session.user.id);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    let query = supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (id, username, display_name, avatar_url, level, role, is_vip),
        comment_likes (user_id)
      `)
      .eq("target_id", targetId);

    if (sortBy === "Terbaru") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: true });
    }

    const { data, error } = await query;

    if (!error && data) {
      // Organize into threads (parent and replies)
      const threads = [];
      const replyMap = {};

      data.forEach(comment => {
        if (comment.parent_id) {
          if (!replyMap[comment.parent_id]) replyMap[comment.parent_id] = [];
          replyMap[comment.parent_id].push(comment);
        } else {
          comment.replies = [];
          threads.push(comment);
        }
      });

      threads.forEach(thread => {
        if (replyMap[thread.id]) {
          thread.replies = replyMap[thread.id].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
      });

      setComments(threads);
    }
    setLoading(false);
  };

  const handleSubmit = async (e, parentId = null) => {
    e.preventDefault();
    if (!currentUser) return alert("Silakan login terlebih dahulu untuk berkomentar.");
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          user_id: currentUser.id,
          target_id: targetId,
          content: newComment.trim(),
          is_spoiler: isSpoiler,
          parent_id: parentId
        }
      ])
      .select(`
        *,
        profiles:user_id (id, username, display_name, avatar_url, level, role, is_vip),
        comment_likes (user_id)
      `)
      .single();

    if (!error && data) {
      setNewComment("");
      setIsSpoiler(false);
      setReplyTo(null);
      // Optimistic update
      if (parentId) {
        setComments(comments.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), data] };
          }
          return c;
        }));
      } else {
        if (sortBy === "Terbaru") {
          setComments([data, ...comments]);
        } else {
          setComments([...comments, data]);
        }
      }

      // Tambah XP +25 untuk komentar / balasan
      addXpAndCheckLevelUp(currentUser.id, "comment", 25, data.id, addToast);
    } else {
      console.error(error);
      alert("Gagal mengirim komentar.");
    }
    setSubmitting(false);
  };

  const handleLike = async (commentId, isLiked) => {
    if (!currentUser) return alert("Silakan login untuk menyukai komentar.");

    if (isLiked) {
      // Unlike
      await supabase
        .from("comment_likes")
        .delete()
        .match({ user_id: currentUser.id, comment_id: commentId });

      updateCommentLikeState(commentId, false);
    } else {
      // Like
      await supabase
        .from("comment_likes")
        .insert([{ user_id: currentUser.id, comment_id: commentId }]);

      updateCommentLikeState(commentId, true);
      // Tambah XP +5 untuk Like
      addXpAndCheckLevelUp(currentUser.id, "like", 5, commentId, addToast);
    }
  };

  const updateCommentLikeState = (commentId, isLiked) => {
    const updateLikes = (c) => {
      if (c.id === commentId) {
        const likes = c.comment_likes || [];
        if (isLiked) {
          return { ...c, comment_likes: [...likes, { user_id: currentUser.id }] };
        } else {
          return { ...c, comment_likes: likes.filter(l => l.user_id !== currentUser.id) };
        }
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(updateLikes) };
      }
      return c;
    };
    setComments(comments.map(updateLikes));
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId);
      await supabase.from("comments").delete().eq("parent_id", commentId);
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
      addToast("Komentar berhasil dihapus", "success");
      setDeleteConfirmId(null);
      fetchComments();
    } catch (err) {
      addToast("Gagal menghapus komentar: " + err.message, "error");
    }
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase.from("comments").update({ content: editContent }).eq("id", commentId);
      if (error) throw error;
      addToast("Komentar berhasil diperbarui", "success");
      setEditingCommentId(null);
      setEditContent("");
      fetchComments();
    } catch (err) {
      addToast("Gagal memperbarui komentar: " + err.message, "error");
    }
  };

  const renderCommentItem = (comment, isReply = false) => {
    const isLiked = comment.comment_likes?.some(l => l.user_id === currentUser?.id);
    const likeCount = comment.comment_likes?.length || 0;
    const authorName = comment.profiles?.display_name || comment.profiles?.username || "Unknown";
    const authorLevel = comment.profiles?.level || 1;
    const rankTitle = getRankTitle(authorLevel);
    const avatarUrl = comment.profiles?.avatar_url || "https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg";
    const frameClass = getAvatarFrameClass(authorLevel, comment.profiles?.is_vip);
    const isOwner = currentUser?.id === comment.user_id;

    return (
      <div key={comment.id} className={`flex gap-x-3.5 ${isReply ? 'ml-10 mt-4' : 'mt-6'}`}>
        {/* Avatar with VIP Crown on top & VIP badge below */}
        <button type="button" onClick={() => handleOpenUserProfile(comment.profiles?.username)} className="relative shrink-0 self-start mt-1 cursor-pointer group">
          {comment.profiles?.is_vip && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs z-20 vip-crown-glow">
              <FontAwesomeIcon icon={faCrown} className="text-yellow-400" />
            </span>
          )}
          <img src={avatarUrl} alt="avatar" className={`w-10 h-10 rounded-full object-cover ${frameClass} group-hover:scale-105 transition-transform`} />
          {comment.profiles?.is_vip && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 text-[8px] font-black rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400 shadow-md">
              VIP
            </span>
          )}
        </button>

        <div className="flex flex-col w-full text-left">
          {/* Header Row: Left Column (2 Baris: Nama & Level), Right Column (1 Baris: Waktu + Titik 3) */}
          <div className="flex items-start justify-between w-full mb-1">
            {/* Sisi Kiri (Dekat Foto Profil) - 2 Baris */}
            <div className="flex flex-col text-left overflow-hidden">
              <button type="button" onClick={() => handleOpenUserProfile(comment.profiles?.username)} className="font-bold text-white hover:text-[#ffbade] transition-colors text-sm truncate text-left">
                {authorName}
              </button>
              <span className="text-[11px] text-gray-400">
                Lvl {authorLevel} • {rankTitle}
              </span>
            </div>

            {/* Sisi Kanan (Pojok Kanan) - 1 Baris Sejajar: Waktu + Titik 3 */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                {formatWhatsAppDate(comment.created_at)}
              </span>

              {/* 3-Dots Action Button & Dropdown Menu */}
              {isOwner && (
                <div className="relative action-menu-container">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === comment.id ? null : comment.id); }}
                    className="text-gray-400 hover:text-white p-1 text-xs"
                    title="Pilihan"
                  >
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </button>

                  {activeMenuId === comment.id && (
                    <div className="absolute right-0 top-6 w-32 bg-[#1C1B2B] border border-gray-700 rounded-xl shadow-xl py-1 z-30 text-xs">
                      <button 
                        onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-gray-300 hover:bg-[#ffbade]/20 hover:text-[#ffbade] font-semibold flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEdit} /> Edit
                      </button>
                      <button 
                        onClick={() => { setDeleteConfirmId(comment.id); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/20 font-semibold flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comment Content / Edit Mode */}
          {editingCommentId === comment.id ? (
            <div className="mt-2 flex flex-col gap-2">
              <textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                className="w-full bg-[#11101A] text-white p-2 rounded-lg border border-[#ffbade] text-xs min-h-[60px]"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-xs text-gray-400 hover:text-white font-semibold">Batal</button>
                <button onClick={() => handleSaveEditComment(comment.id)} className="px-3 py-1 text-xs bg-[#ffbade] text-black font-bold rounded-lg hover:bg-[#ff99cc]">Simpan</button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-[13px] text-gray-200 break-words">
              {comment.is_spoiler ? (
                <div
                  className="bg-[#2A2A38] text-gray-400 p-2 rounded cursor-pointer text-center text-xs border border-[#3A3A48] hover:border-[#ffbade] transition-colors"
                  onClick={(e) => {
                    e.currentTarget.textContent = comment.content;
                    e.currentTarget.className = "whitespace-pre-wrap";
                    e.currentTarget.onclick = null;
                  }}
                >
                  Komentar ini mengandung spoiler. Klik untuk melihat.
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-x-4 mt-2">
            {!isReply && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-gray-400 hover:text-white text-[12px] flex items-center gap-x-1.5 font-semibold"
              >
                <FaReply /> Balas
              </button>
            )}
            <button
              onClick={() => handleLike(comment.id, isLiked)}
              className={`text-[12px] flex items-center gap-x-1.5 font-semibold ${isLiked ? 'text-[#ffbade]' : 'text-gray-400 hover:text-[#ffbade]'}`}
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />} {likeCount}
            </button>
          </div>

          {replyTo === comment.id && !isReply && (
            <div className="mt-3">
              {renderCommentInput(comment.id, () => setReplyTo(null))}
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="flex flex-col gap-y-2">
              {comment.replies.map(reply => (
                <div key={reply.id}>
                  {renderCommentItem(reply, true)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCommentInput = (parentId = null, onCancel = null) => {
    const avatarUrl = currentProfile?.avatar_url || "https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg";
    const authorName = currentProfile?.display_name || currentProfile?.username || currentUser?.email?.split('@')[0] || "User";
    const inputFrameClass = getAvatarFrameClass(currentProfile?.level || 1, currentProfile?.is_vip);

    return (
      <form onSubmit={(e) => handleSubmit(e, parentId)} className="bg-[#191826] p-4 rounded-xl border border-[#2a293d]">
        {currentUser ? (
          <>
            <div className="flex items-center gap-x-3 mb-3">
              <img src={avatarUrl} alt="avatar" className={`w-8 h-8 rounded-full object-cover ${inputFrameClass}`} />
              <span className="text-[13px] text-gray-300">
                Berkomentar sebagai <span className="font-bold text-white">{authorName}</span>
              </span>
            </div>
            <textarea
              className="w-full bg-[#11101A] text-white p-3 rounded-lg border border-[#2a293d] focus:outline-none focus:border-[#ffbade] text-[14px] min-h-[80px] resize-y"
              placeholder="Tulis komentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
            ></textarea>
            <div className="flex justify-between items-center mt-3">
              <div className="text-[12px] text-gray-500">
                {newComment.length}/500
              </div>
              <div className="flex items-center gap-x-4">
                <label className="flex items-center gap-x-2 text-[13px] text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[#ffbade] w-4 h-4 rounded cursor-pointer"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                  />
                  Sensor Teks
                </label>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-[13px] text-gray-400 hover:text-white font-semibold px-3 py-1.5"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="bg-[#ffbade] text-[#191826] px-5 py-1.5 rounded-full font-bold text-[14px] hover:bg-[#ff99cb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Mengirim..." : "Kirim"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-2">Silakan login untuk bergabung dalam diskusi.</p>
            <button 
              type="button" 
              onClick={() => setIsAuthModalOpen(true)} 
              className="text-[#ffbade] font-bold hover:underline"
            >
              Login Sekarang
            </button>
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="w-full flex flex-col gap-y-4">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="flex items-center justify-between bg-[#191826] p-4 rounded-xl max-[575px]:flex-col max-[575px]:items-start max-[575px]:gap-y-3">
        <div className="flex items-center gap-x-3">
          <h2 className="text-[20px] font-bold text-white">Komentar</h2>
          {episodeTitle && (
            <>
              <span className="text-gray-500">|</span>
              <span className="text-[14px] text-gray-300 bg-[#2A2A38] px-3 py-1 rounded-md">{episodeTitle}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-x-3">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-[#2A2A38] text-white text-[13px] font-semibold px-3 py-1.5 pr-8 rounded-md border border-[#3A3A48] focus:outline-none focus:border-[#ffbade] cursor-pointer"
            >
              <option value="Terbaru">Urutkan Terbaru</option>
              <option value="Terlama">Urutkan Terlama</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
          </div>

          <div className="bg-[#2A2A38] px-3 py-1.5 rounded-md flex items-center gap-x-2 border border-[#3A3A48]">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path></svg>
            <span className="text-white text-[13px] font-bold">{comments.length} Komentar</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-[#11101A] p-4 rounded-xl border border-[#191826] min-h-[150px]">
        {renderCommentInput()}

        <div className="flex flex-col gap-y-4 mt-6">
          {loading ? (
            <div className="text-center text-gray-400 py-6">Memuat komentar...</div>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id}>
                {renderCommentItem(comment)}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              Belum ada komentar. Jadilah yang pertama!
            </div>
          )}
        </div>
      </div>
      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-[#1C1B2B] border border-gray-700 p-6 rounded-2xl max-w-xs w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Hapus Komentar?</h3>
            <p className="text-xs text-gray-300">Komentar yang dihapus tidak dapat dikembalikan lagi.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteComment(deleteConfirmId)}
                className="px-4 py-2 text-xs bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Profile Preview Modal */}
      <UserProfileModal 
        username={selectedUsername}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
