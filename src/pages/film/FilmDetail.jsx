import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faList } from '@fortawesome/free-solid-svg-icons';

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
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
  }, [id]);

  if (loading) return <Loader type="home" />;
  if (error) return <Error />;
  if (!data) return null;

  const titleClean = data.title.replace(/Nonton | Sub Indo di Lk21/g, "");
  const isYouTube = data.iframe && (data.iframe.includes('youtube.com') || data.iframe.includes('youtu.be'));
  
  // Parse seasons if episodes exist
  let seasons = {};
  if (data.episodes && data.episodes.length > 0) {
      data.episodes.forEach(ep => {
          let sNum = "1";
          const sMatch = ep.id.match(/season-(\d+)/i) || ep.title.match(/season\s?(\d+)/i);
          if (sMatch) sNum = sMatch[1];
          
          const seasonKey = `Season ${sNum}`;
          if (!seasons[seasonKey]) seasons[seasonKey] = [];
          seasons[seasonKey].push(ep);
      });
  }
  const seasonKeys = Object.keys(seasons).sort((a,b) => a.localeCompare(b));
  
  const episodesToDisplay = selectedSeason === "all" 
      ? data.episodes 
      : seasons[selectedSeason] || [];

  return (
    <div className="w-full min-h-screen pb-20">
      {/* Banner / Hero Section */}
      <div className="relative w-full h-[500px] max-[768px]:h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#161523] via-[#161523]/80 to-transparent z-10"></div>
        <img 
            src={data.poster} 
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
            alt="Background"
        />
        
        <div className="absolute bottom-0 left-0 w-full z-20 px-10 pb-10 flex gap-8 max-[768px]:flex-col max-[768px]:px-4">
            <img 
                src={data.poster} 
                className="w-[200px] h-[300px] object-cover rounded-xl shadow-2xl border border-[#ffbade]/30 max-[768px]:w-[120px] max-[768px]:h-[180px]"
                alt={titleClean}
            />
            <div className="flex flex-col justify-end">
                <h1 className="text-4xl font-extrabold text-white mb-4 max-[768px]:text-2xl">{titleClean}</h1>
                <p className="text-gray-300 max-w-3xl line-clamp-4 mb-6">{data.synopsis}</p>
                
                <div className="flex gap-4">
                    {!data.isSeries ? (
                        <button 
                            onClick={() => navigate(`/film/watch/${id}`)}
                            className="bg-[#ffbade] hover:bg-[#ff9acb] text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPlay} /> Watch Movie
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                if (data.episodes && data.episodes.length > 0) {
                                    // Watch first episode
                                    navigate(`/film/watch/${id}?epId=${encodeURIComponent(data.episodes[0].id)}`);
                                }
                            }}
                            className="bg-[#ffbade] hover:bg-[#ff9acb] text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPlay} /> Watch Episode 1
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-10 mt-12 max-[768px]:px-4">
        {/* Trailer Section */}
        {isYouTube && (
            <div className="w-full mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlay} className="text-[#ffbade]" /> Trailer
                </h2>
                <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-[#ffbade]/20">
                    <iframe
                        src={data.iframe}
                        allowFullScreen
                        className="w-full h-full border-0"
                        title="Trailer"
                    ></iframe>
                </div>
            </div>
        )}
        
        {data.isSeries && data.episodes && data.episodes.length > 0 && (
            <div className="w-full">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FontAwesomeIcon icon={faList} className="text-[#ffbade]" /> Episodes
                    </h2>
                    {seasonKeys.length > 1 && (
                        <select 
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            className="bg-[#2A2A38] text-white p-2 rounded-lg border border-[#3b3a52] focus:outline-none focus:border-[#ffbade]"
                        >
                            <option value="all">All Seasons</option>
                            {seasonKeys.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>
                
                <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-4 max-[992px]:grid-cols-3 max-[768px]:grid-cols-2 max-[480px]:grid-cols-1">
                    {episodesToDisplay.map((ep, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(`/film/watch/${id}?epId=${encodeURIComponent(ep.id)}`)}
                            className="bg-[#2A2A38] hover:bg-[#ffbade] hover:text-black text-white p-4 rounded-xl text-left font-semibold transition-colors border border-[#3b3a52] line-clamp-1"
                            title={ep.title}
                        >
                            {ep.title}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default FilmDetail;
