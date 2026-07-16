import formatSlug from "@/src/utils/formatSlug";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faClosedCaptioning,
  faMicrophone,
  faShare
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { FaWhatsapp, FaLink } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import website_name from "@/src/config/website";
import CategoryCard from "@/src/components/categorycard/CategoryCard";
import Sidecard from "@/src/components/sidecard/Sidecard";
import Loader from "@/src/components/Loader/Loader";
import Error from "@/src/components/error/Error";
import { useLanguage } from "@/src/context/LanguageContext";
import { useHomeInfo } from "@/src/context/HomeInfoContext";
import Voiceactor from "@/src/components/voiceactor/Voiceactor";
import Trailer from "@/src/components/trailer/Trailer";
import Soundtrack from "@/src/components/soundtrack/Soundtrack";
import { supabase } from "@/src/lib/supabaseClient";
import { useToast } from "@/src/context/ToastContext";

function InfoItem({ label, value, isProducer = true }) {
  return (
    value && (
      <div className="text-[14px] font-bold">
        {`${label}: `}
        <span className="font-light">
          {Array.isArray(value) ? (
            value.map((item, index) =>
              isProducer ? (
                <Link
                  to={`/producer/${item
                    .replace(/[&'"^%$#@!()+=<>:;,.?/\\|{}[\]`~*_]/g, "")
                    .split(" ")
                    .join("-")
                    .replace(/-+/g, "-")}`}
                  key={index}
                  className="cursor-pointer hover:text-[#ffbade]"
                >
                  {item}
                  {index < value.length - 1 && ", "}
                </Link>
              ) : (
                <span key={index} className="cursor-pointer">
                  {item}
                </span>
              )
            )
          ) : isProducer ? (
            <Link
              to={`/producer/${value
                .replace(/[&'"^%$#@!()+=<>:;,.?/\\|{}[\]`~*_]/g, "")
                .split(" ")
                .join("-")
                .replace(/-+/g, "-")}`}
              className="cursor-pointer hover:text-[#ffbade]"
            >
              {value}
            </Link>
          ) : (
            <span className="cursor-pointer">{value}</span>
          )}
        </span>
      </div>
    )
  );
}

function Tag({ bgColor, index, icon, text }) {
  return (
    <div
      className={`flex space-x-1 justify-center items-center px-[4px] py-[1px] text-black font-bold text-[13px] ${index === 0 ? "rounded-l-[4px]" : "rounded-none"
        }`}
      style={{ backgroundColor: bgColor }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="text-[12px]" />}
      <p className="text-[12px]">{text}</p>
    </div>
  );
}

function AnimeInfo({ random = false }) {
  const { language } = useLanguage();
  const { id: paramSlug } = useParams();
  const paramId = paramSlug ? paramSlug.split("-").pop() : null;
  const id = random ? null : paramId;
  const [isFull, setIsFull] = useState(false);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [seasons, setSeasons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { homeInfo } = useHomeInfo();
  const currentId = paramId;
  const navigate = useNavigate();

  const [translatedOverview, setTranslatedOverview] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);

  const [user, setUser] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        checkWatchlist(session.user.id);
      }
    };
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkWatchlist = async (userId) => {
    if (!id || id === "404-not-found-page") return;
    try {
      const { data } = await supabase.from('user_stats').select('favorites').eq('user_id', userId).single();
      if (data && data.favorites) {
        setIsInWatchlist(data.favorites.some(item => String(item.id) === String(id)));
      }
    } catch (err) {}
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      addToast("Silakan login terlebih dahulu untuk menambahkan ke Watchlist!", "error");
      return;
    }
    if (!animeInfo) return;
    
    setIsWatchlistLoading(true);
    try {
      const { data: currentStats, error: getError } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
      let currentFavorites = currentStats?.favorites || [];
      
      if (isInWatchlist) {
        currentFavorites = currentFavorites.filter(item => String(item.id) !== String(id));
        setIsInWatchlist(false);
        addToast("Berhasil dihapus dari Watchlist!", "success");
      } else {
        currentFavorites = [{
          id: String(id),
          title: animeInfo.title,
          japanese_title: animeInfo.japanese_title,
          poster: animeInfo.poster,
          tvInfo: animeInfo.animeInfo?.tvInfo
        }, ...currentFavorites];
        setIsInWatchlist(true);
        addToast("Berhasil ditambahkan ke Watchlist!", "success");
      }
      
      if (getError && getError.code === 'PGRST116') {
        await supabase.from('user_stats').insert({ user_id: user.id, favorites: currentFavorites });
      } else {
        await supabase.from('user_stats').update({ favorites: currentFavorites }).eq('user_id', user.id);
      }
    } catch (err) {
      addToast("Gagal mengupdate Watchlist!", "error");
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
    setIsTranslating(true);
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(
          animeInfo.animeInfo.Overview
        )}`
      );
      const data = await res.json();
      const translatedText = data[0].map((item) => item[0]).join("");
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
    if (id === "404-not-found-page") {
      console.log("404 got!");
      return null;
    } else {
      const fetchAnimeInfo = async () => {
        setLoading(true);
        try {
          const data = await getAnimeInfo(id, random);
          setSeasons(data?.seasons);
          setAnimeInfo(data?.data);
        } catch (err) {
          console.error("Error fetching anime info:", err);
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      fetchAnimeInfo();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id, random]);
  useEffect(() => {
    if (animeInfo && location.pathname === `/${formatSlug(animeInfo?.title || animeInfo?.japanese_title, animeInfo?.id)}`) {
      document.title = `Watch ${animeInfo.title} English Sub/Dub online Free on ${website_name}`;
    }
    return () => {
      document.title = `${website_name} | Free anime streaming platform`;
    };
  }, [animeInfo]);
  if (loading) return <Loader type="animeInfo" />;
  if (error) {
    return <Error />;
  }
  if (!animeInfo) {
    navigate("/404-not-found-page");
    return undefined;
  }
  const { title, japanese_title, poster, animeInfo: info } = animeInfo;
  const tags = [
    {
      condition: info.tvInfo?.rating,
      bgColor: "#ffffff",
      text: info.tvInfo.rating,
    },
    {
      condition: info.tvInfo?.quality,
      bgColor: "#FFBADE",
      text: info.tvInfo.quality,
    },
    {
      condition: info.tvInfo?.sub,
      icon: faClosedCaptioning,
      bgColor: "#B0E3AF",
      text: info.tvInfo.sub,
    },
    {
      condition: info.tvInfo?.dub,
      icon: faMicrophone,
      bgColor: "#B9E7FF",
      text: info.tvInfo.dub,
    },
  ];

  return (
    <>
      <div className="relative grid grid-cols-[minmax(0,75%),minmax(0,25%)] h-fit w-full overflow-hidden text-white mt-[64px] max-[1200px]:flex max-[1200px]:flex-col max-md:mt-[50px]">
        <img
          src={`${poster}`}
          alt={`${title} Poster`}
          className="absolute inset-0 object-cover w-full h-full filter grayscale blur-lg z-[-900]"
        />
        <div className="flex items-start z-10 px-14 py-[70px] bg-[#252434] bg-opacity-70 gap-x-8 max-[1024px]:px-6 max-[1024px]:py-10 max-[1024px]:gap-x-4 max-[575px]:flex-col max-[575px]:items-center max-[575px]:justify-center">
          <div className="relative w-[180px] h-[270px] max-[575px]:w-[140px] max-[575px]:h-[200px] flex-shrink-0">
            <img
              src={`${poster}`}
              alt={`${title} Poster`}
              className="w-full h-full object-cover object-center flex-shrink-0"
            />
            {animeInfo.adultContent && (
              <div className="text-white px-2 rounded-md bg-[#FF5700] absolute top-2 left-2 flex items-center justify-center text-[14px] font-bold">
                18+
              </div>
            )}
          </div>
          <div className="flex flex-col ml-4 gap-y-5 max-[575px]:items-center max-[575px]:justify-center max-[575px]:mt-6 max-[1200px]:ml-0">
            <ul className="flex gap-x-2 items-center w-fit max-[1200px]:hidden">
              {[
                ["Home", "home"],
                [info.tvInfo?.showType, info.tvInfo?.showType],
              ].map(([text, link], index) => (
                <li key={index} className="flex gap-x-3 items-center">
                  <Link
                    to={`/${link}`}
                    className="text-white hover:text-[#FFBADE] text-[15px] font-semibold"
                  >
                    {text}
                  </Link>
                  <div className="dot mt-[1px] bg-white"></div>
                </li>
              ))}
              <p className="font-light text-[15px] text-gray-300 line-clamp-1 max-[575px]:leading-5">
                {language === "EN" ? title : japanese_title}
              </p>
            </ul>
            <h1 className="text-4xl font-semibold max-[1200px]:text-3xl max-[575px]:text-2xl max-[575px]:text-center  max-[575px]:leading-7">
              {language === "EN" ? title : japanese_title}
            </h1>
            <div className="flex flex-wrap w-fit gap-x-[2px] mt-3 max-[575px]:mx-auto max-[575px]:mt-0 gap-y-[3px] max-[320px]:justify-center">
              {tags.map(
                ({ condition, icon, bgColor, text }, index) =>
                  condition && (
                    <Tag
                      key={index}
                      index={index}
                      bgColor={bgColor}
                      icon={icon}
                      text={text}
                    />
                  )
              )}
              <div className="flex w-fit items-center ml-1">
                {[info.tvInfo?.showType, info.tvInfo?.duration].map(
                  (item, index) =>
                    item && (
                      <div
                        key={index}
                        className="px-1 h-fit flex items-center gap-x-2 w-fit"
                      >
                        <div className="dot mt-[2px]"></div>
                        <p className="text-[14px]">{item}</p>
                      </div>
                    )
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-5">
              {animeInfo?.animeInfo?.Status?.toLowerCase() !== "not-yet-aired" ? (
                <Link
                  to={`/watch/${formatSlug(animeInfo?.title || animeInfo?.japanese_title, animeInfo?.id)}`}
                  className="flex gap-x-2 px-6 py-2 bg-[#FFBADE] w-fit text-black items-center rounded-3xl hover:opacity-90 transition-opacity shadow-md"
                >
                  <FontAwesomeIcon
                    icon={faPlay}
                    className="text-[14px] mt-[1px]"
                  />
                  <p className="text-lg font-medium">Watch Now</p>
                </Link>
              ) : (
                <Link
                  to={`/${formatSlug(animeInfo?.title || animeInfo?.japanese_title, animeInfo?.id)}`}
                  className="flex gap-x-2 px-6 py-2 bg-[#FFBADE] w-fit text-black items-center rounded-3xl hover:opacity-90 transition-opacity shadow-md"
                >
                  <p className="text-lg font-medium">Not released</p>
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
            {info?.Overview && (
              <div className="text-[14px] mt-2 max-[575px]:hidden">
                {(showTranslated ? translatedOverview : info.Overview).length > 270 ? (
                  <>
                    {isFull
                      ? (showTranslated ? translatedOverview : info.Overview)
                      : `${(showTranslated ? translatedOverview : info.Overview).slice(0, 270)}...`}
                    <span
                      className="text-[13px] font-bold hover:cursor-pointer ml-1"
                      onClick={() => setIsFull(!isFull)}
                    >
                      {isFull ? "- Less" : "+ More"}
                    </span>
                  </>
                ) : (
                  (showTranslated ? translatedOverview : info.Overview)
                )}
                <button 
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="block mt-2 text-[12px] bg-[#FFBADE] text-[#191826] px-3 py-1 rounded-md font-bold hover:bg-white transition-all disabled:opacity-50"
                >
                  {isTranslating ? "Translating..." : (showTranslated ? "Original (EN)" : "Terjemahkan (ID)")}
                </button>
              </div>
            )}
            <p className="text-[14px] max-[575px]:hidden">
              {`${website_name} is the best site to watch `}
              <span className="font-bold">{title}</span>
              {` SUB online, or you can even watch `}
              <span className="font-bold">{title}</span>
              {` DUB in HD quality.`}
            </p>
            <div className="flex flex-wrap gap-y-3 gap-x-4 items-center mt-4 max-[575px]:w-full max-[575px]:justify-center max-[320px]:hidden">
              <div className="flex items-center gap-x-3">
                <img
                  src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
                  alt="Share Anime"
                  className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
                />
                <div className="flex flex-col w-fit mr-1">
                  <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">
                    Share Anime
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
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Yuk nonton ${title} di NEETflix! Langsung klik: ${window.location.href}`)}`, "_blank")}
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
            {info?.Overview && (
              <div className="custom-xl:hidden h-fit max-h-[190px] overflow-hidden">
                <p className="text-[13px] font-bold">Overview:</p>
                <div className="max-h-[110px] mt-2 overflow-y-auto pr-2">
                  <p className="text-[14px] font-light">{showTranslated ? translatedOverview : info.Overview}</p>
                </div>
                <button 
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="block mt-2 text-[12px] bg-[#FFBADE] text-[#191826] px-3 py-1 rounded-md font-bold hover:bg-white transition-all disabled:opacity-50"
                >
                  {isTranslating ? "Translating..." : (showTranslated ? "Original (EN)" : "Terjemahkan (ID)")}
                </button>
              </div>
            )}
            {[
              { label: "Japanese", value: info?.Japanese },
              { label: "Synonyms", value: info?.Synonyms },
              { label: "Aired", value: info?.Aired },
              { label: "Premiered", value: info?.Premiered },
              { label: "Duration", value: info?.Duration },
              { label: "Status", value: info?.Status },
              { label: "MAL Score", value: info?.["MAL Score"] },
            ].map(({ label, value }, index) => (
              <InfoItem
                key={index}
                label={label}
                value={value}
                isProducer={false}
              />
            ))}
            {info?.Genres && (
              <div className="flex gap-x-2 py-2 custom-xl:border-t custom-xl:border-b custom-xl:border-white/20 max-[1200px]:border-none">
                <p>Genres:</p>
                <div className="flex flex-wrap gap-2">
                  {info.Genres.map((genre, index) => (
                    <Link
                      to={`/genre/${genre.split(" ").join("-")}`}
                      key={index}
                      className="text-[14px] font-semibold px-2 py-[1px] border border-gray-400 rounded-2xl hover:text-[#ffbade]"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {[
              { label: "Studios", value: info?.Studios },
              { label: "Producers", value: info?.Producers },
            ].map(({ label, value }, index) => (
              <InfoItem key={index} label={label} value={value} />
            ))}
            <p className="text-[14px] mt-4 custom-xl:hidden">
              {`${website_name} is the best site to watch `}
              <span className="font-bold">{title}</span>
              {` SUB online, or you can even watch `}
              <span className="font-bold">{title}</span>
              {` DUB in HD quality.`}
            </p>
          </div>
        </div>
      </div>
      <div className="w-full px-4 grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col">
        <div>
          {seasons?.length > 0 && (
            <div className="flex flex-col gap-y-7 mt-8">
              <h1 className="w-fit text-2xl text-[#ffbade] max-[478px]:text-[18px] font-bold">
                More Seasons
              </h1>
              <div className="flex flex-wrap gap-4 max-[575px]:grid max-[575px]:grid-cols-3 max-[575px]:gap-3 max-[480px]:grid-cols-2">
                {seasons.map((season, index) => (
                  <Link
                    to={`/${formatSlug(season?.season, season?.id)}`}
                    key={index}
                    className={`relative w-[20%] h-[60px] rounded-lg overflow-hidden cursor-pointer group ${currentId === String(season.id)
                      ? "border border-[#ffbade]"
                      : ""
                      } max-[1200px]:w-[140px] max-[575px]:w-full`}
                  >
                    <p
                      className={`text-[13px] text-center font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-2 z-30 line-clamp-2 group-hover:text-[#ffbade] ${currentId === String(season.id)
                        ? "text-[#ffbade]"
                        : "text-white"
                        }`}
                    >
                      {season.season}
                    </p>
                    <div className="absolute inset-0 z-10 bg-black/40 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:4px_4px]"></div>
                    <img
                      src={season.season_poster}
                      alt=""
                      className="w-full h-full object-cover blur-[3px] opacity-50"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {animeInfo?.charactersVoiceActors.length > 0 && (
            <Voiceactor animeInfo={animeInfo} />
          )}
          <Soundtrack anilistId={animeInfo?.animeInfo?.id || currentId} />
          <Trailer trailer={animeInfo?.animeInfo?.trailer} />
          {animeInfo.recommended_data.length > 0 && (
            <CategoryCard
              label="Recommended for you"
              data={animeInfo.recommended_data}
              limit={animeInfo.recommended_data.length}
              showViewMore={false}
              className={"mt-8"}
            />
          )}
        </div>
        <div>
          {animeInfo.related_data.length > 0 && (
            <Sidecard
              label="Related Anime"
              data={animeInfo.related_data}
              className="mt-8"
            />
          )}
          {homeInfo && homeInfo.most_popular && (
            <Sidecard
              label="Most Popular"
              data={homeInfo.most_popular.slice(0, 10)}
              className="mt-[40px]"
              limit={10}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default AnimeInfo;
