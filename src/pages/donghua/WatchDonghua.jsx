import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FilmPlayer from '../../components/film/FilmPlayer';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import Episodelist from '../../components/episodelist/Episodelist';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faList } from '@fortawesome/free-solid-svg-icons';
import { FaWhatsapp, FaLink } from 'react-icons/fa';
import website_name from "@/src/config/website";
import { supabase } from "@/src/lib/supabaseClient";
import CommentAnime from "@/src/components/commentanime/CommentAnime";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function WatchDonghua() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const epId = searchParams.get("ep");

  const [streamData, setStreamData] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [infoData, setInfoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFullOverview, setIsFullOverview] = useState(false);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        setLoading(true);
        // Fetch Info to get title and poster
        const infoRes = await axios.get(`${NEETFLIXAPI}/api/anichin/info?id=${id}`);
        let fetchedInfo = null;
        if (infoRes.data?.success) {
            fetchedInfo = infoRes.data.results;
            setInfoData(fetchedInfo);
            document.title = `Nonton ${fetchedInfo.title} - ${website_name}`;
        } else {
            throw new Error("Failed to fetch Donghua info");
        }

        // Determine which episode to play
        let targetEpId = epId;
        if (!targetEpId && fetchedInfo?.episodes?.length > 0) {
            targetEpId = fetchedInfo.episodes[fetchedInfo.episodes.length - 1].id;
        }

        if (targetEpId) {
            const res = await axios.get(`${NEETFLIXAPI}/api/anichin/stream?id=${encodeURIComponent(targetEpId)}`);
            if (res.data?.success) {
              setStreamData(res.data.results);
              if (res.data.results?.streamUrl) {
                 setSelectedServer('native');
              } else if (res.data.results?.servers && res.data.results.servers.length > 0) {
                 setSelectedServer(res.data.results.servers[0].url);
              } else if (res.data.results?.iframeSrc) {
                 setSelectedServer(res.data.results.iframeSrc);
              }

              if (fetchedInfo) {
                const currentEpObj = fetchedInfo.episodes?.find(ep => ep.id === targetEpId);
                const episodeTitle = currentEpObj?.title || targetEpId;
                const donghuaTitle = fetchedInfo.title || id;
                const posterUrl = fetchedInfo.image || "";

                const newEntry = {
                  id: id,
                  episodeId: targetEpId,
                  episodeNum: episodeTitle,
                  title: donghuaTitle,
                  poster: posterUrl,
                  mediaType: 'donghua',
                  updatedAt: Date.now()
                };

                try {
                  const continueWatching = JSON.parse(localStorage.getItem("continueWatching")) || [];
                  const filtered = continueWatching.filter((item) => item.id !== id);
                  filtered.unshift(newEntry);
                  localStorage.setItem("continueWatching", JSON.stringify(filtered));
                } catch (err) {}

                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    const { data: existing } = await supabase
                      .from('watch_history')
                      .select('id')
                      .eq('user_id', session.user.id)
                      .eq('anime_id', String(id))
                      .maybeSingle();

                    if (existing) {
                      await supabase
                        .from('watch_history')
                        .update({
                          episode_id: String(targetEpId),
                          watched_at: new Date(),
                          details: { title: donghuaTitle, poster: posterUrl, mediaType: 'donghua' }
                        })
                        .eq('id', existing.id);
                    } else {
                      await supabase
                        .from('watch_history')
                        .insert({
                          user_id: session.user.id,
                          anime_id: String(id),
                          episode_id: String(targetEpId),
                          watched_at: new Date(),
                          details: { title: donghuaTitle, poster: posterUrl, mediaType: 'donghua' }
                        });
                    }
                  }
                } catch (err) {}
              }
            } else {
              setError("Failed to fetch streaming URL");
            }
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

  const currentEpId = epId || (infoData?.episodes?.length > 0 ? infoData.episodes[infoData.episodes.length - 1].id : null);
  const currentEpisode = infoData.episodes?.find(ep => ep.id === currentEpId);

  const processedEpisodes = infoData?.episodes ? infoData.episodes.map((ep, index) => {
    const match = ep.title?.match(/(\d+)/) || ep.id?.match(/(\d+)/);
    const epNum = match ? match[1] : (index + 1).toString();
    return {
      id: ep.id,
      episode_no: epNum,
      title: ep.title,
      japanese_title: ep.title
    };
  }) : [];

  const currentEpObj = processedEpisodes.find(ep => ep.id === currentEpId);
  const currentEpisodeNo = currentEpObj ? currentEpObj.episode_no : "1";

  const handleEpisodeClick = (epNoOrId) => {
    const selectedEp = processedEpisodes.find(ep => ep.episode_no === epNoOrId || ep.id === epNoOrId);
    if (selectedEp) {
      setSearchParams({ ep: selectedEp.id });
    }
  };

  return (
    <div className="w-full h-fit flex flex-col justify-center items-center relative">
      <div className="w-full relative max-[1400px]:px-[30px] max-[1200px]:px-[80px] max-[1024px]:px-0">
        <img
          src={infoData?.image || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
          alt={infoData?.title}
          className="absolute inset-0 w-full h-full object-cover filter grayscale z-[-900]"
        />
        <div className="absolute inset-0 bg-[#3a3948] bg-opacity-80 backdrop-blur-md z-[-800]"></div>
        
        <div className="relative z-10 px-4 pb-[50px] grid grid-cols-[minmax(0,75%),minmax(0,25%)] w-full h-full mt-[128px] max-[1400px]:flex max-[1400px]:flex-col max-[1200px]:mt-[64px] max-[1024px]:px-0 max-md:mt-[50px]">
          <ul className="flex absolute left-4 top-[-40px] gap-x-2 items-center w-fit max-[1200px]:hidden">
            <li className="flex gap-x-3 items-center">
              <Link to="/donghua" className="text-white hover:text-[#FFBADE] text-[15px] font-semibold">Donghua Home</Link>
              <div className="dot mt-[1px] bg-white"></div>
            </li>
            <p className="font-light text-[15px] text-gray-300 line-clamp-1 max-[575px]:leading-5">
              Watching {infoData?.title}
            </p>
          </ul>
          
          <div className="flex w-full min-h-fit max-[1200px]:flex-col-reverse">
            {processedEpisodes.length > 0 && (
              <div className="episodes w-[35%] bg-[#191826] flex justify-center items-center max-[1400px]:w-[380px] max-[1200px]:w-full max-[1200px]:h-full max-[1200px]:min-h-[100px]">
                <Episodelist
                  episodes={processedEpisodes}
                  currentEpisode={currentEpisodeNo}
                  onEpisodeClick={handleEpisodeClick}
                  totalEpisodes={processedEpisodes.length}
                />
              </div>
            )}
            
            <div className="player w-full h-fit bg-black flex flex-col">
              <div className="w-full relative h-[480px] max-[1400px]:h-[40vw] max-[1200px]:h-[48vw] max-[1024px]:h-[58vw] max-[600px]:h-[65vw]">
                {selectedServer === 'native' && streamData?.streamUrl ? (
                  <FilmPlayer 
                    url={streamData.streamUrl} 
                    title={infoData.title} 
                    poster={infoData.image} 
                  />
                ) : selectedServer && selectedServer !== 'native' ? (
                  <iframe 
                    src={selectedServer} 
                    className="w-full h-full border-0" 
                    allowFullScreen 
                    frameBorder="0"
                    sandbox="allow-same-origin allow-scripts"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                    Stream not available
                  </div>
                )}
              </div>
              
              {streamData?.servers && streamData.servers.length > 0 && (
                <div className="flex flex-col gap-y-2 p-4 bg-[#1e1d2b] border-t border-[#3b3a52]">
                  <h3 className="text-white text-sm font-semibold">Pilih Server:</h3>
                  <div className="flex flex-wrap gap-2">
                    {streamData?.streamUrl && (
                      <button
                        onClick={() => setSelectedServer('native')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          selectedServer === 'native' ? 'bg-[#ffbade] text-black shadow-[0_0_10px_#ffbade]' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        PREM (Tanpa Iklan)
                      </button>
                    )}
                    {streamData.servers
                      .filter(server => server.name.toLowerCase().includes('ok') || server.name.toLowerCase().includes('vip'))
                      .map((server, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedServer(server.url)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          selectedServer === server.url ? 'bg-[#ffbade] text-black shadow-[0_0_10px_#ffbade]' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {server.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column / Bottom Info Box (Matching Watch.jsx) */}
          <div className="flex flex-col gap-y-4 items-start ml-8 max-[1400px]:ml-0 max-[1400px]:mt-10 max-[1400px]:flex-row max-[1400px]:gap-x-6 max-[1024px]:px-[30px] max-[1024px]:mt-8 max-[500px]:mt-4 max-[500px]:px-4">
            <img
              src={infoData?.image}
              alt={infoData?.title}
              className="w-[100px] h-[150px] object-cover max-[500px]:w-[70px] max-[500px]:h-[90px] rounded-lg shadow-lg"
            />
            <div className="flex flex-col gap-y-4 justify-start text-white">
              <p className="text-[26px] font-medium leading-6 max-[500px]:text-[18px]">
                {infoData?.title}
              </p>
              <div className="flex flex-wrap w-fit gap-x-[2px] gap-y-[3px]">
                <div className="flex space-x-1 justify-center items-center px-[4px] py-[1px] text-black font-bold text-[13px] bg-[#FFBADE] rounded-l-[4px]">
                  <p className="text-[12px]">HD</p>
                </div>
                <div className="flex space-x-1 justify-center items-center px-[4px] py-[1px] text-black font-bold text-[13px] bg-[#B0E3AF] rounded-r-[4px]">
                  <p className="text-[12px]">SUB</p>
                </div>
                <div className="flex w-fit items-center ml-1">
                  <div className="px-1 h-fit flex items-center gap-x-2 w-fit text-sm text-gray-300">
                    <div className="dot mt-[2px] bg-white"></div>
                    <p className="text-[14px]">Donghua</p>
                  </div>
                </div>
              </div>
              {infoData?.synopsis && (
                <div className="max-h-[150px] overflow-hidden">
                  <div className="max-h-[110px] mt-2 overflow-y-auto">
                    <p className="text-[14px] font-[400] text-gray-300 leading-relaxed">
                      {infoData.synopsis}
                    </p>
                  </div>
                </div>
              )}
              <Link
                to={`/donghua/${id}`}
                className="w-fit text-[13px] bg-white rounded-[12px] px-[10px] py-1 text-black font-bold hover:bg-[#FFBADE] transition-all"
              >
                View detail
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Share Section (Matching Watch.jsx) */}
      <div className="w-full flex flex-wrap gap-y-3 gap-x-4 items-center bg-[#191826] p-5 max-[575px]:px-4 max-[575px]:py-4 max-[320px]:hidden">
        <div className="flex items-center gap-x-3">
          <img
            src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
            alt="Share Donghua"
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
            onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Yuk nonton ${infoData?.title} di NEETflix! Langsung klik: ${window.location.href}`)}`, "_blank")}
            className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg flex gap-x-1.5 items-center text-[12px] font-semibold hover:bg-[#128C7E] transition-all shadow-md"
          >
            <FaWhatsapp className="text-[14px]" /> WA
          </button>
        </div>
      </div>

      {/* Comments Section (Matching Watch.jsx) */}
      <div className="w-full max-w-[1400px] px-4 py-8">
        <CommentAnime 
          targetId={`donghua-${id}-${currentEpId}`} 
          episodeTitle={currentEpisode?.title || `Episode ${currentEpId}`} 
        />
      </div>
    </div>
  );
}

export default WatchDonghua;
