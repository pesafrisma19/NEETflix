import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faStar, faHistory, faSignOutAlt, faCamera, faShareAlt, faCrown, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faDiscord, faInstagram, faTwitter, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { useToast } from "../../context/ToastContext";
import getAnimeInfo from "../../utils/getAnimeInfo.utils";
import { getRankTitle, xpToNextLevel, getAvatarFrameClass, FRAME_LIST, TITLE_LIST, ACHIEVEMENT_LIST, isItemUnlocked } from "../../utils/xp.utils";

// Fungsi untuk mengkonversi gambar apapun menjadi WebP dan mengompres ukurannya
const convertToWebP = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Perkecil dimensi maksimal jika terlalu besar (misal max lebar/tinggi 1200px)
        const MAX_SIZE = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert ke WebP dengan kualitas 80%
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.split('.')[0] + '.webp', {
              type: 'image/webp',
            });
            resolve(webpFile);
          } else {
            reject(new Error('Konversi ke WebP gagal'));
          }
        }, 'image/webp', 0.8);
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [customs, setCustoms] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [editData, setEditData] = useState({
    display_name: "",
    bio: "",
    discord_username: "",
    instagram_username: "",
    twitter_username: "",
    tiktok_username: ""
  });

  const [vipData, setVipData] = useState({
    custom_title: "",
    title_color: "#ffbade",
    name_color: "#ffffff",
    badge_text: "VIP",
    badge_bg_color: "#6a0dad",
    badge_text_color: "#ffffff"
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showTrakteerWarning, setShowTrakteerWarning] = useState(false);
  const { addToast } = useToast();

  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [koleksiLoading, setKoleksiLoading] = useState(false);
  const [koleksiFetched, setKoleksiFetched] = useState(false);

  const [showXpHistoryModal, setShowXpHistoryModal] = useState(false);
  const [xpLogsList, setXpLogsList] = useState([]);
  const [xpLogsLoading, setXpLogsLoading] = useState(false);

  const [riwayatFilter, setRiwayatFilter] = useState("all");
  const [koleksiSubTab, setKoleksiSubTab] = useState("bingkai"); // "bingkai" | "gelar" | "pencapaian"

  const handleEquipItem = async (type, itemId) => {
    if (!user) return;
    try {
      const updates = {};
      if (type === "frame") {
        updates.equipped_frame = customs?.equipped_frame === itemId ? "avatar-frame-standard" : itemId;
      } else if (type === "title") {
        updates.equipped_title = customs?.equipped_title === itemId ? null : itemId;
      }

      const { error } = await supabase
        .from("user_customizations")
        .upsert({
          user_id: user.id,
          ...customs,
          ...updates
        });

      if (error) throw error;
      setCustoms(prev => ({ ...prev, ...updates }));
      addToast(
        updates.equipped_frame || updates.equipped_title
          ? `✅ Berhasil memasang ${type === "frame" ? "Bingkai" : "Gelar"}!`
          : `✅ Berhasil melepas ${type === "frame" ? "Bingkai" : "Gelar"}!`,
        "success"
      );
    } catch (err) {
      console.error("Gagal memasang item:", err);
      addToast("Gagal menyimpan pilihan item!", "error");
    }
  };
  const handleDeleteHistory = async (e, item) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      setHistory(prev => prev.filter(h => h.id !== item.id));
      addToast("Berhasil menghapus dari riwayat tontonan", "success");
    } catch (err) {
      console.error("Gagal menghapus riwayat:", err);
      addToast("Gagal menghapus riwayat tontonan", "error");
    }
  };

  const handleDeleteWatchlist = async (e, item) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const { error } = await supabase
        .from('bookmarks_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', String(item.anime_id));

      if (error) throw error;
      setWatchlist(prev => prev.filter(w => w.anime_id !== item.anime_id));
      addToast("Berhasil menghapus dari Watchlist", "success");
    } catch (err) {
      console.error("Gagal menghapus watchlist:", err);
      addToast("Gagal menghapus dari Watchlist", "error");
    }
  };

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);

      // Fetch profiles, stats, customizations
      const [profRes, statsRes, custRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('user_stats').select('*').eq('user_id', session.user.id).single(),
        supabase.from('user_customizations').select('*').eq('user_id', session.user.id).single()
      ]);

      if (profRes.data) {
        setProfile(profRes.data);
        setEditData(prev => ({
          ...prev,
          display_name: profRes.data.display_name || profRes.data.username || "",
          bio: profRes.data.bio || ""
        }));
      }
      if (statsRes.data) setStats(statsRes.data);
      if (custRes.data) {
        setCustoms(custRes.data);
        setEditData(prev => ({
          ...prev,
          discord_username: custRes.data.discord_username || "",
          instagram_username: custRes.data.instagram_username || "",
          twitter_username: custRes.data.twitter_username || "",
          tiktok_username: custRes.data.tiktok_username || ""
        }));
        setVipData({
          custom_title: custRes.data.custom_title || "",
          title_color: custRes.data.title_color || "#ffbade",
          name_color: custRes.data.name_color || "#ffffff",
          badge_text: custRes.data.badge_text || "VIP",
          badge_bg_color: custRes.data.badge_bg_color || "#6a0dad",
          badge_text_color: custRes.data.badge_text_color || "#ffffff"
        });
      }
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if ((activeTab === "riwayat" || activeTab === "koleksi") && !koleksiFetched && user) {
      const fetchKoleksi = async () => {
        setKoleksiLoading(true);
        try {
          // Fetch from Supabase
          const [favRes, histRes] = await Promise.all([
            supabase.from('bookmarks_favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('watch_history').select('*').eq('user_id', user.id).order('watched_at', { ascending: false }).limit(14)
          ]);

          const favItems = favRes.data || [];
          const histItems = histRes.data || [];

          // Fetch details from AniList, Komiku, LK21, or Anichin
          const fetchDetails = async (items) => {
            return Promise.all(items.map(async (item) => {
              if (item.details && item.details.title && item.details.poster) {
                return item;
              }
              const idStr = String(item.anime_id || '');

              // 1. Try AniList Anime
              try {
                const info = await getAnimeInfo(idStr);
                if (info?.data?.title && info?.data?.poster) {
                  return { ...item, details: { title: info.data.title, poster: info.data.poster, mediaType: 'anime' } };
                }
              } catch (e) {}

              // 2. Try Komiku / Komikcast
              try {
                const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/info?id=${idStr}`);
                if (res.ok) {
                  const json = await res.json();
                  const data = json.results || json.data || json;
                  if (data?.title && (data?.image || data?.poster)) {
                    return { ...item, details: { title: data.title, poster: data.image || data.poster, mediaType: 'comic' } };
                  }
                }
              } catch (e) {}

              // 3. Try LK21 Film
              try {
                const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/lk21/info?id=${idStr}`);
                if (res.ok) {
                  const json = await res.json();
                  const data = json.results?.data || json.results || json;
                  if (data?.title && data?.poster) {
                    const titleClean = data.title.replace(/Nonton | Sub Indo di Lk21/g, "");
                    return { ...item, details: { title: titleClean, poster: data.poster, mediaType: 'film' } };
                  }
                }
              } catch (e) {}

              // 4. Try Anichin Donghua
              try {
                const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/anichin/info?id=${idStr}`);
                if (res.ok) {
                  const json = await res.json();
                  const data = json.results || json.data || json;
                  if (data?.title && (data?.poster || data?.image)) {
                    return { ...item, details: { title: data.title, poster: data.poster || data.image, mediaType: 'donghua' } };
                  }
                }
              } catch (e) {}

              const cleanTitle = idStr.replace(/^chapter-/, '').replace(/__\d+$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return { ...item, details: { title: cleanTitle, poster: "https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg", mediaType: 'anime' } };
            }));
          };

          const [favWithDetails, histWithDetails] = await Promise.all([
            fetchDetails(favItems),
            fetchDetails(histItems)
          ]);

          setWatchlist(favWithDetails.filter(i => i.details));
          setHistory(histWithDetails.filter(i => i.details && (i.details.title || i.anime_id)));
          setKoleksiFetched(true);
        } catch (error) {
          console.error("Failed to fetch koleksi", error);
        } finally {
          setKoleksiLoading(false);
        }
      };
      fetchKoleksi();
    }
  }, [activeTab, user, koleksiFetched]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error: profErr } = await supabase.from('profiles').update({
        display_name: editData.display_name,
        bio: editData.bio
      }).eq('id', user.id);
      
      if (profErr) throw profErr;

      // Upsert sosmed di user_customizations
      const { error: custErr } = await supabase.from('user_customizations').upsert({
        user_id: user.id,
        discord_username: editData.discord_username,
        instagram_username: editData.instagram_username,
        twitter_username: editData.twitter_username,
        tiktok_username: editData.tiktok_username
      });

      if (custErr) throw custErr;
      
      setProfile({ 
        ...profile, 
        display_name: editData.display_name,
        bio: editData.bio
      });

      setCustoms(prev => ({
        ...prev,
        discord_username: editData.discord_username,
        instagram_username: editData.instagram_username,
        twitter_username: editData.twitter_username,
        tiktok_username: editData.tiktok_username
      }));

      addToast("Profil & Sosial Media berhasil disimpan!", "success");
      setActiveTab("overview");
    } catch (err) {
      addToast("Gagal menyimpan profil: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVipCustomizations = async (e) => {
    e.preventDefault();
    if (!profile?.is_vip) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('user_customizations').upsert({
        user_id: user.id,
        custom_title: vipData.custom_title,
        title_color: vipData.title_color,
        name_color: vipData.name_color,
        badge_text: vipData.badge_text,
        badge_bg_color: vipData.badge_bg_color,
        badge_text_color: vipData.badge_text_color
      });

      if (error) throw error;

      setCustoms(prev => ({
        ...prev,
        ...vipData
      }));

      addToast("Kustomisasi VIP berhasil disimpan!", "success");
      setActiveTab("overview");
    } catch (err) {
      addToast("Gagal menyimpan VIP kustomisasi: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAvatarClick = () => {
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

  const handleEditBannerClick = () => {
    if (!profile?.is_vip) {
      setShowVipModal(true);
      return;
    }
    if (bannerInputRef.current) bannerInputRef.current.click();
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      addToast("Maaf, ukuran foto maksimal adalah 2MB!", "error");
      return;
    }

    try {
      setIsSaving(true);
      const webpFile = await convertToWebP(file);
      const fileName = `${user.id}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, webpFile, { upsert: true });
        
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newUrl = `${data.publicUrl}?v=${Date.now()}`;

      setProfile({...profile, avatar_url: newUrl});
      await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
      addToast("Foto profil berhasil diubah!", "success");
    } catch (err) {
      addToast("Gagal mengupload foto: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      addToast("Maaf, ukuran banner maksimal adalah 2MB!", "error");
      return;
    }

    try {
      setIsSaving(true);
      const webpFile = await convertToWebP(file);
      const fileName = `${user.id}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, webpFile, { upsert: true });
        
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
      const newUrl = `${data.publicUrl}?v=${Date.now()}`;

      setProfile({...profile, banner_url: newUrl});
      await supabase.from('profiles').update({ banner_url: newUrl }).eq('id', user.id);
      addToast("Banner berhasil diubah!", "success");
    } catch (err) {
      addToast("Gagal mengupload banner: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-24 flex items-center justify-center text-white">Loading Profile...</div>;
  }

  const currentLevel = stats?.level || 1;
  const currentXp = stats?.xp_total || 0;
  const nextXp = xpToNextLevel(currentLevel);
  const xpPercent = Math.min(100, (currentXp / nextXp) * 100);

  const displayTitle = customs?.equipped_title || customs?.custom_title || getRankTitle(currentLevel);
  const nameColor = customs?.name_color || "#FFFFFF";
  const titleColor = customs?.title_color || "#ffbade";
  const avatarUrl = profile?.avatar_url || "https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg";
  const bannerUrl = profile?.banner_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2560&auto=format&fit=crop";
  const avatarFrameClass = getAvatarFrameClass(currentLevel, profile?.is_vip, customs, stats);

  const tabsList = profile?.is_vip ? ["overview", "edit", "vip", "koleksi"] : ["overview", "edit", "koleksi"];

  return (
    <div className="min-h-screen pt-16 bg-[#161523] text-white">
      {/* Hidden File Inputs */}
      <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleUploadAvatar} className="hidden" />
      <input type="file" accept="image/*" ref={bannerInputRef} onChange={handleUploadBanner} className="hidden" />

      {/* Banner */}
      <div 
        className="w-full h-64 bg-cover bg-center relative group"
        style={{ backgroundImage: `url('${bannerUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#161523] to-transparent"></div>
        <div 
          onClick={handleEditBannerClick}
          className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
        >
          <FontAwesomeIcon icon={faCamera} className="text-4xl text-white mb-2" />
          <span className="font-bold shadow-black drop-shadow-md">Ganti Banner (VIP)</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20 z-20">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-end text-center md:text-left">
          {/* Avatar with Dynamic Frame */}
          <div className="relative group cursor-pointer" onClick={handleEditAvatarClick}>
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover bg-[#201F31] ${avatarFrameClass}`}
            />
            <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <FontAwesomeIcon icon={faCamera} className="text-3xl text-white" />
            </div>

            {profile?.is_vip && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-md"
                   style={{ backgroundColor: customs?.badge_bg_color || '#6a0dad', color: customs?.badge_text_color || '#fff' }}>
                {customs?.badge_text || "VIP"}
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 pb-4">
            <h1 className="text-3xl font-bold" style={{ color: nameColor }}>
              {profile?.display_name || profile?.username || "Anime Fan"}
            </h1>
            <p className="text-lg font-semibold mt-1" style={{ color: titleColor }}>
              {displayTitle}
            </p>
            <p className="text-sm text-gray-400 mt-1">@{profile?.username || "unknown"}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-4 w-full md:w-auto mt-4 md:mt-0 flex-col md:flex-row">
             <button 
               onClick={() => navigate(`/user/${profile?.username}`)}
               className="px-4 py-2 bg-[#201F31] text-gray-300 hover:text-white border border-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center group"
             >
               <FontAwesomeIcon icon={faEye} className="mr-2 group-hover:text-[#ffbade] transition-colors" /> 
               View Profile
             </button>
             
             {!profile?.is_vip && (
               <button 
                 onClick={() => setShowTrakteerWarning(true)}
                 className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-400 hover:to-yellow-500 border border-yellow-400 rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(250,204,21,0.3)] flex items-center justify-center"
               >
                 <FontAwesomeIcon icon={faCrown} className="mr-2" /> 
                 Upgrade VIP
               </button>
             )}
          </div>
        </div>

        {/* Level & XP Bar */}
        <div className="mt-8 bg-[#201F31] p-6 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-gray-400 text-sm">Current Level</p>
              <p className="text-2xl font-bold text-[#ffbade]">Level {currentLevel}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <button
                onClick={() => {
                  setShowXpHistoryModal(true);
                  fetchRecentXpLogs(user?.id);
                }}
                className="text-xs font-bold text-[#ffbade] hover:text-white bg-[#161523] px-3 py-1.5 rounded-lg border border-[#ffbade]/30 hover:border-[#ffbade] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FontAwesomeIcon icon={faHistory} /> Riwayat 10 XP Terakhir
              </button>
              <p className="font-bold text-sm mt-1">{currentXp} / {nextXp} XP</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#ffbade] to-[#ff7eb3] transition-all duration-500" 
              style={{ width: `${xpPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        {(() => {
          const tabsList = profile?.is_vip 
            ? ["overview", "riwayat", "koleksi", "vip", "edit"]
            : ["overview", "riwayat", "koleksi", "edit"];

          return (
            <div className="mt-8 flex gap-2 border-b border-gray-800 overflow-x-auto custom-scrollbar">
              {tabsList.map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-semibold capitalize whitespace-nowrap transition-colors ${
                    activeTab === tab ? "text-[#ffbade] border-b-2 border-[#ffbade]" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab === "vip" ? "VIP" : tab}
                </button>
              ))}
            </div>
          );
        })()}

        {/* Tab Content */}
        <div className="py-8 min-h-[40vh]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-[#201F31] p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-xl font-bold mb-4">Bio</h2>
                  <p className="text-gray-300 leading-relaxed">
                    {profile?.bio || "User ini belum menuliskan apapun tentang dirinya."}
                  </p>
                </div>
                <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-xl font-bold mb-4">Sosial Media</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faDiscord} className="text-[#5865F2] text-xl w-6" />
                      <p className="text-gray-400 text-sm flex-1">Discord: <span className="text-white font-medium">{customs?.discord_username || '-'}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faInstagram} className="text-[#E1306C] text-xl w-6" />
                      <p className="text-gray-400 text-sm flex-1">Instagram: <span className="text-white font-medium">{customs?.instagram_username || '-'}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faTwitter} className="text-[#1DA1F2] text-xl w-6" />
                      <p className="text-gray-400 text-sm flex-1">Twitter/X: <span className="text-white font-medium">{customs?.twitter_username || '-'}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faTiktok} className="text-white text-xl w-6" />
                      <p className="text-gray-400 text-sm flex-1">TikTok: <span className="text-white font-medium">{customs?.tiktok_username || '-'}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Perhitungan XP (XP Breakdown) */}
              <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="text-[#ffbade]" /> Perolehan XP & Statistik Aktivitas
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="bg-[#161523] p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">Comments</p>
                    <p className="text-md font-bold text-white">{stats?.comments_count || 0} × 25 XP</p>
                    <p className="text-xs text-[#ffbade] font-semibold mt-1">{(stats?.comments_count || 0) * 25} XP</p>
                  </div>
                  <div className="bg-[#161523] p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">Live Chat</p>
                    <p className="text-md font-bold text-white">{stats?.live_chat_count || 0} × 5 XP</p>
                    <p className="text-xs text-[#ffbade] font-semibold mt-1">{(stats?.live_chat_count || 0) * 5} XP</p>
                  </div>
                  <div className="bg-[#161523] p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">Episodes Watched</p>
                    <p className="text-md font-bold text-white">{stats?.episodes_watched || 0} × 10 XP</p>
                    <p className="text-xs text-[#ffbade] font-semibold mt-1">{(stats?.episodes_watched || 0) * 10} XP</p>
                  </div>
                  <div className="bg-[#161523] p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">Chapters Read</p>
                    <p className="text-md font-bold text-white">{stats?.chapters_read || 0} × 5 XP</p>
                    <p className="text-xs text-[#ffbade] font-semibold mt-1">{(stats?.chapters_read || 0) * 5} XP</p>
                  </div>
                  <div className="bg-[#161523] p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">Likes Given</p>
                    <p className="text-md font-bold text-white">{stats?.likes_count || 0} × 5 XP</p>
                    <p className="text-xs text-[#ffbade] font-semibold mt-1">{(stats?.likes_count || 0) * 5} XP</p>
                  </div>
                  <div className="bg-[#161523] p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">Bookmarks</p>
                    <p className="text-md font-bold text-white">{stats?.bookmarks_count || 0} × 3 XP</p>
                    <p className="text-xs text-[#ffbade] font-semibold mt-1">{(stats?.bookmarks_count || 0) * 3} XP</p>
                  </div>
                </div>

                {/* Information Box: Aturan & Batas Maksimal XP Harian (Daily Cap Rules) */}
                <div className="mt-6 bg-[#161523] p-5 rounded-xl border border-gray-800 text-left">
                  <h3 className="text-sm font-bold text-[#ffbade] mb-3 flex items-center gap-2">
                    📜 Aturan & Batas Maksimal XP Harian (Anti-Spam & Fair Play)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-300">
                    <div className="bg-[#201F31] p-3 rounded-lg border border-gray-800/80">
                      <span className="font-bold text-white block mb-0.5">💬 Komentar</span>
                      <span>Max 8x / hari (+25 XP/komentar) ➔ <strong className="text-[#ffbade]">Max 200 XP</strong></span>
                    </div>
                    <div className="bg-[#201F31] p-3 rounded-lg border border-gray-800/80">
                      <span className="font-bold text-white block mb-0.5">🗨️ Live Chat</span>
                      <span>Max 10x / hari (+5 XP/pesan) ➔ <strong className="text-[#ffbade]">Max 50 XP</strong></span>
                    </div>
                    <div className="bg-[#201F31] p-3 rounded-lg border border-gray-800/80">
                      <span className="font-bold text-white block mb-0.5">🎬 Nonton Episode</span>
                      <span>Max 10x / hari (+10 XP/ep) ➔ <strong className="text-[#ffbade]">Max 100 XP</strong></span>
                    </div>
                    <div className="bg-[#201F31] p-3 rounded-lg border border-gray-800/80">
                      <span className="font-bold text-white block mb-0.5">📖 Baca Komik</span>
                      <span>Max 10x / hari (+5 XP/ch) ➔ <strong className="text-[#ffbade]">Max 50 XP</strong></span>
                    </div>
                    <div className="bg-[#201F31] p-3 rounded-lg border border-gray-800/80">
                      <span className="font-bold text-white block mb-0.5">👍 Suka / Like</span>
                      <span>Max 10x / hari (+5 XP/like) ➔ <strong className="text-[#ffbade]">Max 50 XP</strong></span>
                    </div>
                    <div className="bg-[#201F31] p-3 rounded-lg border border-gray-800/80">
                      <span className="font-bold text-white block mb-0.5">⭐ Bookmark</span>
                      <span>Max 5x / hari (+3 XP/bookmark) ➔ <strong className="text-[#ffbade]">Max 15 XP</strong></span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3 italic">
                    * Total maksimal XP harian yang bisa didapatkan adalah <strong>465 XP / hari</strong>. Batas harian ter-reset otomatis setiap tengah malam (00:00 WIB).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "edit" && (
            <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 max-w-2xl mx-auto md:mx-0 text-left">
              <h2 className="text-xl font-bold mb-6">Edit Profil & Sosial Media</h2>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                  <input type="text" value={editData.display_name} onChange={e => setEditData({...editData, display_name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all min-h-[90px]" placeholder="Ceritakan tentang dirimu..." />
                </div>

                <hr className="border-gray-800 my-2" />
                <h3 className="text-md font-bold text-gray-300">Akun Sosial Media</h3>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username Discord</label>
                  <input type="text" placeholder="misal: user#1234" value={editData.discord_username} onChange={e => setEditData({...editData, discord_username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username Instagram</label>
                  <input type="text" placeholder="misal: @username" value={editData.instagram_username} onChange={e => setEditData({...editData, instagram_username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username Twitter / X</label>
                  <input type="text" placeholder="misal: @username" value={editData.twitter_username} onChange={e => setEditData({...editData, twitter_username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username TikTok</label>
                  <input type="text" placeholder="misal: @username" value={editData.tiktok_username} onChange={e => setEditData({...editData, tiktok_username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all text-sm" />
                </div>

                <button type="submit" disabled={isSaving} className="w-full bg-[#ffbade] text-black font-bold py-3 rounded-xl mt-4 hover:bg-[#ff99cc] transition-colors disabled:opacity-50">
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "vip" && profile?.is_vip && (
            <div className="bg-[#201F31] p-6 rounded-2xl border border-yellow-500/40 max-w-2xl mx-auto md:mx-0 text-left shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <h2 className="text-xl font-bold mb-2 text-yellow-400 flex items-center gap-2">
                <FontAwesomeIcon icon={faCrown} /> VIP Customization Panel
              </h2>
              <p className="text-xs text-gray-400 mb-6">Atur tampilan kustom kamu di Live Chat, Komentar, dan Profil Publik.</p>

              <form onSubmit={handleSaveVipCustomizations} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Gelar Kustom (Custom Title)</label>
                  <input type="text" placeholder="misal: Raja Isekai" value={vipData.custom_title} onChange={e => setVipData({...vipData, custom_title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-yellow-400 focus:outline-none transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Warna Gelar (Title Color)</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={vipData.title_color} onChange={e => setVipData({...vipData, title_color: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                      <input type="text" value={vipData.title_color} onChange={e => setVipData({...vipData, title_color: e.target.value})} className="flex-1 px-3 py-2 rounded-xl bg-[#2D2B44] text-white text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Warna Nama (Name Color)</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={vipData.name_color} onChange={e => setVipData({...vipData, name_color: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                      <input type="text" value={vipData.name_color} onChange={e => setVipData({...vipData, name_color: e.target.value})} className="flex-1 px-3 py-2 rounded-xl bg-[#2D2B44] text-white text-sm" />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-800 my-2" />
                <h3 className="text-md font-bold text-gray-300">Pengaturan Badge Kustom</h3>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teks Badge (Badge Text)</label>
                  <input type="text" placeholder="VIP / PRO / KING" value={vipData.badge_text} onChange={e => setVipData({...vipData, badge_text: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-yellow-400 focus:outline-none transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Warna Latar Badge</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={vipData.badge_bg_color} onChange={e => setVipData({...vipData, badge_bg_color: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                      <input type="text" value={vipData.badge_bg_color} onChange={e => setVipData({...vipData, badge_bg_color: e.target.value})} className="flex-1 px-3 py-2 rounded-xl bg-[#2D2B44] text-white text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Warna Teks Badge</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={vipData.badge_text_color} onChange={e => setVipData({...vipData, badge_text_color: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                      <input type="text" value={vipData.badge_text_color} onChange={e => setVipData({...vipData, badge_text_color: e.target.value})} className="flex-1 px-3 py-2 rounded-xl bg-[#2D2B44] text-white text-sm" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-lg disabled:opacity-50">
                  {isSaving ? "Menyimpan..." : "Simpan Kustomisasi VIP"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "riwayat" && (
            <div className="space-y-8 text-left">
              {/* Category Filter Pills */}
              <div className="flex gap-2 bg-[#1A1927] p-1.5 rounded-xl border border-gray-800 w-full max-w-full overflow-x-auto custom-scrollbar flex-nowrap">
                {[
                  { id: "all", label: "Semua Kategori" },
                  { id: "anime", label: "📺 Anime" },
                  { id: "comic", label: "📖 Komik" },
                  { id: "donghua", label: "🐉 Donghua" },
                  { id: "film", label: "🎬 Film" }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setRiwayatFilter(filter.id)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                      riwayatFilter === filter.id
                        ? "bg-[#ffbade] text-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {koleksiLoading ? (
                <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffbade]"></div></div>
              ) : (
                <>
                  {/* Watch History */}
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faHistory} /> Terakhir Ditonton</h2>
                    {(() => {
                      const filteredHistory = riwayatFilter === "all" 
                        ? history 
                        : history.filter(i => (i.details?.mediaType || 'anime') === riwayatFilter);

                      if (filteredHistory.length === 0) {
                        return (
                          <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
                            <p className="text-gray-400">Riwayat tontonan kosong untuk kategori ini</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
                          {filteredHistory.map((item) => {
                            const mediaType = item.details?.mediaType || 'anime';
                            let targetUrl = `/watch/${item.anime_id}?ep=${item.episode_id}`;
                            if (mediaType === 'comic') {
                              targetUrl = `/comic/read/${item.episode_id || item.anime_id}`;
                            } else if (mediaType === 'film') {
                              targetUrl = item.episode_id && item.episode_id !== item.anime_id
                                ? `/film/watch/${item.anime_id}?epId=${encodeURIComponent(item.episode_id)}`
                                : `/film/watch/${item.anime_id}`;
                            } else if (mediaType === 'donghua') {
                              targetUrl = `/donghua/watch/${item.anime_id}?ep=${encodeURIComponent(item.episode_id)}`;
                            }

                            const epStr = String(item.episode_id || '');
                            let cleanEp = '';

                            if (mediaType === 'film' && (!item.episode_id || item.episode_id === item.anime_id)) {
                              cleanEp = 'Movie';
                            } else {
                              const match = epStr.match(/(?:episode|chapter|ep)[-_=\s]*(\d+)/i) 
                                || epStr.match(/(?:__|_|-)(\d+)$/) 
                                || epStr.match(/(\d+)/);
                              if (match) {
                                const num = parseInt(match[1], 10);
                                cleanEp = isNaN(num) ? match[1] : String(num);
                              } else {
                                cleanEp = epStr.replace(/^chapter-|^episode-|^ep=/i, '');
                              }
                            }

                            let label = '';
                            if (cleanEp === 'Movie') {
                              label = 'Movie';
                            } else if (mediaType === 'comic') {
                              label = `Ch. ${cleanEp}`;
                            } else {
                              label = `Ep ${cleanEp}`;
                            }

                            return (
                              <div key={`hist-${item.anime_id}-${item.episode_id}`} className="bg-[#201F31] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#ffbade] transition-all relative group" onClick={() => navigate(targetUrl)}>
                                {/* Category Badge */}
                                <div className="absolute top-1.5 left-1.5 z-20 pointer-events-none">
                                  {mediaType === 'comic' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-green-500 text-black shadow">KOMIK</span>}
                                  {mediaType === 'film' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-yellow-500 text-black shadow">FILM</span>}
                                  {mediaType === 'donghua' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-purple-500 text-white shadow">DONGHUA</span>}
                                  {mediaType === 'anime' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-[#ffbade] text-black shadow">ANIME</span>}
                                </div>

                                <button
                                  onClick={(e) => handleDeleteHistory(e, item)}
                                  className="absolute top-1.5 right-1.5 z-20 bg-red-600/90 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  title="Hapus dari Riwayat"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                                <div className="relative aspect-[3/4]">
                                  <img src={item.details?.poster || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="} alt={item.details?.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] md:text-xs p-1 text-center font-bold truncate">
                                    {label}
                                  </div>
                                </div>
                                <div className="p-2 truncate text-xs md:text-sm font-semibold text-center">{item.details?.title || item.anime_id}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Watchlist */}
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faStar} /> Watchlist & Favorit</h2>
                    {(() => {
                      const filteredWatchlist = riwayatFilter === "all" 
                        ? watchlist 
                        : watchlist.filter(i => (i.details?.mediaType || 'anime') === riwayatFilter);

                      if (filteredWatchlist.length === 0) {
                        return (
                          <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
                            <p className="text-gray-400">Belum ada tayangan / komik favorit di kategori ini</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
                          {filteredWatchlist.map((item) => {
                            const mediaType = item.details?.mediaType || 'anime';
                            let targetUrl = `/${item.anime_id}`;
                            if (mediaType === 'comic') targetUrl = `/comic/${item.anime_id}`;
                            else if (mediaType === 'film') targetUrl = `/film/${item.anime_id}`;
                            else if (mediaType === 'donghua') targetUrl = `/donghua/${item.anime_id}`;

                            return (
                              <div key={`fav-${item.anime_id}`} className="bg-[#201F31] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#ffbade] transition-all relative group" onClick={() => navigate(targetUrl)}>
                                {/* Category Badge */}
                                <div className="absolute top-1.5 left-1.5 z-20 pointer-events-none">
                                  {mediaType === 'comic' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-green-500 text-black shadow">KOMIK</span>}
                                  {mediaType === 'film' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-yellow-500 text-black shadow">FILM</span>}
                                  {mediaType === 'donghua' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-purple-500 text-white shadow">DONGHUA</span>}
                                  {mediaType === 'anime' && <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-[#ffbade] text-black shadow">ANIME</span>}
                                </div>

                                <button
                                  onClick={(e) => handleDeleteWatchlist(e, item)}
                                  className="absolute top-1.5 right-1.5 z-20 bg-red-600/90 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  title="Hapus dari Watchlist"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                                <div className="relative aspect-[3/4]">
                                  <img src={item.details?.poster || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="} alt={item.details?.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-2 truncate text-xs md:text-sm font-semibold text-center">{item.details?.title || item.anime_id}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "koleksi" && (
            <div className="space-y-6 text-left">
              {/* Sub Tabs */}
              <div className="flex gap-2 bg-[#1A1927] p-1.5 rounded-xl border border-gray-800 w-full max-w-full overflow-x-auto custom-scrollbar flex-nowrap">
                {[
                  { id: "bingkai", label: "🖼️ Bingkai Avatar" },
                  { id: "gelar", label: "🏷️ Gelar Spesial" },
                  { id: "pencapaian", label: "🏆 Pencapaian (Achievements)" }
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setKoleksiSubTab(st.id)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                      koleksiSubTab === st.id
                        ? "bg-[#ffbade] text-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Sub Tab 1: Bingkai */}
              {koleksiSubTab === "bingkai" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {FRAME_LIST.map(frame => {
                    const unlocked = isItemUnlocked(frame, currentLevel, profile?.is_vip, stats);
                    const isEquipped = customs?.equipped_frame === frame.id || (!customs?.equipped_frame && frame.id === getAvatarFrameClass(currentLevel, profile?.is_vip));

                    return (
                      <div key={frame.id} className={`bg-[#201F31] p-4 rounded-2xl border ${isEquipped ? "border-[#ffbade] shadow-[0_0_15px_rgba(255,186,222,0.2)]" : "border-gray-800"} flex flex-col justify-between`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{frame.icon}</span>
                            {isEquipped ? (
                              <span className="px-2.5 py-1 text-[11px] font-black rounded-full bg-[#ffbade] text-black">DIPAKAI ✅</span>
                            ) : unlocked ? (
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">TERBUKA</span>
                            ) : (
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-800 text-gray-400 border border-gray-700">TERKUNCI 🔒</span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-md mb-1">{frame.name}</h4>
                          <p className="text-xs text-gray-400 leading-relaxed mb-4">{frame.desc}</p>
                        </div>

                        {unlocked ? (
                          <button
                            onClick={() => handleEquipItem("frame", frame.id)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                              isEquipped 
                                ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                                : "bg-[#ffbade] hover:bg-[#ff99cc] text-black"
                            }`}
                          >
                            {isEquipped ? "Lepas Bingkai" : "Pasang Bingkai"}
                          </button>
                        ) : (
                          <div className="w-full py-2.5 bg-black/40 text-center rounded-xl font-semibold text-xs text-gray-500 border border-gray-800">
                            {frame.reqType === "vip" ? "Khusus VIP Member" : `Syarat: ${frame.desc}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub Tab 2: Gelar */}
              {koleksiSubTab === "gelar" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {TITLE_LIST.map(t => {
                    const unlocked = isItemUnlocked(t, currentLevel, profile?.is_vip, stats);
                    const isEquipped = customs?.equipped_title === t.id;

                    return (
                      <div key={t.id} className={`bg-[#201F31] p-4 rounded-2xl border ${isEquipped ? "border-[#ffbade] shadow-[0_0_15px_rgba(255,186,222,0.2)]" : "border-gray-800"} flex flex-col justify-between`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{t.icon}</span>
                            {isEquipped ? (
                              <span className="px-2.5 py-1 text-[11px] font-black rounded-full bg-[#ffbade] text-black">DIPAKAI ✅</span>
                            ) : unlocked ? (
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">TERBUKA</span>
                            ) : (
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-800 text-gray-400 border border-gray-700">TERKUNCI 🔒</span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-md mb-1">{t.name}</h4>
                          <p className="text-xs text-gray-400 mb-4">Syarat: {t.reqValue} {t.reqType}</p>
                        </div>

                        {unlocked ? (
                          <button
                            onClick={() => handleEquipItem("title", t.id)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                              isEquipped 
                                ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                                : "bg-[#ffbade] hover:bg-[#ff99cc] text-black"
                            }`}
                          >
                            {isEquipped ? "Lepas Gelar" : "Pasang Gelar"}
                          </button>
                        ) : (
                          <div className="w-full py-2.5 bg-black/40 text-center rounded-xl font-semibold text-xs text-gray-500 border border-gray-800">
                            Belum Memenuhi Syarat
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub Tab 3: Pencapaian */}
              {koleksiSubTab === "pencapaian" && (
                <div className="space-y-4">
                  {ACHIEVEMENT_LIST.map(ach => {
                    const currentProgress = stats ? (stats[ach.reqType] || 0) : 0;
                    const progressPercent = Math.min(100, Math.floor((currentProgress / ach.target) * 100));
                    const isDone = currentProgress >= ach.target;

                    return (
                      <div key={ach.id} className="bg-[#201F31] p-5 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">{isDone ? "🏆" : "🎯"}</span>
                            <div>
                              <h4 className="font-bold text-white text-base">{ach.title}</h4>
                              <p className="text-xs text-gray-400">{ach.desc}</p>
                            </div>
                          </div>
                          <div className="mt-3 w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-[#ffbade] to-green-400 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1 font-semibold">{currentProgress} / {ach.target} ({progressPercent}%)</p>
                        </div>

                        <div>
                          {isDone ? (
                            <span className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 font-bold text-xs border border-green-500/30 flex items-center gap-1.5">
                              ✅ SELESAI
                            </span>
                          ) : (
                            <span className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 font-semibold text-xs border border-gray-700">
                              DALAM PROSES
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom VIP Modal */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2D2B44] border border-[#ffbade] rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl transform transition-all">
            <div className="w-16 h-16 bg-[#161523] rounded-full mx-auto flex items-center justify-center mb-4 border-2 border-[#ffbade]">
              <FontAwesomeIcon icon={faStar} className="text-[#ffbade] text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fitur Khusus VIP!</h3>
            <p className="text-gray-300 mb-6 text-sm">
              Maaf, fitur mengganti banner profil keren ini hanya eksklusif untuk member VIP NEETflix. Jadilah VIP sekarang!
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowVipModal(false)}
                className="flex-1 px-4 py-3 bg-[#161523] text-gray-300 hover:text-white rounded-xl font-semibold transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  setShowVipModal(false);
                  addToast("Sistem pembayaran VIP belum aktif.", "error");
                }}
                className="flex-1 px-4 py-3 bg-[#ffbade] text-black hover:bg-[#ff99cc] rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(255,186,222,0.4)]"
              >
                Upgrade VIP
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Trakteer Warning Modal */}
      {showTrakteerWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A24] p-6 rounded-2xl w-full max-w-md border border-yellow-500/30 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <FontAwesomeIcon icon={faCrown} /> Perhatian!
              </h3>
            </div>
            <div className="text-gray-300 space-y-4 text-sm leading-relaxed mb-6 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
              <p>
                Anda akan dialihkan ke halaman Trakteer. Agar sistem otomatis mendeteksi pembayaran Anda, mohon pastikan:
              </p>
              <ul className="list-disc pl-5 space-y-2 font-medium text-white">
                <li>Anda <strong>WAJIB</strong> menuliskan email Anda di dalam kolom <strong>"Pesan Dukungan"</strong> saat membayar.</li>
                <li>Gunakan email yang <strong>SAMA</strong> dengan akun Anda saat ini: <br/><span className="text-yellow-400 break-all bg-black/50 px-2 py-1 rounded select-all mt-1 inline-block">{user?.email}</span></li>
              </ul>
              <p className="text-gray-400 mt-2">
                Jika Anda tidak menuliskan email di dalam kotak pesan, sistem kami tidak akan bisa mengenali pembayaran Anda dan status VIP tidak akan masuk otomatis.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowTrakteerWarning(false)}
                className="flex-1 py-3 bg-[#2B2A3C] hover:bg-[#3d3c52] text-white rounded-xl font-bold transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  setShowTrakteerWarning(false);
                  window.open("https://trakteer.id/NEETflix/rewards", "_blank");
                }}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white rounded-xl font-bold transition-all"
              >
                Lanjut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphism XP History Modal (Option 1) */}
      {showXpHistoryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#1A1927]/90 border border-[#ffbade]/40 rounded-3xl w-full max-w-lg p-6 shadow-[0_0_30px_rgba(255,186,222,0.15)] relative overflow-hidden">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faHistory} className="text-[#ffbade]" />
                Riwayat 10 Perolehan XP Terakhir
              </h3>
              <button
                onClick={() => setShowXpHistoryModal(false)}
                className="text-gray-400 hover:text-white bg-black/40 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {xpLogsLoading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffbade]"></div>
              </div>
            ) : xpLogsList.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Belum ada catatan riwayat perolehan XP. Cobalah menonton, membaca komik, atau berkomentar!
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {xpLogsList.map((log) => {
                  let icon = "⭐";
                  let label = "Aktivitas";
                  if (log.action_type === "comment") { icon = "💬"; label = "Comments & Replies"; }
                  else if (log.action_type === "watch_episode") { icon = "🎬"; label = "Episodes Watched"; }
                  else if (log.action_type === "read_chapter") { icon = "📖"; label = "Chapters Read"; }
                  else if (log.action_type === "like") { icon = "👍"; label = "Likes Given"; }
                  else if (log.action_type === "bookmark") { icon = "📌"; label = "Bookmarks / Favorit"; }

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3.5 bg-[#201F31]/80 rounded-2xl border border-gray-800/80 hover:border-[#ffbade]/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-100">{label}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(log.created_at).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#ffbade]/15 text-[#ffbade] font-black text-sm rounded-full border border-[#ffbade]/30">
                        +{log.xp_amount} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-gray-800 text-center">
              <button
                onClick={() => setShowXpHistoryModal(false)}
                className="w-full py-2.5 bg-[#201F31] hover:bg-[#2D2B44] text-gray-300 font-semibold rounded-xl transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
