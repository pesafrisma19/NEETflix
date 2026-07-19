import formatSlug from "@/src/utils/formatSlug";
import getSearchSuggestion from "@/src/utils/getSearchSuggestion.utils";
import { useEffect, useState } from "react";
import BouncingLoader from "../ui/bouncingloader/Bouncingloader";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function Suggestion({ keyword, className, type = "anime" }) {
  const [suggestion, setSuggestion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchSearchSuggestion = async () => {
      if (!keyword) return;
      setLoading(true);
      setHasFetched(false);
      try {
        let data = [];
        if (type === "anime") {
          data = await getSearchSuggestion(keyword);
        } else if (type === "film") {
          const res = await axios.get(`${NEETFLIXAPI}/api/lk21/search?q=${encodeURIComponent(keyword)}`);
          if (res.data?.success && res.data?.results?.data) {
             data = res.data.results.data.slice(0, 5).map(m => ({
               id: m.id,
               poster: m.image,
               title: m.title,
               releaseDate: m.rating ? `⭐ ${m.rating}` : "N/A",
               showType: "Film",
               duration: "N/A"
             }));
          }
        } else if (type === "comic") {
          const res = await axios.get(`${NEETFLIXAPI}/api/komiku/search?q=${encodeURIComponent(keyword)}`);
          if (res.data?.success && res.data?.results) {
             data = res.data.results.slice(0, 5).map(m => ({
               id: m.id,
               poster: m.poster || m.image,
               title: m.title,
               releaseDate: "Manga",
               showType: "Comic",
               duration: "N/A"
             }));
          }
        }
        setSuggestion(data);
        setHasFetched(true);
      } catch (err) {
        console.error("Error fetching search suggestion info:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearchSuggestion();
  }, [keyword, type]);

  const getDetailLink = (item) => {
    if (type === "film") return `/film/${item.id}`;
    if (type === "comic") return `/comic/${item.id}`;
    return `/${formatSlug(item.title, item.id)}`;
  };

  const getViewAllLink = () => {
    if (type === "film") return `/film/search?keyword=${encodeURIComponent(keyword)}`;
    if (type === "comic") return `/comic/search?keyword=${encodeURIComponent(keyword)}`;
    return `/search?keyword=${encodeURIComponent(keyword)}`;
  };

  return (
    <div
      className={`bg-[#2d2b44] ${className} flex ${
        loading ? "justify-center py-7" : "justify-start"
      } ${!suggestion || suggestion.length === 0 ? "p-3" : "justify-start"} items-center`}
      style={{ boxShadow: "0 20px 20px rgba(0, 0, 0, .3)" }}
    >
      {loading ? (
        <BouncingLoader />
      ) : error && (!suggestion || suggestion.length === 0) ? (
        <div>Error loading suggestions</div>
      ) : suggestion && suggestion.length > 0 && hasFetched ? (
        <div className="w-full flex flex-col pt-2 overflow-y-auto">
          {suggestion.map((item, index) => (
            <Link
              to={getDetailLink(item)}
              key={index}
              className="group py-2 flex items-start gap-x-3 hover:bg-[#3c3a5e] cursor-pointer px-[10px]"
              style={{
                borderBottom:
                  index === suggestion.length - 1
                    ? "none"
                    : "1px dashed rgba(255, 255, 255, .075)",
              }}
            >
              <img
                src={`${item.poster}`}
                className="w-[50px] h-[75px] flex-shrink-0 object-cover"
                alt=""
                onError={(e) => {
                  e.target.src = "https://placehold.co/100x100/191826/ffffff?text=N/A";
                }}
              />
              <div className="flex flex-col gap-y-[2px]">
                {item?.title && (
                  <h1 className="line-clamp-1 leading-5 font-bold text-[15px] group-hover:text-[#ffbade]">
                    {item.title || "N/A"}
                  </h1>
                )}
                {item?.japanese_title && (
                  <h1 className="line-clamp-1 leading-5 text-[13px] font-light text-[#aaaaaa]">
                    {item.japanese_title || "N/A"}
                  </h1>
                )}
                {(item?.releaseDate || item?.showType || item?.duration) && (
                  <div className="flex gap-x-[5px] items-center w-full justify-start mt-[4px]">
                    <p className="leading-5 text-[13px] font-light text-[#aaaaaa]">
                      {item.releaseDate || "N/A"}
                    </p>
                    <span className="dot"></span>
                    <p className="leading-5 text-[13px] font-medium group-hover:text-[#ffbade]">
                      {item.showType || "N/A"}
                    </p>
                    {item?.duration !== "N/A" && (
                        <>
                            <span className="dot"></span>
                            <p className="leading-5 text-[13px] font-light text-[#aaaaaa]">
                            {item.duration}
                            </p>
                        </>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {!loading && hasFetched && (
            <Link
              className="w-full flex py-4 justify-center items-center bg-[#ffbade]"
              to={getViewAllLink()}
            >
              <div className="flex w-fit items-center gap-x-2">
                <p className="text-[17px] font-light text-black">
                  View all results
                </p>
                <FaChevronRight className="text-black text-[12px] font-black mt-[2px]" />
              </div>
            </Link>
          )}
        </div>
      ) : hasFetched ? (
        <p className="text-[17px]">No results found!</p>
      ) : null}
    </div>
  );
}

export default Suggestion;
