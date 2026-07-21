import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FilmPlayer from '../../components/film/FilmPlayer';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faList } from '@fortawesome/free-solid-svg-icons';
import { FaWhatsapp, FaLink } from 'react-icons/fa';
import website_name from "@/src/config/website";

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

  return (
    <div className="w-full h-fit flex flex-col justify-center items-center relative">
      <div className="w-full relative max-[1400px]:px-[30px] max-[1200px]:px-[80px] max-[1024px]:px-0">
        <img
          src={infoData.image}
          alt={infoData.title}
          className="absolute inset-0 right-0 h-[600px] w-full object-cover opacity-20 blur-md pointer-events-none"
        />
        <div className="absolute inset-0 h-[600px] w-full bg-gradient-to-t from-[#161523] to-transparent pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto pt-4 flex flex-col xl:flex-row gap-6 mt-[65px] px-4 max-[1200px]:px-0">
          
          <div className="w-full xl:w-[75%] flex flex-col gap-y-4">
            <div className="w-full bg-black rounded-xl overflow-hidden aspect-video shadow-2xl relative">
              {selectedServer === 'native' && streamData?.streamUrl ? (
                 <FilmPlayer 
                    url={streamData.streamUrl} 
                    title={infoData.title} 
                    poster={infoData.image} 
                 />
              ) : selectedServer && selectedServer !== 'native' ? (
                 <iframe 
                   src={selectedServer} 
                   className="w-full h-full" 
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
              <div className="flex flex-col gap-y-2 px-2 mt-1">
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
            
            <div className="flex flex-col gap-y-2 mt-2 px-2">
              <h1 className="text-2xl font-bold text-white max-md:text-xl">
                {infoData.title}
              </h1>
              <h2 className="text-xl font-semibold text-[#FFBADE] max-md:text-lg">
                {currentEpisode?.title || `Episode ${currentEpId}`}
              </h2>
              <div className="flex gap-x-3 items-center mt-2">
                <Link to={`/donghua/${id}`} className="bg-[#2A2A38] text-white px-4 py-2 rounded-lg flex items-center gap-x-2 text-sm font-semibold hover:bg-[#FFBADE] hover:text-black transition-colors">
                  <FontAwesomeIcon icon={faArrowLeft} /> Back to Detail
                </Link>
                <button 
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="bg-[#2A2A38] text-white px-4 py-2 rounded-lg flex items-center gap-x-2 text-sm font-semibold hover:bg-[#FFBADE] hover:text-black transition-colors"
                >
                  <FaLink /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Episode List */}
          <div className="w-full xl:w-[25%] flex flex-col gap-y-4 episodes">
            <div className="bg-[#191826] rounded-xl p-4 flex-grow border border-white/5 flex flex-col h-full max-h-[600px]">
              <div className="flex items-center gap-x-2 mb-4 border-b border-white/10 pb-3">
                <FontAwesomeIcon icon={faList} className="text-[#FFBADE]" />
                <h3 className="font-bold text-lg text-white">Episodes</h3>
                <span className="text-sm text-gray-400 ml-auto">{infoData.episodes?.length || 0} eps</span>
              </div>
              
              <div className="flex flex-col gap-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {infoData.episodes?.map((ep, idx) => {
                  const isActive = ep.id === currentEpId;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSearchParams({ ep: ep.id })}
                      className={`flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                        isActive 
                          ? "bg-[#FFBADE] text-black font-bold" 
                          : "bg-[#2A2A38] text-gray-200 hover:bg-white/10"
                      }`}
                    >
                      <span className="line-clamp-1 text-sm">{ep.title}</span>
                      {isActive && <div className="w-2 h-2 rounded-full bg-black ml-2 flex-shrink-0 animate-pulse"></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="w-full max-w-[1400px] mx-auto px-4 mt-8 pb-10">
        <div className="bg-[#191826] rounded-xl p-6 border border-white/5">
          <h3 className="font-bold text-xl text-white mb-3">Overview</h3>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
             {infoData.synopsis}
          </p>
        </div>
      </div>
    </div>
  );
}

export default WatchDonghua;
