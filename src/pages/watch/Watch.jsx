import formatSlug from "@/src/utils/formatSlug";
/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { useHomeInfo } from "@/src/context/HomeInfoContext";
import { useWatch } from "@/src/hooks/useWatch";
import BouncingLoader from "@/src/components/ui/bouncingloader/Bouncingloader";
import Player from "@/src/components/player/Player";
import Episodelist from "@/src/components/episodelist/Episodelist";
import website_name from "@/src/config/website";
import Sidecard from "@/src/components/sidecard/Sidecard";
import CategoryCard from "@/src/components/categorycard/CategoryCard";
import {
  faClosedCaptioning,
  faMicrophone,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Servers from "@/src/components/servers/Servers";
import CategoryCardLoader from "@/src/components/Loader/CategoryCard.loader";
import { Skeleton } from "@/src/components/ui/Skeleton/Skeleton";
import SidecardLoader from "@/src/components/Loader/Sidecard.loader";
import Voiceactor from "@/src/components/voiceactor/Voiceactor";
import Watchcontrols from "@/src/components/watchcontrols/Watchcontrols";
import useWatchControl from "@/src/hooks/useWatchControl";
import { FaWhatsapp, FaLink } from "react-icons/fa";

function Tag({ bgColor, index, icon, text }) {
  return (
    <div
      className={`flex space-x-1 justify-center items-center px-[4px] py-[1px] text-black font-semibold text-[13px] ${index === 0 ? "rounded-l-[4px]" : "rounded-none"
        }`}
      style={{ backgroundColor: bgColor }}
    >
      {icon && <FontAwesomeIcon icon={icon} className="text-[12px]" />}
      <p className="text-[12px]">{text}</p>
    </div>
  );
}


export default function Watch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: paramSlug } = useParams();
  const animeId = paramSlug ? paramSlug.split("-").pop() : null;
  const queryParams = new URLSearchParams(location.search);
  let initialEpisodeId = queryParams.get("ep");
  const [tags, setTags] = useState([]);
  const { language } = useLanguage();
  const { homeInfo } = useHomeInfo();
  const isFirstSet = useRef(true);
  const [showNextEpisodeSchedule, setShowNextEpisodeSchedule] = useState(true);
  const {
    // error,
    buffering,
    streamInfo,
    animeInfo,
    episodes,
    nextEpisodeSchedule,
    animeInfoLoading,
    totalEpisodes,
    isFullOverview,
    setIsFullOverview,
    activeEpisodeNum,
    streamUrl,
    subtitles,
    thumbnail,
    poster,
    intro,
    outro,
    seasons,
    episodeId,
    setEpisodeId,
    activeServerId,
    setActiveServerId,
    servers,
    serverLoading,
  } = useWatch(animeId, initialEpisodeId);
  const {
    autoPlay,
    setAutoPlay,
    autoSkipIntro,
    setAutoSkipIntro,
    autoNext,
    setAutoNext,
  } = useWatchControl();

  useEffect(() => {
    if (!episodes || episodes.length === 0) return;

    const isValidEpisode = episodes.some(ep => {
      const epNumber = ep.id.split('ep=')[1];
      return epNumber === String(episodeId);
    });

    // If missing or invalid episodeId, fallback to first
    if (!episodeId || !isValidEpisode) {
      const fallbackId = episodes[0].id.match(/ep=(\d+)/)?.[1];
      if (fallbackId && fallbackId !== episodeId) {
        setEpisodeId(fallbackId);
      }
      return;
    }

    const newUrl = `/watch/${paramSlug}?ep=${episodeId}`;
    if (isFirstSet.current) {
      navigate(newUrl, { replace: true });
      isFirstSet.current = false;
    } else {
      navigate(newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId, paramSlug, navigate, episodes]);

  // Update document title
  useEffect(() => {
    if (animeInfo) {
      document.title = `Watch ${animeInfo.title} English Sub/Dub online Free on ${website_name}`;
    }
    return () => {
      document.title = `${website_name} | Free anime streaming platform`;
    };
  }, [animeId]);

  // Update URL query param ?ep=X dynamically
  useEffect(() => {
    if (activeEpisodeNum) {
      const url = new URL(window.location.href);
      url.searchParams.set("ep", activeEpisodeNum);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeEpisodeNum]);

  // Redirect if no episodes
  // Dihapus agar user tidak dipaksa kembali ke infoanime dan tetap bisa memilih server/sumber lain
  // useEffect(() => {
  //   if (totalEpisodes !== null && totalEpisodes === 0) {
  //     navigate(`/${formatSlug(animeInfo?.title || animeInfo?.japanese_title, animeId)}`);
  //   }
  // }, [streamInfo, episodeId, animeId, totalEpisodes, navigate]);

  // useEffect(() => {
  //   const adjustHeight = () => {
  //     if (window.innerWidth > 1200) {
  //       const player = document.querySelector(".player");
  //       const episodes = document.querySelector(".episodes");
  //       if (player && episodes) {
  //         episodes.style.height = `${player.clientHeight}px`;
  //       }
  //     } else {
  //       const episodes = document.querySelector(".episodes");
  //       if (episodes) {
  //         episodes.style.height = "auto";
  //       }
  //     }
  //   };
  //   adjustHeight();
  //   window.addEventListener("resize", adjustHeight);
  //   return () => {
  //     window.removeEventListener("resize", adjustHeight);
  //   };
  // },[]);

  useEffect(() => {
    let ro = null;
    let mo = null;

    const episodesEl = () => document.querySelector(".episodes");
    const playerEl = () => document.querySelector(".player");

    const applyHeight = () => {
      window.requestAnimationFrame(() => {
        const p = playerEl();
        const e = episodesEl();
        if (!e || !p) return;

        if (window.innerWidth > 1200) {
          const height = Math.ceil(p.getBoundingClientRect().height);
          e.style.height = `${height}px`;
          e.style.minHeight = `${height}px`;
        } else {
          e.style.height = "auto";
          e.style.minHeight = "auto";
        }
      });
    };

    const ensureAndApply = () => {
      if (playerEl() && episodesEl()) {
        applyHeight();
        if (window.ResizeObserver) {
          ro = new ResizeObserver(applyHeight);
          ro.observe(playerEl());
        } else {
          window.addEventListener("resize", applyHeight);
          mo = new MutationObserver(applyHeight);
          mo.observe(playerEl(), { attributes: true, childList: true, subtree: true });
        }
      } else {
        const t = setTimeout(() => {
          clearTimeout(t);
          if (playerEl() && episodesEl()) {
            ensureAndApply();
          } else {
            applyHeight();
          }
        }, 120);
      }
    };

    ensureAndApply();

    const onWindowResize = () => applyHeight();
    window.addEventListener("orientationchange", onWindowResize);

    return () => {
      window.removeEventListener("orientationchange", onWindowResize);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      window.removeEventListener("resize", applyHeight);
    };
  }, [buffering, episodes]);

  useEffect(() => {
    setTags([
      {
        condition: animeInfo?.animeInfo?.tvInfo?.rating,
        bgColor: "#ffffff",
        text: animeInfo?.animeInfo?.tvInfo?.rating,
      },
      {
        condition: animeInfo?.animeInfo?.tvInfo?.quality,
        bgColor: "#FFBADE",
        text: animeInfo?.animeInfo?.tvInfo?.quality,
      },
      {
        condition: animeInfo?.animeInfo?.tvInfo?.sub,
        icon: faClosedCaptioning,
        bgColor: "#B0E3AF",
        text: animeInfo?.animeInfo?.tvInfo?.sub,
      },
      {
        condition: animeInfo?.animeInfo?.tvInfo?.dub,
        icon: faMicrophone,
        bgColor: "#B9E7FF",
        text: animeInfo?.animeInfo?.tvInfo?.dub,
      },
    ]);
  }, [animeId, animeInfo]);
  return (
    <div className="w-full h-fit flex flex-col justify-center items-center relative">
      <div className="w-full relative max-[1400px]:px-[30px] max-[1200px]:px-[80px] max-[1024px]:px-0">
        <img
          src={
            !animeInfoLoading
              ? `${animeInfo?.poster}`
              : "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          }
          alt={`${animeInfo?.title} Poster`}
          className="absolute inset-0 w-full h-full object-cover filter grayscale z-[-900]"
        />
        <div className="absolute inset-0 bg-[#3a3948] bg-opacity-80 backdrop-blur-md z-[-800]"></div>
        <div className="relative z-10 px-4 pb-[50px] grid grid-cols-[minmax(0,75%),minmax(0,25%)] w-full h-full mt-[128px] max-[1400px]:flex max-[1400px]:flex-col max-[1200px]:mt-[64px] max-[1024px]:px-0 max-md:mt-[50px]">
          {animeInfo && (
            <ul className="flex absolute left-4 top-[-40px] gap-x-2 items-center w-fit max-[1200px]:hidden">
              {[
                ["Home", "home"],
                [animeInfo?.showType, animeInfo?.showType],
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
                Watching{" "}
                {language === "EN"
                  ? animeInfo?.title
                  : animeInfo?.japanese_title}
              </p>
            </ul>
          )}
          <div className="flex w-full min-h-fit max-[1200px]:flex-col-reverse">
            <div className="episodes w-[35%] bg-[#191826] flex justify-center items-center max-[1400px]:w-[380px] max-[1200px]:w-full max-[1200px]:h-full max-[1200px]:min-h-[100px]">
              {!episodes ? (
                <BouncingLoader />
              ) : (
                <Episodelist
                  episodes={episodes}
                  currentEpisode={episodeId}
                  onEpisodeClick={(id) => setEpisodeId(id)}
                  totalEpisodes={totalEpisodes}
                />
              )}
            </div>
            <div className="player w-full h-fit bg-black flex flex-col">
              <div className="w-full relative h-[480px] max-[1400px]:h-[40vw] max-[1200px]:h-[48vw] max-[1024px]:h-[58vw] max-[600px]:h-[65vw]">
                {!buffering ? (
                  <Player
                    streamUrl={streamUrl}
                    subtitles={subtitles}
                    intro={intro}
                    outro={outro}
                    thumbnail={thumbnail}
                    poster={poster}
                    autoSkipIntro={autoSkipIntro}
                    autoPlay={autoPlay}
                    autoNext={autoNext}
                    episodeId={episodeId}
                    episodes={episodes}
                    playNext={(id) => setEpisodeId(id)}
                    animeInfo={animeInfo}
                    episodeNum={activeEpisodeNum}
                    streamInfo={streamInfo}
                  />
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50">
                    <BouncingLoader />
                  </div>
                )}
                {!buffering && !streamInfo && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-[#191826]/95 backdrop-blur-sm px-6 py-8 sm:px-10 sm:py-10 rounded-2xl shadow-2xl border border-white/5 text-center w-[90%] max-w-[500px] z-20 pointer-events-none">
                    <div className="w-[70px] h-[70px] rounded-full bg-[#FFBADE] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,186,222,0.3)]">
                      <svg className="w-10 h-10 text-[#191826]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                      </svg>
                    </div>
                    <h2 className="text-[#FFBADE] font-black text-[20px] sm:text-[24px] uppercase tracking-wider mb-3">
                      ANIME/EPS SEGERA HADIR..
                    </h2>
                    <p className="text-gray-300 text-[14px] sm:text-[15px] leading-relaxed font-medium">
                      Waduh! Episode ini belum tersedia di server streaming atau masih dalam proses upload. Silakan coba server lain atau kembali lagi nanti ya!
                    </p>
                  </div>
                )}
              </div>

              {/* TMDB Episode Details Section */}
              {!buffering && episodes && activeEpisodeNum && (
                (() => {
                  const activeEpisodeData = episodes.find(ep => ep.episode_no === activeEpisodeNum);
                  if (activeEpisodeData?.tmdb) {
                    const tmdb = activeEpisodeData.tmdb;
                    return (
                      <div className="w-full bg-[#1e1d2b] p-4 flex flex-col gap-2 mt-2 border-l-4 border-[#FFBADE]">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <h2 className="text-[#FFBADE] font-bold text-lg">
                            Episode {activeEpisodeNum}: {tmdb.title}
                          </h2>
                          <div className="flex gap-4 text-sm text-gray-300">
                            {tmdb.airDate && <span>📅 {tmdb.airDate}</span>}
                            {tmdb.rating ? <span>⭐ {tmdb.rating.toFixed(1)}/10</span> : null}
                          </div>
                        </div>
                        {tmdb.overview && (
                          <p className="text-gray-300 text-sm leading-relaxed text-justify mt-1">
                            {tmdb.overview}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {!buffering && (
                <Watchcontrols
                  autoPlay={autoPlay}
                  setAutoPlay={setAutoPlay}
                  autoSkipIntro={autoSkipIntro}
                  setAutoSkipIntro={setAutoSkipIntro}
                  autoNext={autoNext}
                  setAutoNext={setAutoNext}
                  episodes={episodes}
                  totalEpisodes={totalEpisodes}
                  episodeId={episodeId}
                  onButtonClick={(id) => setEpisodeId(id)}
                />
              )}
              <Servers
                servers={servers}
                activeEpisodeNum={activeEpisodeNum}
                activeServerId={activeServerId}
                setActiveServerId={setActiveServerId}
                serverLoading={serverLoading}
              />
              
              {/* Download Episode Section */}
              {!buffering && activeServerId?.includes("AL") && streamInfo?.streamingLink?.downloads?.length > 0 && (
                <div className="flex flex-col gap-y-2 bg-[#11101A] p-4 mt-2 mb-2">
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#FFBADE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <h1 className="w-fit text-lg max-[478px]:text-[16px] font-bold uppercase tracking-wide text-white">
                        DOWNLOAD EPISODE
                      </h1>
                    </div>
                    <p className="text-gray-400 text-[12px] mt-1 italic">
                      *Klik tombol di bawah, lalu di tab video yang terbuka klik tanda titik tiga (⋮) di pojok kanan bawah player dan pilih "Download".
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {streamInfo.streamingLink.downloads.map((dl, idx) => (
                      <a
                        key={idx}
                        href={dl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center bg-[#1e1d2b] hover:bg-[#2a293d] border border-transparent hover:border-[#FFBADE] rounded-md px-6 py-2 min-w-[140px] transition-all cursor-pointer"
                      >
                        <span className="text-white font-bold text-[13.5px]">
                          {dl.server.includes("AnimeLovers") ? "AL" : dl.server} download {dl.quality}
                        </span>
                        <span className="text-gray-400 text-[11.5px] mt-1">{dl.size !== "Unknown" ? dl.size : "Direct Link"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {seasons?.length > 0 && (
                <div className="flex flex-col gap-y-2 bg-[#11101A] p-4">
                  <h1 className="w-fit text-lg max-[478px]:text-[18px] font-semibold">
                    Watch more seasons of this anime
                  </h1>
                  <div className="flex flex-wrap gap-4 max-[575px]:grid max-[575px]:grid-cols-3 max-[575px]:gap-3 max-[480px]:grid-cols-2">
                    {seasons.map((season, index) => (
                      <Link
                        to={`/${formatSlug(season?.season, season?.id)}`}
                        key={index}
                        className={`relative w-[20%] h-[60px] rounded-lg overflow-hidden cursor-pointer group ${animeId === String(season.id)
                          ? "border border-[#ffbade]"
                          : ""
                          } max-[1200px]:w-[140px] max-[575px]:w-full`}
                      >
                        <p
                          className={`text-[13px] text-center font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-2 z-30 line-clamp-2 group-hover:text-[#ffbade] ${animeId === String(season.id)
                            ? "text-[#ffbade]"
                            : "text-white"
                            }`}
                        >
                          {season.season}
                        </p>
                        <div className="absolute inset-0 z-10 bg-repeat"></div>
                        <img
                          src={`${season.season_poster}`}
                          alt=""
                          className="w-full h-full object-cover blur-[3px] opacity-50"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {nextEpisodeSchedule?.nextEpisodeSchedule &&
                showNextEpisodeSchedule && (
                  <div className="p-4">
                    <div className="w-full px-4 rounded-md bg-[#0088CC] flex items-center justify-between gap-x-2">
                      <div className="w-full h-fit">
                        <span className="text-[18px]">🚀</span>
                        {" Estimated the next episode will come at "}
                        <span className="text-[13.4px] font-medium">
                          {new Date(
                            new Date(
                              nextEpisodeSchedule.nextEpisodeSchedule
                            ).getTime() -
                            new Date().getTimezoneOffset() * 60000
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <span
                        className="text-[25px] h-fit font-extrabold text-[#80C4E6] mb-1 cursor-pointer"
                        onClick={() => setShowNextEpisodeSchedule(false)}
                      >
                        ×
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
          <div className="flex flex-col gap-y-4 items-start ml-8 max-[1400px]:ml-0 max-[1400px]:mt-10 max-[1400px]:flex-row max-[1400px]:gap-x-6 max-[1024px]:px-[30px] max-[1024px]:mt-8 max-[500px]:mt-4 max-[500px]:px-4">
            {animeInfo && animeInfo?.poster ? (
              <img
                src={`${animeInfo?.poster}`}
                alt=""
                className="w-[100px] h-[150px] object-cover max-[500px]:w-[70px] max-[500px]:h-[90px]"
              />
            ) : (
              <Skeleton className="w-[100px] h-[150px] rounded-none" />
            )}
            <div className="flex flex-col gap-y-4 justify-start">
              {animeInfo && animeInfo?.title ? (
                <p className="text-[26px] font-medium leading-6 max-[500px]:text-[18px]">
                  {language ? animeInfo?.title : animeInfo?.japanese_title}
                </p>
              ) : (
                <Skeleton className="w-[170px] h-[20px] rounded-xl" />
              )}
              <div className="flex flex-wrap w-fit gap-x-[2px] gap-y-[3px]">
                {animeInfo ? (
                  tags.map(
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
                  )
                ) : (
                  <Skeleton className="w-[70px] h-[20px] rounded-xl" />
                )}
                <div className="flex w-fit items-center ml-1">
                  {[
                    animeInfo?.animeInfo?.tvInfo?.showType,
                    animeInfo?.animeInfo?.tvInfo?.duration,
                  ].map(
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
              {animeInfo ? (
                animeInfo?.animeInfo?.Overview && (
                  <div className="max-h-[150px] overflow-hidden">
                    <div className="max-h-[110px] mt-2 overflow-y-auto">
                      <p className="text-[14px] font-[400]">
                        {animeInfo?.animeInfo?.Overview.length > 270 ? (
                          <>
                            {isFullOverview
                              ? animeInfo?.animeInfo?.Overview
                              : `${animeInfo?.animeInfo?.Overview.slice(
                                0,
                                270
                              )}...`}
                            <span
                              className="text-[13px] font-bold hover:cursor-pointer"
                              onClick={() => setIsFullOverview(!isFullOverview)}
                            >
                              {isFullOverview ? "- Less" : "+ More"}
                            </span>
                          </>
                        ) : (
                          animeInfo?.animeInfo?.Overview
                        )}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-y-2">
                  <Skeleton className="w-[200px] h-[10px] rounded-xl" />
                  <Skeleton className="w-[160px] h-[10px] rounded-xl" />
                  <Skeleton className="w-[100px] h-[10px] rounded-xl" />
                  <Skeleton className="w-[80px] h-[10px] rounded-xl" />
                </div>
              )}
              <p className="text-[14px] max-[575px]:hidden">
                {`${website_name} is the best site to watch `}
                <span className="font-bold">
                  {language ? animeInfo?.title : animeInfo?.japanese_title}
                </span>
                {` SUB online, or you can even watch `}
                <span className="font-bold">
                  {language ? animeInfo?.title : animeInfo?.japanese_title}
                </span>
                {` DUB in HD quality.`}
              </p>
              <Link
                to={`/${formatSlug(animeInfo?.title || animeInfo?.japanese_title, animeId)}`}
                className="w-fit text-[13px] bg-white rounded-[12px] px-[10px] py-1 text-black"
              >
                View detail
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-wrap gap-y-3 gap-x-4 items-center bg-[#191826] p-5 max-[575px]:px-4 max-[575px]:py-4 max-[320px]:hidden">
        <div className="flex items-center gap-x-3">
          <img
            src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
            alt="Share Anime"
            className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
          />
          <div className="flex flex-col w-fit mr-1">
            <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">Share Anime</p>
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
            onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Yuk nonton ${animeInfo?.title || animeInfo?.japanese_title || 'Anime Keren'} di NEETflix! Langsung klik: ${window.location.href}`)}`, "_blank")}
            className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg flex gap-x-1.5 items-center text-[12px] font-semibold hover:bg-[#128C7E] transition-all shadow-md"
          >
            <FaWhatsapp className="text-[14px]" /> WA
          </button>
        </div>
      </div>
      <div className="w-full px-4 grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col">
        <div className="mt-[15px] flex flex-col gap-y-7">
          {animeInfo?.charactersVoiceActors.length > 0 && (
            <Voiceactor animeInfo={animeInfo} className="!mt-0" />
          )}
          {animeInfo?.recommended_data.length > 0 ? (
            <CategoryCard
              label="Recommended for you"
              data={animeInfo?.recommended_data}
              limit={animeInfo?.recommended_data.length}
              showViewMore={false}
            />
          ) : (
            <CategoryCardLoader className={"mt-[15px]"} />
          )}
        </div>
        <div>
          {animeInfo && animeInfo.related_data ? (
            <Sidecard
              label="Related Anime"
              data={animeInfo.related_data}
              className="mt-[15px]"
            />
          ) : (
            <SidecardLoader className={"mt-[25px]"} />
          )}
          {homeInfo && homeInfo.most_popular && (
            <Sidecard
              label="Most Popular"
              data={homeInfo.most_popular.slice(0, 10)}
              className="mt-[15px]"
              limit={10}
            />
          )}
        </div>
      </div>
    </div>
  );
}
