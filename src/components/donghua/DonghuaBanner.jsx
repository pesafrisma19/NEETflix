import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

function DonghuaBanner({ anime, index, isActive }) {
  if (!anime) return null;

  return (
    <div className={`relative w-full h-[600px] overflow-hidden ${isActive ? "z-10" : "z-0"}`}>
      {/* Background Image */}
      <img
        src={anime.image}
        alt={anime.title}
        className="absolute inset-0 w-full h-full object-cover object-top opacity-70 scale-105"
        style={{ filter: "brightness(0.7) blur(2px)" }}
        loading="lazy"
      />
      
      {/* Gradients for blending */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#191826] via-[#191826]/40 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#191826] via-[#191826]/60 to-transparent"></div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full px-12 pb-16 pt-32 max-[768px]:px-6 max-[768px]:pb-10 z-20 flex flex-col gap-y-4 max-w-4xl">
        <div className="flex items-center gap-x-2 text-[#ffbade] font-bold text-sm">
          <span>#{index + 1} Spotlight</span>
          {anime.releaseDate && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
              <span className="text-white">{anime.releaseDate}</span>
            </>
          )}
        </div>
        
        <h1 className="text-5xl font-extrabold text-white leading-tight drop-shadow-lg max-[768px]:text-3xl line-clamp-2">
          {anime.title}
        </h1>
        
        <div className="flex items-center gap-x-4 mt-4">
          <Link
            to={`/donghua/watch/${anime.id}`}
            className="flex items-center gap-x-2 bg-[#ffbade] text-black px-6 py-2.5 rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg"
          >
            <FontAwesomeIcon icon={faPlayCircle} className="text-xl" />
            Watch Now
          </Link>
          <Link
            to={`/donghua/${anime.id}`}
            className="flex items-center gap-x-2 bg-[#2a293d] text-white px-6 py-2.5 rounded-full font-bold hover:bg-white hover:text-black transition-colors shadow-lg"
          >
            <FontAwesomeIcon icon={faInfoCircle} className="text-xl" />
            Detail
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DonghuaBanner;
