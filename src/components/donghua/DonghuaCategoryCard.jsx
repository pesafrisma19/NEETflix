import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

function DonghuaCategoryCard({ label, data = [], path, limit = null, showViewMore = true, className = "" }) {
  const displayData = limit ? data.slice(0, limit) : data;

  return (
    <div className={`flex flex-col gap-y-7 ${className}`}>
      <div className="flex justify-between items-end">
        <h1 className="w-fit text-2xl text-[#ffbade] max-[478px]:text-[18px] font-bold">
          {label}
        </h1>
        {showViewMore && path && (
          <Link
            to={`/${path}`}
            className="text-[13px] text-gray-400 hover:text-[#ffbade] transition-colors"
          >
            View More
          </Link>
        )}
      </div>

      {displayData.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 max-[1200px]:grid-cols-4 max-[880px]:grid-cols-3 max-[575px]:grid-cols-2 max-[320px]:grid-cols-1">
          {displayData.map((item, index) => (
            <Link
              to={`/donghua/${item.id}`}
              key={index}
              className="relative w-full aspect-[2/3] rounded-lg overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                <FontAwesomeIcon icon={faPlay} className="text-white text-3xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
              </div>
              <div className="absolute top-2 left-2 z-30 bg-[#ffbade] text-black px-2 py-0.5 rounded text-[11px] font-bold shadow-md">
                {item.releaseDate || 'Ongoing'}
              </div>
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 w-full p-2 z-30">
                <p className="text-white text-[13px] font-bold line-clamp-2 group-hover:text-[#ffbade] transition-colors drop-shadow-md">
                  {item.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No donghua available.</p>
      )}
    </div>
  );
}

export default DonghuaCategoryCard;
