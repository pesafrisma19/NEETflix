import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilmCard from '../../components/film/FilmCard';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import axios from 'axios';

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function FilmSearch() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword');
  
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!keyword) {
      setFilms([]);
      setLoading(false);
      return;
    }

    const fetchSearch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${NEETFLIXAPI}/api/lk21/search?q=${encodeURIComponent(keyword)}`);
        if (res.data?.success) {
          setFilms(res.data.results.data || []);
        } else {
          throw new Error("Gagal mencari film di LK21");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSearch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [keyword]);

  if (loading) return <Loader type="home" />;
  if (error) return <Error error={error} />;

  return (
    <div className="min-h-screen pt-[80px] px-4 md:px-8 max-w-[1400px] mx-auto text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white max-[575px]:text-xl flex items-center gap-x-2">
            <div className="h-6 w-1 bg-[#ffbade] rounded-full"></div>
            Hasil Pencarian Film: <span className="text-[#ffbade]">{keyword}</span>
        </h2>
      </div>

      {films.length === 0 && !loading ? (
        <div className="text-center py-10 text-gray-400">Tidak ada film/series yang ditemukan.</div>
      ) : (
        <div className="grid grid-cols-6 max-[1200px]:grid-cols-5 max-[990px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-2 gap-x-4 gap-y-8">
          {films.map((item) => (
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
      )}
    </div>
  );
}

export default FilmSearch;
