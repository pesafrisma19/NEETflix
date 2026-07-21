import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import FilmPlayer from '../../components/film/FilmPlayer';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import Episodelist from '../../components/episodelist/Episodelist';
import CommentFilm from "@/src/components/commentfilm/CommentFilm";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faList } from '@fortawesome/free-solid-svg-icons';
import { FaWhatsapp, FaLink } from 'react-icons/fa';
import website_name from "@/src/config/website";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function WatchFilm() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const epId = searchParams.get("epId");

  const [streamData, setStreamData] = useState(null);
  const [infoData, setInfoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFullOverview, setIsFullOverview] = useState(false);

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
  }, [loading, epId]);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        setLoading(true);
        // Fetch Info to get title and poster
        const infoRes = await axios.get(`${NEETFLIXAPI}/api/lk21/info?id=${id}`);
        if (infoRes.data?.success) {
            setInfoData(infoRes.data.results.data);
            document.title = `Nonton ${infoRes.data.results.data.title.replace(/Nonton | Sub Indo di Lk21/g, "")} - LK21 NEETflix`;
        }

        // Fetch Stream
        const streamUrl = epId ? `${NEETFLIXAPI}/api/lk21/stream?id=${encodeURIComponent(epId)}` : `${NEETFLIXAPI}/api/lk21/stream?id=${id}`;
        const res = await axios.get(streamUrl);
        
        if (res.data?.success) {
          setStreamData(res.data.results.data);
        } else {
          setError("Failed to fetch streaming URL");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, epId]);

  if (loading) return <Loader type="watch" />;
  if (error) return <Error />;
  if (!streamData || !infoData) return null;

  const isYouTube = streamData.iframe && (streamData.iframe.includes('youtube.com') || streamData.iframe.includes('youtu.be'));
  const m3u8Url = streamData.iframe && !isYouTube ? `https://lk21.strm.web.id/api/stream/raw?url=${encodeURIComponent(streamData.iframe)}` : null;

  const titleClean = infoData?.title?.replace(/Nonton | Sub Indo di Lk21/g, "") || id;
  
  // Format episodes for Episodelist component
  const processedEpisodes = infoData?.episodes ? infoData.episodes.map((ep, index) => ({
    ...ep,
    episode_no: (index + 1).toString(),
    tmdb: { title: ep.title }
  })) : [];
  
  const currentEpIndex = processedEpisodes.findIndex(ep => ep.id === epId);
  const currentEpisodeNo = currentEpIndex !== -1 ? (currentEpIndex + 1).toString() : "1";

  const handleEpisodeClick = (epNo) => {
    const selectedEp = processedEpisodes.find(ep => ep.episode_no === epNo);
    if (selectedEp) {
        setSearchParams({ epId: selectedEp.id });
    }
  };

  return (
    <div className="w-full h-fit flex flex-col justify-center items-center relative">
      <div className="w-full relative max-[1400px]:px-[30px] max-[1200px]:px-[80px] max-[1024px]:px-0">
        <img
          src={infoData?.poster || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
          alt={`${titleClean} Poster`}
          className="absolute inset-0 w-full h-full object-cover filter grayscale z-[-900]"
        />
        <div className="absolute inset-0 bg-[#3a3948] bg-opacity-80 backdrop-blur-md z-[-800]"></div>
        
        <div className="relative z-10 px-4 pb-[50px] grid grid-cols-[minmax(0,75%),minmax(0,25%)] w-full h-full mt-[128px] max-[1400px]:flex max-[1400px]:flex-col max-[1200px]:mt-[64px] max-[1024px]:px-0 max-md:mt-[50px]">
          
          <ul className="flex absolute left-4 top-[-40px] gap-x-2 items-center w-fit max-[1200px]:hidden">
            <li className="flex gap-x-3 items-center">
                <Link to="/film" className="text-white hover:text-[#FFBADE] text-[15px] font-semibold">Film Home</Link>
                <div className="dot mt-[1px] bg-white"></div>
            </li>
            <p className="font-light text-[15px] text-gray-300 line-clamp-1 max-[575px]:leading-5">
              Watching {titleClean}
            </p>
          </ul>
          
          <div className="flex w-full min-h-fit max-[1200px]:flex-col-reverse">
            {infoData?.isSeries && infoData?.episodes && infoData.episodes.length > 0 && (
                <div className="episodes w-[35%] bg-[#191826] flex justify-center items-center max-[1400px]:w-[380px] max-[1200px]:w-full max-[1200px]:h-full max-[1200px]:min-h-[100px]">
                    <Episodelist
                        episodes={processedEpisodes}
                        currentEpisode={currentEpisodeNo}
                        onEpisodeClick={handleEpisodeClick}
                        totalEpisodes={processedEpisodes.length}
                    />
                </div>
            )}
            
            <div className={`player ${infoData?.isSeries ? 'w-full' : 'w-[100%]'} h-fit bg-black flex flex-col`}>
              <div className="w-full relative h-[480px] max-[1400px]:h-[40vw] max-[1200px]:h-[48vw] max-[1024px]:h-[58vw] max-[600px]:h-[65vw]">
                  {isYouTube ? (
                    <iframe
                        src={streamData.iframe}
                        allowFullScreen
                        className="w-full h-full border-0 absolute top-0 left-0"
                        title={titleClean}
                    ></iframe>
                  ) : m3u8Url ? (
                    <FilmPlayer 
                        url={m3u8Url} 
                        title={titleClean} 
                        poster={infoData?.poster}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-50">
                        <div className="w-[70px] h-[70px] rounded-full bg-[#FFBADE] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,186,222,0.3)]">
                            <svg className="w-10 h-10 text-[#191826]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                            </svg>
                        </div>
                        <h2 className="text-[#FFBADE] font-black text-[20px] sm:text-[24px] uppercase tracking-wider mb-3">
                            VIDEO SEGERA HADIR
                        </h2>
                        <p className="text-gray-300 text-[14px] sm:text-[15px] leading-relaxed font-medium">
                            Maaf, video untuk ini belum tersedia.
                        </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-y-4 items-start ml-8 max-[1400px]:ml-0 max-[1400px]:mt-10 max-[1400px]:flex-row max-[1400px]:gap-x-6 max-[1024px]:px-[30px] max-[1024px]:mt-8 max-[500px]:mt-4 max-[500px]:px-4">
            <img
                src={infoData?.poster}
                alt=""
                className="w-[100px] h-[150px] object-cover max-[500px]:w-[70px] max-[500px]:h-[90px]"
            />
            <div className="flex flex-col gap-y-4 justify-start">
              <p className="text-[26px] font-medium leading-6 max-[500px]:text-[18px]">
                {titleClean}
              </p>
              
              <div className="flex flex-wrap w-fit gap-x-[2px] gap-y-[3px]">
                <div className="flex space-x-1 justify-center items-center px-[4px] py-[1px] text-black font-semibold text-[13px] bg-[#FFBADE] rounded-l-[4px]">
                    <p className="text-[12px]">HD</p>
                </div>
                <div className="flex w-fit items-center ml-1">
                    <div className="px-1 h-fit flex items-center gap-x-2 w-fit">
                        <div className="dot mt-[2px]"></div>
                        <p className="text-[14px]">{infoData?.isSeries ? 'Series' : 'Movie'}</p>
                    </div>
                </div>
              </div>
              
              {infoData?.synopsis && (
                <div className="max-h-[150px] overflow-hidden">
                  <div className="max-h-[110px] mt-2 overflow-y-auto pr-2">
                    <p className="text-[14px] font-[400]">
                      {infoData?.synopsis.length > 270 ? (
                        <>
                          {isFullOverview
                            ? infoData?.synopsis
                            : `${infoData?.synopsis.slice(0, 270)}...`}
                          <span
                            className="text-[13px] font-bold hover:cursor-pointer ml-1"
                            onClick={() => setIsFullOverview(!isFullOverview)}
                          >
                            {isFullOverview ? "- Less" : "+ More"}
                          </span>
                        </>
                      ) : (
                        infoData?.synopsis
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-[14px] max-[575px]:hidden">
                {`${website_name} is the best site to watch `}
                <span className="font-bold">
                  {titleClean}
                </span>
                {` online in HD quality.`}
              </p>
              <Link
                to={`/film/${id}`}
                className="w-fit text-[13px] bg-white rounded-[12px] px-[10px] py-1 text-black font-semibold hover:bg-gray-200 transition-colors"
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
            alt="Share Film"
            className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
          />
          <div className="flex flex-col w-fit mr-1">
            <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">Share Film</p>
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
      
      <div className="w-full px-4 grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col mt-4">
        <div className="flex flex-col gap-y-7">
            <CommentFilm targetId={`${id}${epId ? `-${epId}` : ''}`} episodeTitle={titleClean} />
        </div>
        <div>
            {/* placeholder for sidebar related films */}
        </div>
      </div>
    </div>
  );
}

export default WatchFilm;
