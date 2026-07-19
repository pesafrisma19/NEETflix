import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FilmCard from '../../components/film/FilmCard';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import { Link } from 'react-router-dom';
import FilmSpotlight from '../../components/film/FilmSpotlight';
import FilmGenre from '../../components/film/FilmGenre';
import { FaChevronRight } from 'react-icons/fa';

const FILM_GENRES = [
  "Action", "Adventure", "Animation", "Biography", "Comedy", 
  "Crime", "Documentary", "Drama", "Family", "Fantasy", 
  "History", "Horror", "Musical", "Mystery", "Romance", 
  "Sci-Fi", "Sport", "Thriller", "War", "Western"
];

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
      <div className="mt-[60px] w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bold text-2xl text-[#ffbade] max-[478px]:text-[18px] capitalize">
            {title}
          </h1>
          {categoryPath && (
            <Link
              to={`/film/category/${categoryPath}`}
              className="flex w-fit items-baseline h-fit rounded-3xl gap-x-1 group"
            >
              <p className="text-white text-[12px] font-semibold h-fit leading-0 group-hover:text-[#ffbade] transition-all ease-out">
                View more
              </p>
              <FaChevronRight className="text-white text-[10px] group-hover:text-[#ffbade] transition-all ease-out" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-4 max-[1200px]:grid-cols-5 max-[990px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-2 gap-x-3 gap-y-8">
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

  const renderSideSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="w-full flex flex-col mt-[60px]">
        <h1 className="text-2xl text-[#ffbade] max-[478px]:text-[18px] font-bold mb-6">
          {title}
        </h1>
        <div className="flex flex-col gap-y-4 bg-[#2A2A38] p-4 rounded-xl">
          {items.slice(0, 10).map((item, index) => (
            <Link
              to={`/film/${item.id}`}
              key={index}
              className="flex items-center gap-x-4 group border-b border-[#3b3a52] pb-4 last:border-0 last:pb-0"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-[60px] h-[80px] object-cover rounded-md group-hover:opacity-80 transition-opacity"
              />
              <div className="flex flex-col">
                <p className="text-white font-semibold line-clamp-2 group-hover:text-[#ffbade] text-[14px]">
                  {item.title}
                </p>
                <p className="text-[#ffbade] text-[12px] font-bold mt-1">
                  ⭐ {item.rating || "N/A"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 w-full max-[1200px]:px-0">
      <FilmSpotlight spotlights={data.filmTerbaru.slice(0, 5)} />
      
      <div className="w-full grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col max-[1200px]:px-4">
        <div>
          {renderSection("Film Terbaru", data.filmTerbaru, "release")}
          {renderSection("Series Terbaru", data.seriesTerbaru, "latest-series")}
          {renderSection("Series Update", data.seriesUpdate, "latest-series")}
        </div>
        <div className="w-full mt-[60px] max-[1200px]:mt-0">
          <FilmGenre data={FILM_GENRES} />
          {renderSideSection("Film Unggulan", data.filmUnggulan)}
          {renderSideSection("Top Bulan Ini", data.topBulanIni)}
        </div>
      </div>
    </div>
  );
}

export default FilmHome;
