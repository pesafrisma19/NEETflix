import React, { useEffect, useState } from "react";
import Loader from "@/src/components/Loader/Loader.jsx";
import Error from "@/src/components/error/Error.jsx";
import ComicSpotlight from "@/src/components/comic/ComicSpotlight/Spotlight.jsx";
import ComicTrending from "@/src/components/comic/ComicTrending/Trending.jsx";
import ComicCategoryCard from "@/src/components/comic/ComicCategoryCard/CategoryCard.jsx";
import ComicGenre from "@/src/components/comic/ComicGenre/Genre.jsx";
import ComicTopten from "@/src/components/comic/ComicTopten/Topten.jsx";

function ComicHome() {
  const [homeInfo, setHomeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/home`);
        if (!res.ok) throw new Error("Gagal memuat beranda komik");
        const response = await res.json();
        setHomeInfo(response.results || response.data || response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) return <Loader type="home" />;
  if (error) return <Error error={error} />;
  if (!homeInfo) return <Error error="Data tidak ditemukan" />;

  return (
    <>
      <div className="px-4 w-full max-[1200px]:px-0">
        {/* Spotlight / Hero Banner */}
        <ComicSpotlight spotlights={homeInfo.spotlights} />
        
        {/* Trending Slider */}
        <ComicTrending trending={homeInfo.trending} />

        {/* Layout Utama Grid 75% 25% */}
        <div className="w-full grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex flex-col max-[1200px]:px-4 mt-8">
          <div>
            <ComicCategoryCard
              label="Trending Teratas"
              data={homeInfo.trending}
              className={"mt-[20px]"}
              path="trending"
              limit={12}
            />
            <ComicCategoryCard
              label="Manga Jepang"
              data={homeInfo.manga}
              className={"mt-[60px]"}
              path="manga"
              limit={12}
            />
            <ComicCategoryCard
              label="Manhwa Korea"
              data={homeInfo.manhwa}
              className={"mt-[60px]"}
              path="manhwa"
              limit={12}
            />
          </div>
          <div className="w-full mt-[20px]">
            <ComicGenre data={homeInfo.genres} />
            <ComicTopten data={homeInfo.topten} className={"mt-12"} />
          </div>
        </div>
      </div>
    </>
  );
}

export default ComicHome;
