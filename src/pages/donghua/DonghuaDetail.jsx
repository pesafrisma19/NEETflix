import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faShare, faBookmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { FaWhatsapp, FaLink } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import Loader from "@/src/components/Loader/Loader";
import Error from "@/src/components/error/Error";
import website_name from "@/src/config/website";
import { supabase } from "@/src/lib/supabaseClient";
import { useToast } from "@/src/context/ToastContext";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function DonghuaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFull, setIsFull] = useState(false);
  const [user, setUser] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${NEETFLIXAPI}/api/anichin/info?id=${id}`);
        if (res.data?.success) {
          setInfo(res.data.results);
        } else {
          setError("Data not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
    window.scrollTo({ top: 0, behavior: "smooth" });

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        checkWatchlist(session.user.id);
      }
    };
    checkUser();
  }, [id]);

  const checkWatchlist = async (userId) => {
    if (!id) return;
    try {
      const { data } = await supabase
        .from('bookmarks_favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('anime_id', String(id))
        .maybeSingle();

      setIsInWatchlist(!!data);
    } catch (err) {}
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      addToast("Silakan login terlebih dahulu untuk menambahkan ke Watchlist!", "error");
      return;
    }
    if (!info) return;

    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from('bookmarks_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('anime_id', String(id));

        if (error) throw error;
        setIsInWatchlist(false);
        addToast("Berhasil dihapus dari Watchlist!", "success");
      } else {
        const { error } = await supabase
          .from('bookmarks_favorites')
          .insert({
            user_id: user.id,
            anime_id: String(id),
            type: 'bookmark'
          });

        if (error) throw error;
        setIsInWatchlist(true);
        addToast("Berhasil ditambahkan ke Watchlist!", "success");
      }
    } catch (err) {
      addToast("Gagal mengupdate Watchlist!", "error");
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  useEffect(() => {
    if (info) {
      document.title = `Nonton Donghua ${info.title} - ${website_name}`;
    }
  }, [info]);

  if (loading) return <Loader type="animeInfo" />;
  if (error || !info) return <Error />;

  return (
    <>
      <div className="relative w-full h-[600px] max-[1200px]:h-fit">
        <div className="absolute inset-0 bg-black max-[1200px]:hidden"></div>
        <img
          src={info.image}
          alt={info.title}
          className="absolute right-0 h-full w-[80%] object-cover opacity-80 bg-auto max-[1200px]:hidden"
        />
        <div
          className="absolute inset-0 z-10 max-[1200px]:hidden"
          style={{
            background: "linear-gradient(90deg, #191826 20%, rgba(25, 24, 38, 0.9) 40%, rgba(25, 24, 38, 0) 80%)",
          }}
        ></div>

        {/* Mobile top image */}
        <div className="w-full h-[350px] relative min-[1201px]:hidden overflow-hidden">
          <div className="absolute inset-0 z-10 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:3px_3px] opacity-40"></div>
          <img
            src={info.image}
            alt={info.title}
            className="w-full h-full object-cover blur-[5px] scale-110 opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#191826] to-transparent z-20"></div>
          <div className="absolute bottom-[-10px] w-full flex justify-center z-30 drop-shadow-2xl">
            <img
              src={info.image}
              alt={info.title}
              className="w-[180px] h-[250px] object-cover rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10"
            />
          </div>
        </div>

        <div className="absolute z-20 top-1/2 -translate-y-1/2 left-8 w-[45%] max-[1390px]:w-[55%] max-[1200px]:static max-[1200px]:w-full max-[1200px]:transform-none max-[1200px]:px-4 max-[1200px]:mt-6 max-[1200px]:flex max-[1200px]:flex-col max-[1200px]:items-center">
          <div className="flex flex-col text-white max-[1200px]:items-center">
            <ul className="flex items-center gap-x-3 max-[575px]:justify-center flex-wrap">
              <li className="flex gap-x-3 items-center">
                <Link to="/" className="text-white hover:text-[#FFBADE] text-[15px] font-semibold">Home</Link>
                <div className="dot mt-[1px] bg-white"></div>
              </li>
              <li className="flex gap-x-3 items-center">
                <Link to="/donghua" className="text-white hover:text-[#FFBADE] text-[15px] font-semibold">Donghua</Link>
                <div className="dot mt-[1px] bg-white"></div>
              </li>
              <p className="font-light text-[15px] text-gray-300 line-clamp-1 max-[575px]:leading-5">
                {info.title}
              </p>
            </ul>
            <h1 className="text-4xl font-semibold mt-3 max-[1200px]:text-3xl max-[575px]:text-2xl max-[575px]:text-center max-[575px]:leading-7">
              {info.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 mt-6 max-[1200px]:justify-center items-center">
              <Link
                to={`/donghua/watch/${id}`}
                className="flex gap-x-2 px-6 py-2 bg-[#FFBADE] w-fit text-black items-center rounded-3xl hover:opacity-90 transition-opacity shadow-md"
              >
                <FontAwesomeIcon icon={faPlay} className="text-[14px] mt-[1px]" />
                <p className="text-lg font-medium">Watch Now</p>
              </Link>
              <button
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
                className="flex gap-x-2 px-6 py-2 bg-white w-fit text-black items-center rounded-3xl font-bold hover:bg-gray-200 transition-colors shadow-md disabled:opacity-50"
              >
                <p className="text-lg">{isInWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}</p>
              </button>
            </div>
            
            {info.synopsis && (
              <div className="text-[14px] mt-6 max-[575px]:hidden">
                {info.synopsis.length > 270 ? (
                  <>
                    {isFull ? info.synopsis : `${info.synopsis.slice(0, 270)}...`}
                    <span
                      className="text-[13px] font-bold hover:cursor-pointer ml-1 text-[#FFBADE]"
                      onClick={() => setIsFull(!isFull)}
                    >
                      {isFull ? "- Less" : "+ More"}
                    </span>
                  </>
                ) : (
                  info.synopsis
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-y-3 gap-x-4 items-center mt-6 max-[575px]:w-full max-[575px]:justify-center max-[320px]:hidden">
              <div className="flex items-center gap-x-3">
                <img
                  src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
                  alt="Share Anime"
                  className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
                />
                <div className="flex flex-col w-fit mr-1">
                  <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">Share Donghua</p>
                  <p className="text-[14px] text-white leading-tight">to your friends</p>
                </div>
              </div>
              <div className="flex gap-x-2 items-center">
                <button 
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="bg-[#2A2A38] text-white px-3 py-1.5 rounded-lg flex gap-x-1.5 items-center text-[12px] font-semibold hover:bg-[#ffbade] hover:text-[#191826] transition-all shadow-md"
                >
                  <FaLink /> Copy
                </button>
                <button 
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Yuk nonton ${info.title} di NEETflix! Langsung klik: ${window.location.href}`)}`, "_blank")}
                  className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg flex gap-x-1.5 items-center text-[12px] font-semibold hover:bg-[#128C7E] transition-all shadow-md"
                >
                  <FaWhatsapp className="text-[14px]" /> WA
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#4c4b57c3] flex items-center px-8 max-[1200px]:py-10 max-[1200px]:bg-[#363544e0] max-[575px]:p-4 max-[1200px]:mt-6">
          <div className="w-full flex flex-col h-fit gap-y-3">
            {info.synopsis && (
              <div className="custom-xl:hidden h-fit max-h-[190px] overflow-hidden">
                <p className="text-[13px] font-bold">Overview:</p>
                <div className="max-h-[110px] mt-2 overflow-y-auto pr-2">
                  <p className="text-[14px] font-light">{info.synopsis}</p>
                </div>
              </div>
            )}
            
            <div className="text-[14px] font-bold">Status: <span className="font-light">{info.status}</span></div>
            
            {info.genres && info.genres.length > 0 && (
              <div className="flex gap-x-2 py-2">
                <p>Genres:</p>
                <div className="flex flex-wrap gap-2">
                  {info.genres.map((genre, index) => (
                    <div key={index} className="text-[14px] font-semibold px-2 py-[1px] border border-gray-400 rounded-2xl">
                      {genre}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
}

export default DonghuaDetail;
