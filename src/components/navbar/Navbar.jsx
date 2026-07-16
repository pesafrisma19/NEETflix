import { useState, useEffect, useRef } from "react";
import logoTitle from "@/src/config/logoTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faFilm,
  faRandom,
  faStar,
  faUser,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { SearchProvider } from "@/src/context/SearchContext";
import WebSearch from "../searchbar/WebSearch";
import MobileSearch from "../searchbar/MobileSearch";
import { supabase } from "@/src/lib/supabaseClient";
import AuthModal from "../auth/AuthModal";
import { useToast } from "@/src/context/ToastContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [isNotHomePage, setIsNotHomePage] = useState(
    location.pathname !== "/" && location.pathname !== "/home"
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth states
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProfile = async (userId) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", userId)
        .single();
      if (data && !error) {
        setProfileData(data);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfileData(null);
        setIsDropdownOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      let isOutside = true;
      if (desktopDropdownRef.current && desktopDropdownRef.current.contains(event.target)) isOutside = false;
      if (mobileDropdownRef.current && mobileDropdownRef.current.contains(event.target)) isOutside = false;
      
      if (isOutside) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleHamburgerClick = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleRandomClick = () => {
    if (location.pathname === "/random") {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      addToast("Gagal logout", "error");
    } else {
      addToast("Berhasil logout", "success");
      setIsDropdownOpen(false);
      navigate("/");
    }
  };

  useEffect(() => {
    setIsNotHomePage(
      location.pathname !== "/" && location.pathname !== "/home"
    );
  }, [location.pathname]);

  return (
    <SearchProvider>
      <nav
        className={`fixed top-0 left-0 w-full h-16 z-[1000000] flex p-4 py-8 items-center justify-between transition-all duration-300 ease-in-out ${
          isNotHomePage ? "bg-[#201F31]" : "bg-opacity-0"
        } ${
          isScrolled ? "bg-[#2D2B44] bg-opacity-90 backdrop-blur-md" : ""
        } max-[600px]:h-fit max-[600px]:flex-col max-[1200px]:bg-opacity-100 max-[600px]:py-2`}
      >
        <div className="flex gap-x-6 items-center w-fit max-lg:w-full max-lg:justify-between">
          <div className="flex gap-x-6 items-center w-fit">
            <FontAwesomeIcon
              icon={faBars}
              className="text-2xl text-white mt-1 cursor-pointer"
              onClick={handleHamburgerClick}
            />
            <Link
              to="/"
              className="text-4xl font-bold max-[575px]:text-3xl cursor-pointer"
            >
              {logoTitle.slice(0, 3)}
              <span className="text-[#FFBADE]">{logoTitle.slice(3, 4)}</span>
              {logoTitle.slice(4)}
            </Link>
          </div>
          
          <div className="flex items-center gap-x-4">
            <WebSearch />
            
            {/* Mobile Profile Button (HANYA MUNCUL DI HP - lg:hidden) */}
            <div className="relative lg:hidden" ref={mobileDropdownRef}>
              {user ? (
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex flex-col items-center cursor-pointer">
                  <img 
                    src={profileData?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'User'}&background=ffbade&color=000`} 
                    alt="Avatar" 
                    className="w-7 h-7 rounded-full border border-[#ffbade] object-cover" 
                  />
                </div>
              ) : (
                <div onClick={() => setIsAuthModalOpen(true)} className="flex flex-col items-center cursor-pointer">
                  <FontAwesomeIcon icon={faUser} className="text-xl font-bold text-[#ffbade]" />
                </div>
              )}

              {/* Mobile Dropdown */}
              {isDropdownOpen && user && (
                <div className="absolute right-0 top-10 w-48 bg-[#161523] border border-[#ffbade]/30 rounded-xl shadow-2xl py-2 z-[999] animate-fade-in flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-800/80 mb-1 flex items-center gap-2">
                    <img 
                      src={profileData?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'User'}&background=ffbade&color=000`} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full border border-gray-600 object-cover flex-shrink-0" 
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{profileData?.display_name || user.user_metadata?.full_name || "User"}</p>
                    </div>
                  </div>
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="px-4 py-2 text-xs text-gray-300 hover:bg-[#ffbade]/10 hover:text-[#ffbade] transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faUser} className="w-3 text-center" /> Lihat Profil
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center gap-2 text-left w-full"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-3 text-center" /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Tengah / Kanan Khusus Desktop */}
        <div className="flex gap-x-7 items-center max-lg:hidden">
          {[
            { icon: faRandom, label: "Random", path: "/random" },
            { icon: faFilm, label: "Movie", path: "/movie" },
            { icon: faStar, label: "Popular", path: "/most-popular" },
          ].map((item) => (
            <Link
              key={item.path}
              to={
                item.path === "/random"
                  ? location.pathname === "/random"
                    ? "#"
                    : "/random"
                  : item.path
              }
              onClick={item.path === "/random" ? handleRandomClick : undefined}
              className="flex flex-col gap-y-1 items-center cursor-pointer"
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="text-[#ffbade] text-xl font-bold"
              />
              <p className="text-[15px]">{item.label}</p>
            </Link>
          ))}
          
          <div className="flex flex-col gap-y-1 items-center w-auto">
            <div className="flex">
              {["EN", "JP"].map((lang, index) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-1 py-[1px] text-xs font-bold ${
                    index === 0 ? "rounded-l-[3px]" : "rounded-r-[3px]"
                  } ${
                    language === lang
                      ? "bg-[#ffbade] text-black"
                      : "bg-gray-600 text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="w-full">
              <p className="whitespace-nowrap text-[15px]">Anime name</p>
            </div>
          </div>

          {/* Desktop Profile Button (Kembali ke Kanan) */}
          <div className="relative" ref={desktopDropdownRef}>
            {user ? (
              <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex flex-col gap-y-1 items-center cursor-pointer hover:opacity-80 transition-opacity">
                <img 
                  src={profileData?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'User'}&background=ffbade&color=000`} 
                  alt="Avatar" 
                  className="w-6 h-6 rounded-full border border-[#ffbade] object-cover" 
                />
                <p className="text-[15px] mb-[1px] text-white">Profil</p>
              </div>
            ) : (
              <div onClick={() => setIsAuthModalOpen(true)} className="flex flex-col gap-y-1 items-center cursor-pointer hover:opacity-80 transition-opacity">
                <FontAwesomeIcon icon={faUser} className="text-xl font-bold text-[#ffbade]" />
                <p className="text-[15px] mb-[1px] text-white">Login</p>
              </div>
            )}

            {/* Desktop Dropdown */}
            {isDropdownOpen && user && (
              <div className="absolute right-0 top-12 w-56 bg-[#161523] border border-[#ffbade]/30 rounded-xl shadow-2xl py-2 z-[999] animate-fade-in flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800/80 mb-1 flex items-center gap-3">
                  <img 
                    src={profileData?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'User'}&background=ffbade&color=000`} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full border border-gray-600 object-cover flex-shrink-0" 
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{profileData?.display_name || user.user_metadata?.full_name || "User"}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <Link 
                  to="/profile" 
                  onClick={() => setIsDropdownOpen(false)}
                  className="px-4 py-2.5 text-sm text-gray-300 hover:bg-[#ffbade]/10 hover:text-[#ffbade] transition-colors flex items-center gap-3"
                >
                  <FontAwesomeIcon icon={faUser} className="w-4 text-center" /> Lihat Profil
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center gap-3 text-left w-full"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-4 text-center" /> Keluar (Logout)
                </button>
              </div>
            )}
          </div>
        </div>
        <MobileSearch />
      </nav>
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </SearchProvider>
  );
}

export default Navbar;
