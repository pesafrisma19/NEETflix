import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faHistory } from "@fortawesome/free-solid-svg-icons";
import { faDiscord, faInstagram, faTwitter, faTiktok } from "@fortawesome/free-brands-svg-icons";

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

const xpToNextLevel = (level) => level * 100;

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [customs, setCustoms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      // Cari profile berdasarkan username (case-insensitive)
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();
        
      if (profError || !profData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      setProfile(profData);
      
      // Ambil stats dan customs menggunakan ID dari profile yang ditemukan
      const [statsRes, custRes] = await Promise.all([
        supabase.from('user_stats').select('*').eq('user_id', profData.id).single(),
        supabase.from('user_customizations').select('*').eq('user_id', profData.id).single()
      ]);
      
      if (statsRes.data) setStats(statsRes.data);
      if (custRes.data) setCustoms(custRes.data);
      
      setLoading(false);
    };

    fetchPublicProfile();
  }, [username]);

  if (loading) {
    return <div className="min-h-screen pt-24 flex items-center justify-center text-white">Loading Profile...</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-bold text-[#ffbade] mb-4">404</h1>
        <p className="text-xl">User dengan username <span className="font-bold">@{username}</span> tidak ditemukan.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-[#ffbade] text-black font-bold rounded-xl hover:bg-[#ff99cc] transition-colors">Kembali ke Beranda</button>
      </div>
    );
  }

  const currentLevel = stats?.level || 1;
  const currentXp = stats?.xp_total || 0;
  const nextXp = xpToNextLevel(currentLevel);
  const xpPercent = Math.min(100, (currentXp / nextXp) * 100);

  const displayTitle = customs?.custom_title || getRankTitle(currentLevel);
  const nameColor = customs?.name_color || "#FFFFFF";
  const titleColor = customs?.title_color || "#ffbade";
  const avatarUrl = profile?.avatar_url || "https://i.pinimg.com/736x/c0/27/be/c027bec07c2dc08b9df60921dfd539bd.jpg";
  const bannerUrl = profile?.banner_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2560&auto=format&fit=crop";

  return (
    <div className="min-h-screen pt-16 bg-[#161523] text-white">
      {/* Banner */}
      <div 
        className="w-full h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url('${bannerUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#161523] to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20 z-20">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-end text-center md:text-left">
          {/* Avatar */}
          <div className="relative">
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#161523] object-cover bg-[#201F31]"
            />
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
        </div>

        {/* Level & XP Bar */}
        <div className="mt-8 bg-[#201F31] p-6 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-gray-400 text-sm">Level</p>
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
          {["overview", "koleksi"].map(tab => (
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
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
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

          {activeTab === "koleksi" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center min-h-[200px]">
                <FontAwesomeIcon icon={faHistory} className="text-4xl text-gray-600 mb-3" />
                <p className="text-gray-400">Riwayat tontonan disembunyikan</p>
              </div>
              <div className="bg-[#201F31] p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center min-h-[200px]">
                <FontAwesomeIcon icon={faStar} className="text-4xl text-gray-600 mb-3" />
                <p className="text-gray-400">Daftar anime favorit disembunyikan</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
