import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FilmPlayer from '../../components/film/FilmPlayer';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faList } from '@fortawesome/free-solid-svg-icons';

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function WatchFilm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const epId = searchParams.get("epId");

  const [streamData, setStreamData] = useState(null);
  const [infoData, setInfoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [id, epId]);

  if (loading) return <Loader type="watch" />;
  if (error) return <Error />;
  if (!streamData) return null;

  const m3u8Url = streamData.iframe ? `https://lk21.strm.web.id/api/stream/raw?url=${encodeURIComponent(streamData.iframe)}` : null;

  const titleClean = infoData?.title?.replace(/Nonton | Sub Indo di Lk21/g, "") || id;

  return (
    <div className="w-full min-h-screen bg-[#161523] pt-24 pb-20 px-10 max-[768px]:px-4">
      <div className="mb-4 flex items-center justify-between">
        <button 
            onClick={() => navigate(`/film/${id}`)}
            className="text-gray-300 hover:text-[#ffbade] flex items-center gap-2 font-bold transition-colors"
        >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Details
        </button>
        <h1 className="text-xl font-bold text-white hidden md:block">{titleClean}</h1>
      </div>

      <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-[#ffbade]/20 relative bg-black">
          {m3u8Url ? (
             <FilmPlayer 
                 url={m3u8Url} 
                 title={titleClean} 
                 poster={infoData?.poster}
             />
          ) : (
              <div className="w-full h-full flex items-center justify-center text-white">Video Not Available</div>
          )}
      </div>

      {infoData?.isSeries && infoData?.episodes && (
          <div className="mt-8 bg-[#201f31] p-6 rounded-xl border border-[#3b3a52]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faList} className="text-[#ffbade]" /> Episodes
            </h2>
            <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-4 max-[992px]:grid-cols-3 max-[768px]:grid-cols-2 max-[480px]:grid-cols-1">
                {infoData.episodes.map((ep, index) => {
                    const isCurrent = epId === ep.id;
                    return (
                        <button
                            key={index}
                            onClick={() => navigate(`/film/watch/${id}?epId=${encodeURIComponent(ep.id)}`)}
                            className={`${isCurrent ? 'bg-[#ffbade] text-black font-extrabold' : 'bg-[#2A2A38] text-white hover:bg-[#3d3c50] border-[#3b3a52]'} p-4 rounded-xl text-left font-semibold transition-colors border`}
                        >
                            {ep.title}
                        </button>
                    )
                })}
            </div>
          </div>
      )}
    </div>
  );
}

export default WatchFilm;
