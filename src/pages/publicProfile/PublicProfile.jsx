import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faHistory, faLock, faShieldAlt, faCrown } from "@fortawesome/free-solid-svg-icons";
import { faDiscord, faInstagram, faTwitter, faTiktok } from "@fortawesome/free-brands-svg-icons";

import { getRankTitle, xpToNextLevel, getAvatarFrameClass } from "../../utils/xp.utils";

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

  const avatarFrameClass = getAvatarFrameClass(currentLevel, profile?.is_vip);

  return (
    <div className="min-h-screen pt-16 bg-[#161523] text-white">
      {/* Banner */}
      <div 
        className="w-full h-72 bg-cover bg-center relative"
        style={{ backgroundImage: `url('${bannerUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#161523] via-[#161523]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-28 z-20">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end text-center md:text-left">
          {/* Avatar with Dynamic Frame & Discord-Style Glowing Crown */}
          <div className="relative group">
            {profile?.is_vip && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl md:text-4xl z-30 vip-crown-glow">
                <FontAwesomeIcon icon={faCrown} className="text-yellow-400" />
              </div>
            )}
            <div className={`absolute -inset-1 rounded-full blur opacity-40 ${profile?.is_vip ? 'bg-gradient-to-r from-[#ffbade] via-amber-400 to-[#ff7eb3]' : 'bg-gray-600'} transition duration-1000 group-hover:opacity-70`}></div>
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className={`relative w-36 h-36 md:w-44 md:h-44 rounded-full object-cover bg-[#201F31] shadow-2xl z-10 ${avatarFrameClass}`}
            />
            {profile?.is_vip && (
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black shadow-lg z-20 tracking-wider flex items-center gap-1.5 border border-amber-300/40"
                   style={{ backgroundColor: customs?.badge_bg_color || '#6a0dad', color: customs?.badge_text_color || '#fff', boxShadow: `0 4px 14px 0 ${customs?.badge_bg_color || '#6a0dad'}80` }}>
                <FontAwesomeIcon icon={faCrown} className="text-yellow-300 text-xs" />
                {customs?.badge_text || "VIP"}
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 pb-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md" style={{ color: nameColor }}>
              {profile?.display_name || profile?.username || "Anime Fan"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
              <span className="px-3 py-1 bg-[#201F31] rounded-lg text-sm font-bold shadow-inner" style={{ color: titleColor }}>
                {displayTitle}
              </span>
              <span className="text-sm font-medium text-gray-500 bg-black/30 px-3 py-1 rounded-lg">
                @{profile?.username || "unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Level & XP Bar */}
        <div className="mt-8 bg-gradient-to-br from-[#201F31] to-[#1A1927] p-8 rounded-3xl border border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffbade] opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Current Status</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffbade] to-[#ff7eb3]">
                  Level {currentLevel}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Experience</p>
              <p className="font-bold text-lg text-gray-200">{currentXp} <span className="text-gray-500 text-sm">/ {nextXp} XP</span></p>
            </div>
          </div>
          <div className="w-full h-4 bg-[#161523] rounded-full overflow-hidden shadow-inner relative z-10">
            <div 
              className="h-full bg-gradient-to-r from-[#ffbade] to-[#ff7eb3] rounded-full relative" 
              style={{ width: `${xpPercent}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InBhdHRlcm4iIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDAgMEw0MCAwaC00MEwyMCA0MHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')] opacity-20 animate-[slide_2s_linear_infinite]"></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex gap-4 border-b border-gray-800/80 overflow-x-auto custom-scrollbar pb-2">
          {["overview", "koleksi"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 font-bold capitalize whitespace-nowrap rounded-t-2xl transition-all duration-300 ${
                activeTab === tab 
                  ? "text-[#ffbade] bg-[#201F31] border-t border-l border-r border-gray-700/50 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] translate-y-[1px]" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#201F31]/50"
              }`}
            >
              {tab === "koleksi" ? "Koleksi (Privat)" : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-8 min-h-[40vh]">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 md:col-span-2 bg-[#201F31]/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-800/60 hover:border-gray-700 transition-colors shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#161523] flex items-center justify-center border border-gray-700/50 shadow-inner">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-[#ffbade]" />
                  </div>
                  <h2 className="text-2xl font-bold">Bio</h2>
                </div>
                <p className="text-gray-300/90 leading-relaxed whitespace-pre-line text-lg">
                  {profile?.bio || "User ini sangat misterius dan belum menuliskan apapun tentang dirinya."}
                </p>
              </div>
              
              <div className="bg-[#201F31]/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-800/60 hover:border-gray-700 transition-colors shadow-lg">
                <h2 className="text-xl font-bold mb-6 text-gray-100">Sosial Media</h2>
                <div className="space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center group-hover:bg-[#5865F2]/20 transition-colors">
                      <FontAwesomeIcon icon={faDiscord} className="text-[#5865F2] text-2xl" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Discord</p>
                      <p className="text-gray-200 font-bold">{customs?.discord_username || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-[#E1306C]/10 flex items-center justify-center group-hover:bg-[#E1306C]/20 transition-colors">
                      <FontAwesomeIcon icon={faInstagram} className="text-[#E1306C] text-2xl" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Instagram</p>
                      <p className="text-gray-200 font-bold">{customs?.instagram_username || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-[#1DA1F2]/10 flex items-center justify-center group-hover:bg-[#1DA1F2]/20 transition-colors">
                      <FontAwesomeIcon icon={faTwitter} className="text-[#1DA1F2] text-2xl" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Twitter/X</p>
                      <p className="text-gray-200 font-bold">{customs?.twitter_username || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <FontAwesomeIcon icon={faTiktok} className="text-white text-2xl" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">TikTok</p>
                      <p className="text-gray-200 font-bold">{customs?.tiktok_username || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "koleksi" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#1A1927] p-8 rounded-3xl border border-gray-800/80 flex flex-col items-center justify-center text-center min-h-[250px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#161523]/80 z-0"></div>
                <div className="w-20 h-20 bg-[#201F31] rounded-full flex items-center justify-center mb-4 z-10 border border-gray-700/50 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <FontAwesomeIcon icon={faLock} className="text-3xl text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-300 z-10 mb-2">Riwayat Tertutup</h3>
                <p className="text-sm text-gray-500 z-10 max-w-[200px]">User ini menjaga privasi riwayat tontonannya.</p>
              </div>
              
              <div className="bg-[#1A1927] p-8 rounded-3xl border border-gray-800/80 flex flex-col items-center justify-center text-center min-h-[250px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#161523]/80 z-0"></div>
                <div className="w-20 h-20 bg-[#201F31] rounded-full flex items-center justify-center mb-4 z-10 border border-gray-700/50 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <FontAwesomeIcon icon={faLock} className="text-3xl text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-300 z-10 mb-2">Favorit Tertutup</h3>
                <p className="text-sm text-gray-500 z-10 max-w-[200px]">Daftar anime favorit disembunyikan untuk publik.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
