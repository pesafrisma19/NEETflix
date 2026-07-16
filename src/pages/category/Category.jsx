import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FaWhatsapp, FaLink } from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import getCategoryInfo from "@/src/utils/getCategoryInfo.utils";
import CategoryCard from "@/src/components/categorycard/CategoryCard";
import Genre from "@/src/components/genres/Genre";
import Topten from "@/src/components/topten/Topten";
import Error from "@/src/components/error/Error";
import { useHomeInfo } from "@/src/context/HomeInfoContext";
import PageSlider from "@/src/components/pageslider/PageSlider";
import SidecardLoader from "@/src/components/Loader/Sidecard.loader";
import CategoryCardLoader from "@/src/components/Loader/CategoryCard.loader";

function Category({ path, label }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get("page")) || 1;
  const { homeInfo, homeInfoLoading } = useHomeInfo();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategoryInfo = async () => {
      setLoading(true);
      try {
        const data = await getCategoryInfo(path, page);
        setCategoryInfo(data.data);
        setTotalPages(data.totalPages);
        setLoading(false);
      } catch (err) {
        setError(err);
        console.error("Error fetching category info:", err);
      }
    };
    fetchCategoryInfo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [path, page]);

  if (error) {
    navigate("/error-page");
    return <Error />;
  }
  if (!categoryInfo && !loading) {
    navigate("/404-not-found-page");
    return null;
  }

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
  };

  return (
    <div className="w-full flex flex-col gap-y-4 mt-[64px] max-md:mt-[50px]">
      <div className="w-full flex flex-wrap gap-y-3 gap-x-4 items-center bg-[#191826] p-5 max-[575px]:px-4 max-[575px]:py-4 max-[320px]:hidden">
        <div className="flex items-center gap-x-3">
          <img
            src="https://media1.tenor.com/m/2SgtWqyQZBYAAAAC/like.gif"
            alt="Share Anime"
            className="w-[50px] h-[50px] rounded-full object-cover max-[1024px]:w-[40px] max-[1024px]:h-[40px]"
          />
          <div className="flex flex-col w-fit mr-1">
            <p className="text-[15px] font-bold text-[#FFBADE] leading-tight">Share Anime</p>
            <p className="text-[14px] text-white leading-tight">to your friends</p>
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
            onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Jelajahi rekomendasi anime di NEETflix! Langsung klik: ${window.location.href}`)}`, "_blank")}
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
          ) : page > totalPages ? (
            <p className="font-bold text-2xl text-[#ffbade] max-[478px]:text-[18px] max-[300px]:leading-6">
              You came a long way, go back <br className="max-[300px]:hidden" />
              nothing is here
            </p>
          ) : (
            <>
              {categoryInfo && categoryInfo.length > 0 && (
                <CategoryCard
                  label={label.split("/").pop()}
                  data={categoryInfo}
                  showViewMore={false}
                  className={"mt-0"}
                  categoryPage={true}
                  path={path}
                />
              )}
              <PageSlider
                page={page}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
              />
            </>
          )}
        </div>

        <div className="w-full flex flex-col gap-y-10">
          {homeInfoLoading && !homeInfo ? (
            <SidecardLoader />
          ) : (
            <>
              {homeInfo?.topten && (
                <Topten data={homeInfo.topten} className="mt-0" />
              )}
              {homeInfo?.genres && <Genre data={homeInfo.genres} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Category;
