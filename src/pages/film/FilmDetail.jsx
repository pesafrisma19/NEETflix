import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faShare, faList } from '@fortawesome/free-solid-svg-icons';
import { FaWhatsapp, FaLink } from 'react-icons/fa';
import website_name from "@/src/config/website";
import { supabase } from "@/src/lib/supabaseClient";
import { useToast } from "@/src/context/ToastContext";
import { addXpAndCheckLevelUp } from "../../utils/xp.utils";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFull, setIsFull] = useState(false);
  const [translatedOverview, setTranslatedOverview] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);

  const [user, setUser] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  useEffect(() => {
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
      const { data, error } = await supabase
        .from('bookmarks_favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('anime_id', String(id))
        .maybeSingle();

      if (data) {
        setIsInWatchlist(true);
      } else {
        setIsInWatchlist(false);
      }
    } catch (err) { }
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      addToast("Silakan login terlebih dahulu untuk menambahkan ke Watchlist!", "error");
      return;
    }
    if (!data) return;

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

        // Tambah XP +3 untuk Bookmark
        addXpAndCheckLevelUp(user.id, "bookmark", 3, id, addToast);
      }
    } catch (err) {
      addToast("Gagal mengupdate Watchlist!", "error");
      console.error(err);
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (showTranslated) {
      setShowTranslated(false);
      return;
    }
    if (translatedOverview) {
      setShowTranslated(true);
      return;
    }
    if (!data?.synopsis) return;

    setIsTranslating(true);
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(
          data.synopsis
        )}`
      );
      const resData = await res.json();
      const translatedText = resData[0].map((item) => item[0]).join("");
      setTranslatedOverview(translatedText);
      setShowTranslated(true);
    } catch (err) {
      console.error("Translation error", err);
      alert("Gagal menerjemahkan teks.");
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${NEETFLIXAPI}/api/lk21/info?id=${id}`);
        if (response.data?.success) {
          setData(response.data.results.data);
          document.title = `${response.data.results.data.title.replace(/Nonton | Sub Indo di Lk21/g, "")} - LK21 NEETflix`;
        } else {
          setError("Failed to fetch film info");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) return <Loader type="animeInfo" />;
  if (error) return <Error />;
  if (!data) return null;

  const titleClean = data.title.replace(/Nonton | Sub Indo di Lk21/g, "");
  const isYouTube = data.iframe && (data.iframe.includes('youtube.com') || data.iframe.includes('youtu.be'));

  return (
    <>
      <div className="relative grid grid-cols-[minmax(0,75%),minmax(0,25%)] h-fit w-full overflow-hidden text-white mt-[64px] max-[1200px]:flex max-[1200px]:flex-col max-md:mt-[50px]">
        <img
          src={data.poster}
          alt={`${titleClean} Poster`}
          className="absolute inset-0 object-cover w-full h-full filter grayscale blur-lg z-[-900]"
        />
        <div className="flex items-start z-10 px-14 py-[70px] bg-[#252434] bg-opacity-70 gap-x-8 max-[1024px]:px-6 max-[1024px]:py-10 max-[1024px]:gap-x-4 max-[575px]:flex-col max-[575px]:items-center max-[575px]:justify-center">
          <div className="relative w-[180px] h-[270px] max-[575px]:w-[140px] max-[575px]:h-[200px] flex-shrink-0">
            <img
              src={data.poster}
              alt={`${titleClean} Poster`}
              className="w-full h-full object-cover object-center flex-shrink-0"
            />
          </div>

          <div className="flex flex-col ml-4 gap-y-5 max-[575px]:items-center max-[575px]:justify-center max-[575px]:mt-6 max-[1200px]:ml-0">
            <ul className="flex gap-x-2 items-center w-fit max-[1200px]:hidden">
              <li className="flex gap-x-3 items-center">
                <Link to={`/film`} className="text-white hover:text-[#FFBADE] text-[15px] font-semibold">Film Home</Link>
                <div className="dot mt-[1px] bg-white"></div>
              </li>
              <li className="flex gap-x-3 items-center">
                <p className="text-white text-[15px] font-semibold">{data.isSeries ? 'Series' : 'Movie'}</p>
                <div className="dot mt-[1px] bg-white"></div>
              </li>
              <p className="font-light text-[15px] text-gray-300 line-clamp-1 max-[575px]:leading-5">
                {titleClean}
              </p>
            </ul>

            <h1 className="text-4xl font-semibold max-[1200px]:text-3xl max-[575px]:text-2xl max-[575px]:text-center  max-[575px]:leading-7">
              {titleClean}
            </h1>

            <div className="flex flex-wrap w-fit gap-x-[2px] mt-3 max-[575px]:mx-auto max-[575px]:mt-0 gap-y-[3px] max-[320px]:justify-center">
              <div className="flex space-x-1 justify-center items-center px-[4px] py-[1px] text-black font-bold text-[13px] bg-[#FFBADE] rounded-[4px]">
                <p className="text-[12px]">HD</p>
              </div>
              <div className="flex w-fit items-center ml-1">
                <div className="px-1 h-fit flex items-center gap-x-2 w-fit">
                  <div className="dot mt-[2px]"></div>
                  <p className="text-[14px]">{data.isSeries ? 'Series' : 'Movie'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-5">
              {!data.isSeries ? (
                <Link
                  to={`/film/watch/${id}`}
                  className="flex gap-x-2 px-6 py-2 bg-[#FFBADE] w-fit text-black items-center rounded-3xl hover:opacity-90 transition-opacity shadow-md"
                >
                  <FontAwesomeIcon icon={faPlay} className="text-[14px] mt-[1px]" />
                  <p className="text-lg font-medium">Watch Now</p>
                </Link>
              ) : (
                <Link
                  to={`/film/watch/${id}?epId=${encodeURIComponent(data.episodes && data.episodes.length > 0 ? data.episodes[0].id : id)}`}
                  className="flex gap-x-2 px-6 py-2 bg-[#FFBADE] w-fit text-black items-center rounded-3xl hover:opacity-90 transition-opacity shadow-md"
                >
                  <FontAwesomeIcon icon={faPlay} className="text-[14px] mt-[1px]" />
                  <p className="text-lg font-medium">Watch Episode 1</p>
                </Link>
              )}
              <button
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
                className="flex gap-x-2 px-6 py-2 bg-white w-fit text-black items-center rounded-3xl font-bold hover:bg-gray-200 transition-colors shadow-md disabled:opacity-50"
              >
                <p className="text-lg">{isInWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}</p>
              </button>
            </div>

            {data.synopsis && (
              <div className="text-[14px] mt-2 max-[575px]:hidden">
                {(showTranslated ? translatedOverview : data.synopsis).length > 270 ? (
                  <>
                    {isFull
                      ? (showTranslated ? translatedOverview : data.synopsis)
                      : `${(showTranslated ? translatedOverview : data.synopsis).slice(0, 270)}...`}
                    <span
                      className="text-[13px] font-bold hover:cursor-pointer ml-1"
                      onClick={() => setIsFull(!isFull)}
                    >
                      {isFull ? "- Less" : "+ More"}
                    </span>
                  </>
                ) : (
                  (showTranslated ? translatedOverview : data.synopsis)
                )}
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="block mt-2 text-[12px] bg-[#FFBADE] text-[#191826] px-3 py-1 rounded-md font-bold hover:bg-white transition-all disabled:opacity-50"
                >
                  {isTranslating ? "Translating..." : (showTranslated ? "Original" : "Terjemahkan (ID)")}
                </button>
              </div>
            )}

            {data.genres && data.genres.length > 0 && (
              <div className="flex gap-x-2 py-2 max-[575px]:hidden mt-2">
                <p className="text-[14px] font-bold text-gray-300">Genres:</p>
                <div className="flex flex-wrap gap-2">
                  {data.genres.map((genre, index) => {
                    const genrePath = genre.toLowerCase() === 'music' ? 'musical' : genre.toLowerCase();
                    return (
                      <Link
                        to={`/film/category/${genrePath}`}
                        key={index}
                        className="text-[12px] font-semibold px-2 py-[1px] border border-gray-400 rounded-2xl hover:text-[#ffbade] hover:border-[#ffbade] transition-colors cursor-pointer"
                      >
                        {genre}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[14px] max-[575px]:hidden">
              {`${website_name} is the best site to watch `}
              <span className="font-bold">{titleClean}</span>
              {` online in HD quality.`}
            </p>

            <div className="flex flex-wrap gap-y-3 gap-x-4 items-center mt-4 max-[575px]:w-full max-[575px]:justify-center max-[320px]:hidden">
              <div className="flex items-center gap-x-3">
                <img
                  src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
                  alt="Share Film"
                  className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
                />
                <div className="flex flex-col w-fit mr-1">
                  <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">
                    Share Film
                  </p>
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
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Yuk nonton ${titleClean} di NEETflix! Langsung klik: ${window.location.href}`)}`, "_blank")}
                  className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg flex gap-x-1.5 items-center text-[12px] font-semibold hover:bg-[#128C7E] transition-all shadow-md"
                >
                  <FaWhatsapp className="text-[14px]" /> WA
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#4c4b57c3] flex items-center px-8 max-[1200px]:py-10 max-[1200px]:bg-[#363544e0] max-[575px]:p-4">
          <div className="w-full flex flex-col h-fit gap-y-3">

            {data.synopsis && (
              <div className="custom-xl:hidden h-fit max-h-[190px] overflow-hidden">
                <p className="text-[13px] font-bold">Synopsis:</p>
                <div className="max-h-[110px] mt-2 overflow-y-auto pr-2">
                  <p className="text-[14px] font-light">{showTranslated ? translatedOverview : data.synopsis}</p>
                </div>
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="block mt-2 text-[12px] bg-[#FFBADE] text-[#191826] px-3 py-1 rounded-md font-bold hover:bg-white transition-all disabled:opacity-50"
                >
                  {isTranslating ? "Translating..." : (showTranslated ? "Original" : "Terjemahkan (ID)")}
                </button>
              </div>
            )}

            <p className="text-[14px] mt-4 custom-xl:hidden">
              {`${website_name} is the best site to watch `}
              <span className="font-bold">{titleClean}</span>
              {` online in HD quality.`}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full px-4 grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col">
        <div>
          {isYouTube && (
            <div className="w-full mt-8 flex flex-col gap-y-4">
              <h1 className="w-fit text-2xl text-[#ffbade] max-[478px]:text-[18px] font-bold">
                Trailer
              </h1>
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-[#ffbade]/20">
                <iframe
                  src={data.iframe}
                  allowFullScreen
                  className="w-full h-full border-0"
                  title="Trailer"
                ></iframe>
              </div>
            </div>
          )}


        </div>
        <div>
          {/* Sidecard placeholder if related film data becomes available */}
        </div>
      </div>
    </>
  );
}

export default FilmDetail;
