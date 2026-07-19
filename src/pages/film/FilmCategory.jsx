import React, { useEffect, useState } from "react";
import { FaWhatsapp, FaLink } from "react-icons/fa";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import FilmCard from "@/src/components/film/FilmCard";
import Error from "@/src/components/error/Error";
import PageSlider from "@/src/components/pageslider/PageSlider";
import CategoryCardLoader from "@/src/components/Loader/CategoryCard.loader";
import axios from "axios";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function FilmCategory() {
  const { type } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  
  const page = parseInt(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategoryInfo = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${NEETFLIXAPI}/api/lk21/category/${type}?page=${page}`);
        if (res.data?.success) {
          const data = res.data.results;
          setCategoryInfo(data.data || []);
          
          if (data.hasNextPage) {
            setTotalPages(Math.max(page + 1, totalPages));
          } else {
            setTotalPages(page);
          }
        } else {
          throw new Error("Gagal mengambil data kategori film");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching film category info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryInfo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [type, page]);

  if (error) {
    return <Error error={error} />;
  }
  if (!categoryInfo && !loading) {
    return <Error error="Data tidak ditemukan" />;
  }

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
  };

  const formattedLabel = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  return (
    <div className="w-full min-h-screen flex flex-col gap-y-4 mt-[64px] max-md:mt-[50px] text-white">
      <div className="w-full flex flex-wrap gap-y-3 gap-x-4 items-center bg-[#191826] p-5 max-[575px]:px-4 max-[575px]:py-4 max-[320px]:hidden">
        <div className="flex items-center gap-x-3">
          <img
            src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
            alt="Share Film"
            className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
          />
          <div className="flex flex-col w-fit mr-1">
            <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">Share Kategori Ini</p>
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
            onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Jelajahi rekomendasi film terbaik di NEETflix! Langsung klik: ${window.location.href}`)}`, "_blank")}
            className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg flex gap-x-1.5 items-center text-[12px] font-semibold hover:bg-[#128C7E] transition-all shadow-md"
          >
            <FaWhatsapp className="text-[14px]" /> WA
          </button>
        </div>
      </div>

      <div className="w-full px-4 mb-20 flex flex-col items-center">
          {loading ? (
            <CategoryCardLoader className="mt-5 w-full" />
          ) : page > totalPages ? (
            <div className="w-full text-center mt-20">
                <p className="font-bold text-2xl text-[#ffbade] max-[478px]:text-[18px] max-[300px]:leading-6">
                You came a long way, go back <br className="max-[300px]:hidden" />
                nothing is here
                </p>
            </div>
          ) : (
            <div className="w-full max-w-screen-2xl">
              {categoryInfo && categoryInfo.length > 0 && (
                <div className="mt-4 w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="font-bold text-2xl text-[#ffbade] max-[478px]:text-[18px] capitalize flex items-center gap-x-2">
                            <div className="h-6 w-1 bg-[#ffbade] rounded-full"></div>
                            {formattedLabel}
                        </h1>
                    </div>
                    <div className="grid grid-cols-6 max-[1200px]:grid-cols-5 max-[990px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-2 gap-x-4 gap-y-8">
                        {categoryInfo.map((item) => (
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
              )}
            </div>
          )}

          {categoryInfo && categoryInfo.length > 0 && totalPages > 1 && (
            <div className="w-full mt-10">
              <PageSlider
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
      </div>
    </div>
  );
}

export default FilmCategory;
