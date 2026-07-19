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
      document.title = "NEETflix Film & Series";
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

    const renderSection = (title, items, categoryPath) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-12 w-full px-4 max-[1200px]:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white max-[575px]:text-xl flex items-center gap-x-2">
            <div className="h-6 w-1 bg-[#ffbade] rounded-full"></div>
            {title}
          </h2>
          {categoryPath && (
            <Link
              to={`/film/category/${categoryPath}`}
              className="flex w-fit items-baseline h-fit rounded-3xl gap-x-1 group"
            >
              <p className="text-white text-[12px] font-semibold h-fit leading-0 group-hover:text-[#ffbade] transition-all ease-out">
                Lihat Semua
              </p>
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" className="text-white group-hover:text-[#ffbade] text-[10px] transition-all ease-out" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg>
            </Link>
          )}
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
                <h1 className="text-5xl font-extrabold text-white mb-4">NEETflix <span className="text-[#ffbade]">FILM</span></h1>
                <p className="text-gray-300 max-w-xl text-lg">Nonton film dan series terlengkap, tercepat, dan bebas iklan pop-up. Eksklusif di NEETflix.</p>
            </div>
            <img src="/splash.webp" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        </div>

        {renderSection("Film Terbaru", data.filmTerbaru, "release")}
        {renderSection("Series Terbaru", data.seriesTerbaru, "latest-series")}
        {renderSection("Film Unggulan", data.filmUnggulan, "populer")}
        {renderSection("Series Unggulan", data.seriesUnggulan, "latest-series")}
      </div>
    </div>
  );
}

export default FilmHome;
