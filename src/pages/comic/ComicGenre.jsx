import React, { useEffect, useState } from "react";
import { FaWhatsapp, FaLink } from "react-icons/fa";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import ComicCategoryCard from "@/src/components/comic/ComicCategoryCard/CategoryCard";
import ComicGenreComponent from "@/src/components/comic/ComicGenre/Genre";
import ComicTopten from "@/src/components/comic/ComicTopten/Topten";
import Error from "@/src/components/error/Error";
import PageSlider from "@/src/components/pageslider/PageSlider";
import SidecardLoader from "@/src/components/Loader/Sidecard.loader";
import CategoryCardLoader from "@/src/components/Loader/CategoryCard.loader";

function ComicGenre() {
  const { genre } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [homeInfo, setHomeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeLoading, setHomeLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  
  const page = parseInt(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeInfo = async () => {
      try {
        setHomeLoading(true);
        const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/home`);
        if (res.ok) {
          const response = await res.json();
          setHomeInfo(response.results || response.data || response);
        }
      } catch (err) {
        console.error("Gagal load sidebar komik", err);
      } finally {
        setHomeLoading(false);
      }
    };
    fetchHomeInfo();
  }, []);

  useEffect(() => {
    const fetchCategoryInfo = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/genre/${genre}?page=${page}`);
        if (!res.ok) throw new Error("Gagal mengambil komik berdasarkan genre");
        const response = await res.json();
        const data = response.results || response.data || response;
        setCategoryInfo(data.results || data.data || data || []);
        
        if (data.hasNextPage) {
          setTotalPages(Math.max(page + 1, totalPages));
        } else {
          setTotalPages(page);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryInfo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [genre, page]);

  if (error) {
    return <Error error={error} />;
  }
  if (!categoryInfo && !loading) {
    return <Error error="Data tidak ditemukan" />;
  }

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
  };

  const formattedLabel = "Genre: " + genre.charAt(0).toUpperCase() + genre.slice(1).replace("-", " ");

  return (
    <div className="w-full flex flex-col gap-y-4 mt-[64px] max-md:mt-[50px] text-white">
      <div className="w-full flex flex-wrap gap-y-3 gap-x-4 items-center bg-[#191826] p-5 max-[575px]:px-4 max-[575px]:py-4 max-[320px]:hidden">
        <div className="flex items-center gap-x-3">
          <img
            src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
            alt="Share Genre Comic"
            className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
          />
          <div className="flex flex-col w-fit mr-1">
            <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">Share Genre Ini</p>
            <p className="text-[14px] text-white leading-tight">ke teman-temanmu</p>
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
            onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Cek rekomendasi komik genre ${genre} di sini: ${window.location.href}`)}`, "_blank")}
            className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg flex gap-x-1.5 items-center text-[12px] font-semibold hover:bg-[#128C7E] transition-all shadow-md"
          >
            <FaWhatsapp className="text-[14px]" /> WA
          </button>
        </div>
      </div>

      <div className="w-full px-4 grid grid-cols-[minmax(0,75%),minmax(0,25%)] gap-x-6 max-[1200px]:flex max-[1200px]:flex-col max-[1200px]:gap-y-10">
        <div>
          {loading ? (
            <CategoryCardLoader className="mt-5" />
          ) : categoryInfo.length === 0 ? (
            <p className="font-bold text-2xl text-[#ffbade] max-[478px]:text-[18px] max-[300px]:leading-6 mt-6">
              Tidak ada komik untuk genre ini. <br className="max-[300px]:hidden" />
            </p>
          ) : (
            <>
              <ComicCategoryCard
                label={formattedLabel}
                data={categoryInfo}
                showViewMore={false}
                className={"mt-0"}
                categoryPage={true}
                path={genre}
              />
              <div className="mt-12">
                <PageSlider
                  page={page}
                  totalPages={totalPages}
                  handlePageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>

        <div className="w-full flex flex-col gap-y-10">
          {homeLoading && !homeInfo ? (
            <SidecardLoader />
          ) : (
            <>
              {homeInfo?.topten && (
                <ComicTopten data={homeInfo.topten} className="mt-0" />
              )}
              {homeInfo?.genres && <ComicGenreComponent data={homeInfo.genres} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComicGenre;
