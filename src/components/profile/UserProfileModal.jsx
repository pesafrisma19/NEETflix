import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCrown, faFilm, faBookOpen, faComments, faUser, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { getRankTitle, getAvatarFrameClass } from "@/src/utils/xp.utils";

export default function UserProfileModal({ username, isOpen, onClose }) {
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [customs, setCustoms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !username) {
      setProfileData(null);
      setStats(null);
      setCustoms(null);
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Fetch Profile
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (profErr || !prof) {
          setLoading(false);
          return;
        }

        setProfileData(prof);

        // Fetch User Customizations
        const { data: cust } = await supabase
          .from("user_customizations")
          .select("*")
          .eq("user_id", prof.id)
          .maybeSingle();

        setCustoms(cust);

        // Fetch User Stats
        const { data: st } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", prof.id)
          .maybeSingle();

        setStats(st);
      } catch (err) {
        console.error("Error fetching user preview profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, isOpen]);

  if (!isOpen) return null;

  const currentLevel = profileData?.level || 1;
  const rankTitle = customs?.equipped_title || customs?.custom_title || getRankTitle(currentLevel);
  const avatarUrl = profileData?.avatar_url || "https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg";
  const bannerUrl = profileData?.banner_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2560&auto=format&fit=crop";
  const avatarFrameClass = getAvatarFrameClass(currentLevel, profileData?.is_vip, customs, stats);

  const displayName = profileData?.display_name || profileData?.username || "Anime Fan";
  const nameColor = customs?.name_color || "#FFFFFF";
  const titleColor = customs?.title_color || "#ffbade";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-[#1C1B2B] border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative text-white animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-30 bg-black/50 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all border border-white/10"
        >
          <FontAwesomeIcon icon={faTimes} className="text-sm" />
        </button>

        {/* Banner */}
        <div 
          className="h-28 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url('${bannerUrl}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1B2B] via-transparent to-black/30"></div>
        </div>

        {/* Loading Spinner State */}
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffbade]"></div>
            <p className="text-xs text-gray-400 font-semibold">Memuat profil @{username}...</p>
          </div>
        ) : !profileData ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Pengguna tidak ditemukan.
          </div>
        ) : (
          <div className="px-6 pb-6 pt-0 relative z-20 text-center flex flex-col items-center">
            {/* Avatar & Badges */}
            <div className="relative -mt-14 mb-3">
              {profileData?.is_vip && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl z-20 vip-crown-glow">
                  <FontAwesomeIcon icon={faCrown} className="text-yellow-400" />
                </div>
              )}
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className={`w-24 h-24 rounded-full object-cover bg-[#201F31] ${avatarFrameClass}`} 
              />
              {profileData?.is_vip && (
                <span 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] font-black rounded-full shadow-lg border border-amber-300/40 flex items-center gap-1"
                  style={{ backgroundColor: customs?.badge_bg_color || '#6a0dad', color: customs?.badge_text_color || '#fff' }}
                >
                  <FontAwesomeIcon icon={faCrown} className="text-yellow-300 text-[8px]" />
                  {customs?.badge_text || "VIP"}
                </span>
              )}
            </div>

            {/* Name & Title */}
            <h3 className="font-extrabold text-lg truncate max-w-[240px]" style={{ color: nameColor }}>
              {displayName}
            </h3>
            <p className="text-xs text-gray-400 font-medium">@{profileData?.username}</p>

            <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffbade]/20 text-[#ffbade] border border-[#ffbade]/30">
                Lv.{currentLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/30 truncate max-w-[180px]" style={{ color: titleColor }}>
                {rankTitle}
              </span>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-2 w-full mt-5 bg-[#141320] p-3 rounded-2xl border border-gray-800/80 text-center">
              <div className="flex flex-col items-center justify-center p-1">
                <FontAwesomeIcon icon={faFilm} className="text-blue-400 text-xs mb-1" />
                <span className="text-xs font-black text-white">{stats?.episodes_watched || 0}</span>
                <span className="text-[9px] text-gray-400 font-semibold">Episode</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1 border-x border-gray-800">
                <FontAwesomeIcon icon={faBookOpen} className="text-green-400 text-xs mb-1" />
                <span className="text-xs font-black text-white">{stats?.chapters_read || 0}</span>
                <span className="text-[9px] text-gray-400 font-semibold">Chapter</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1">
                <FontAwesomeIcon icon={faComments} className="text-purple-400 text-xs mb-1" />
                <span className="text-xs font-black text-white">{stats?.comments_count || 0}</span>
                <span className="text-[9px] text-gray-400 font-semibold">Komentar</span>
              </div>
            </div>

            {/* Action Button: Go to Full Profile */}
            <Link
              to={`/user/${profileData.username}`}
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#ffbade] hover:bg-[#ff99cc] text-black font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 group"
            >
              <FontAwesomeIcon icon={faUser} className="text-xs" />
              <span>Lihat Profil Lengkap</span>
              <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px] opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
