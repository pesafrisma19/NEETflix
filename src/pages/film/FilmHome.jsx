import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FilmCard from '../../components/film/FilmCard';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import { Link } from 'react-router-dom';

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function FilmHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      document.title = "LK21 Film & Series - NEETflix";
      try {
        const response = await axios.get(`${NEETFLIXAPI}/api/lk21/home`);
        if (response.data?.success) {
          setData(response.data.results.data);
        } else {
          setError("Failed to fetch data from LK21");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loader type="home" />;
  if (error) return <Error />;
  if (!data) return null;

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-12 w-full px-4 max-[1200px]:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white max-[575px]:text-xl flex items-center gap-x-2">
            <div className="h-6 w-1 bg-[#ffbade] rounded-full"></div>
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-6 max-[1200px]:grid-cols-5 max-[990px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-2 gap-x-4 gap-y-8">
          {items.slice(0, 12).map((item) => (
            <FilmCard 
              key={item.id} 
              id={item.id}
              title={item.title}
              image={item.image}
              rating={item.rating}
              episode={item.episode}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pt-24 pb-20 w-full min-h-screen">
      <div className="px-4 w-full max-[1200px]:px-0 flex flex-col items-center">
        {/* Banner Placeholder */}
        <div className="w-full h-[300px] bg-[#2A2A38] rounded-xl flex items-center justify-center border border-[#ffbade] mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="relative z-20 text-left p-8 w-full">
                <h1 className="text-5xl font-extrabold text-white mb-4">LK21 <span className="text-[#ffbade]">FILM</span></h1>
                <p className="text-gray-300 max-w-xl text-lg">Nonton film dan series terlengkap, tercepat, dan bebas iklan pop-up. Eksklusif di NEETflix.</p>
            </div>
            <img src="/splash.webp" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        </div>

        {renderSection("Film Terbaru", data.filmTerbaru)}
        {renderSection("Series Terbaru", data.seriesTerbaru)}
        {renderSection("Film Unggulan", data.filmUnggulan)}
        {renderSection("Series Unggulan", data.seriesUnggulan)}
      </div>
    </div>
  );
}

export default FilmHome;
