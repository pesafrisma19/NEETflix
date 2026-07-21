import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

function DonghuaTrending({ trending = [] }) {
  if (!trending || trending.length === 0) return null;
  const displayData = trending.slice(0, 10); // Display top 10

  return (
    <div className="w-full mt-[60px] pb-10 max-[1200px]:px-4">
      <h1 className="w-fit text-2xl text-[#ffbade] max-[478px]:text-[18px] font-bold mb-6">
        Trending Donghua
      </h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 max-[1200px]:grid-cols-4 max-[880px]:grid-cols-3 max-[575px]:grid-cols-2 max-[320px]:grid-cols-1">
        {displayData.map((item, index) => (
          <Link
            to={`/donghua/${item.id}`}
            key={index}
            className="relative w-full aspect-[2/3] rounded-lg overflow-hidden group cursor-pointer border border-[#2a293d] hover:border-[#ffbade] transition-colors"
          >
            <div className="absolute top-0 right-0 z-30 bg-[#ffbade] text-black w-8 h-8 flex items-center justify-center rounded-bl-lg font-bold">
              #{index + 1}
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="text-white text-3xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 w-full p-3 z-30 flex flex-col gap-y-1">
              <p className="text-white text-[14px] font-bold line-clamp-2 group-hover:text-[#ffbade] transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-x-2 text-[11px] text-gray-300">
                <span className="bg-[#2A2A38] px-1.5 py-0.5 rounded">{item.releaseDate || 'Ongoing'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DonghuaTrending;
