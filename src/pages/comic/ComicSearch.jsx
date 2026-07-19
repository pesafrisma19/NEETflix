import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ComicCard from '../../components/comic/ComicCard';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';

function ComicSearch() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword');
  
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!keyword) {
      setComics([]);
      setLoading(false);
      return;
    }

    const fetchSearch = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/search?q=${encodeURIComponent(keyword)}`);
        if (!res.ok) throw new Error("Gagal mencari komik");
        const data = await res.json();
        setComics(data.results || data.data || []);
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
        <h2 className="text-2xl font-bold text-white">
          Hasil Pencarian Komik: <span className="text-[#ffbade]">{keyword}</span>
        </h2>
      </div>

      {comics.length === 0 && !loading ? (
        <div className="text-center py-10 text-gray-400">Tidak ada komik yang ditemukan.</div>
      ) : (
        <div className="grid grid-cols-4 gap-x-3 gap-y-8 transition-all duration-300 ease-in-out mt-8 max-[1400px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-2">
          {comics.map((comic) => (
            <ComicCard 
              key={comic.id} 
              id={comic.id} 
              title={comic.title} 
              image={comic.poster || comic.image} 
              tvInfo={comic.tvInfo} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ComicSearch;
