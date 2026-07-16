import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faStar, faHistory, faSignOutAlt, faCamera, faShareAlt, faCrown } from "@fortawesome/free-solid-svg-icons";
import { faDiscord, faInstagram, faTwitter, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { useToast } from "../../context/ToastContext";
import getAnimeInfo from "../../utils/getAnimeInfo.utils";

const xpToNextLevel = (level) => {
  return level * 100; // Simple curve: level 1 needs 100, level 2 needs 200, etc.
};

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

const getRankTitle = (level) => {
  if (level >= 999) return "NEETflix Lovers 👑";
  if (level >= 800) return "Kami-sama";
  if (level >= 500) return "Isekai Protagonist";
  if (level >= 200) return "Hikikomori";
  if (level >= 100) return "Weaboo";
  if (level >= 50) return "Otaku";
  if (level >= 30) return "Anime Fan";
  if (level >= 10) return "Novice Watcher";
  return "Villager";
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
    bio: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showTrakteerWarning, setShowTrakteerWarning] = useState(false);
  const { addToast } = useToast();

  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [koleksiLoading, setKoleksiLoading] = useState(false);
  const [koleksiFetched, setKoleksiFetched] = useState(false);

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
        setEditData({
          display_name: profRes.data.display_name || profRes.data.username || "",
          bio: profRes.data.bio || ""
        });
      }
      if (statsRes.data) setStats(statsRes.data);
      if (custRes.data) setCustoms(custRes.data);
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "koleksi" && !koleksiFetched && user) {
      const fetchKoleksi = async () => {
        setKoleksiLoading(true);
        try {
          // Fetch from Supabase
          const [favRes, histRes] = await Promise.all([
            supabase.from('bookmarks_favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('watch_history').select('*').eq('user_id', user.id).order('watched_at', { ascending: false }).limit(10)
          ]);

          const favItems = favRes.data || [];
          const histItems = histRes.data || [];

          // Fetch details from AniList
          const fetchDetails = async (items) => {
            return Promise.all(items.map(async (item) => {
              try {
                const info = await getAnimeInfo(item.anime_id);
                return { ...item, details: info?.data };
              } catch (e) {
                return item;
              }
            }));
          };

          const [favWithDetails, histWithDetails] = await Promise.all([
            fetchDetails(favItems),
            fetchDetails(histItems)
          ]);

          setWatchlist(favWithDetails.filter(i => i.details));
          setHistory(histWithDetails.filter(i => i.details));
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
      const { error } = await supabase.from('profiles').update({
        display_name: editData.display_name,
        bio: editData.bio
      }).eq('id', user.id);
      
      if (error) throw error;
      
      setProfile({ 
        ...profile, 
        display_name: editData.display_name,
        bio: editData.bio
      });
      addToast("Profil berhasil disimpan!", "success");
      setActiveTab("overview");
    } catch (err) {
      addToast("Gagal menyimpan profil: " + err.message, "error");
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
    
    // Batas ukuran 2MB
    if (file.size > 2 * 1024 * 1024) {
      addToast("Maaf, ukuran foto maksimal adalah 2MB!", "error");
      return;
    }

    try {
      setIsSaving(true);
      
      // Konversi otomatis ke WEBP
      const webpFile = await convertToWebP(file);
      
      // Nama file dibuat statis berdasarkan user ID agar selalu menimpa file lama
      const fileName = `${user.id}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, webpFile, { upsert: true }); // UPSERT: Tindih file lama!
        
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      // Tambahkan ?v=waktu untuk memaksa browser merefresh cache gambar
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
      
      // Konversi otomatis ke WEBP
      const webpFile = await convertToWebP(file);
      
      // Nama file statis untuk menimpa file lama
      const fileName = `${user.id}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, webpFile, { upsert: true }); // UPSERT: Tindih file lama!
        
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
      // Tambahkan ?v=waktu untuk memaksa browser merefresh cache gambar
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

  const displayTitle = customs?.custom_title || getRankTitle(currentLevel);
  const nameColor = customs?.name_color || "#FFFFFF";
  const titleColor = customs?.title_color || "#ffbade";
  const avatarUrl = profile?.avatar_url || "https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg"; // Default anime blank avatar
  const bannerUrl = profile?.banner_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2560&auto=format&fit=crop";

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
        {/* Overlay Edit Banner */}
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
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={handleEditAvatarClick}>
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#161523] object-cover bg-[#201F31]"
            />
            {/* Overlay Edit Avatar */}
            <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-4 border-transparent">
              <FontAwesomeIcon icon={faCamera} className="text-3xl text-white" />
            </div>

            {profile?.is_vip && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
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
               onClick={() => {
                 const url = `${window.location.origin}/user/${profile?.username}`;
                 navigator.clipboard.writeText(url);
                 addToast("Link profil publik disalin!", "success");
               }} 
               className="px-4 py-2 bg-[#201F31] text-gray-300 hover:text-white border border-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center"
             >
               <FontAwesomeIcon icon={faShareAlt} className="mr-2" /> 
               Bagikan Profil
             </button>
             
             {/* Upgrade VIP Button */}
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
            <div className="text-right">
              <p className="text-gray-400 text-sm">Experience</p>
              <p className="font-bold">{currentXp} / {nextXp} XP</p>
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
        <div className="mt-8 flex gap-2 border-b border-gray-800 overflow-x-auto custom-scrollbar">
          {["overview", "edit", "koleksi"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? "text-[#ffbade] border-b-2 border-[#ffbade]" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-8 min-h-[40vh]">
          {activeTab === "overview" && (
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
          )}

          {activeTab === "edit" && (
            <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 max-w-2xl mx-auto md:mx-0 text-left">
              <h2 className="text-xl font-bold mb-6">Edit Profil</h2>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                  <input type="text" value={editData.display_name} onChange={e => setEditData({...editData, display_name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all min-h-[100px]" placeholder="Ceritakan tentang dirimu..." />
                </div>
                <button type="submit" disabled={isSaving} className="w-full bg-[#ffbade] text-black font-bold py-3 rounded-xl mt-4 hover:bg-[#ff99cc] transition-colors disabled:opacity-50">
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "koleksi" && (
            <div className="space-y-8">
              {koleksiLoading ? (
                <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffbade]"></div></div>
              ) : (
                <>
                  {/* Watch History */}
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faHistory} /> Terakhir Ditonton</h2>
                    {history.length === 0 ? (
                      <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
                        <p className="text-gray-400">Riwayat tontonan kosong</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {history.map((item) => (
                          <div key={`hist-${item.anime_id}`} className="bg-[#201F31] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#ffbade] transition-all" onClick={() => navigate(`/watch/${item.anime_id}?ep=${item.episode_id}`)}>
                            <div className="relative aspect-[3/4]">
                              <img src={item.details?.poster} alt={item.details?.title} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center font-bold">
                                {item.episode_id?.match(/episode-(\d+)/i)?.[1] ? `Episode ${item.episode_id.match(/episode-(\d+)/i)[1]}` : item.episode_id}
                              </div>
                            </div>
                            <div className="p-2 truncate text-sm font-semibold text-center">{item.details?.title}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Watchlist */}
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faStar} /> Watchlist Anime</h2>
                    {watchlist.length === 0 ? (
                      <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
                        <p className="text-gray-400">Belum ada anime favorit</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {watchlist.map((item) => (
                          <div key={`fav-${item.anime_id}`} className="bg-[#201F31] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#ffbade] transition-all" onClick={() => navigate(`/${item.anime_id}`)}>
                            <div className="relative aspect-[3/4]">
                              <img src={item.details?.poster} alt={item.details?.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2 truncate text-sm font-semibold text-center">{item.details?.title}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
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

    </div>
  );
}
