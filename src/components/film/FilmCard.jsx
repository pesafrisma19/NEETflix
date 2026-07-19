import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faPlay } from '@fortawesome/free-solid-svg-icons';

function FilmCard({ id, title, image, rating, episode, quality }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col transition-transform duration-300 ease-in-out" style={{ height: "fit-content" }}>
      <div 
        className="w-full relative group hover:cursor-pointer rounded-lg overflow-hidden"
        onClick={() => navigate(`/film/${id}`)}
      >
        <div className="overlay absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
            <FontAwesomeIcon icon={faPlay} className="text-white text-3xl" />
        </div>
        <div className="overflow-hidden relative">
          <img 
            src={image || "https://via.placeholder.com/200x300"} 
            alt={title} 
            className="w-full h-[320px] object-cover max-[1200px]:h-[35vw] max-[758px]:h-[45vw] max-[478px]:h-[60vw] group-hover:scale-105 transform transition-all duration-300 ease-in-out ultra-wide:h-[400px]"
            loading="lazy"
          />
          {quality && (
            <div className="absolute top-2 right-2 bg-[#ffbade] text-black text-[10px] font-bold px-2 py-1 rounded-sm z-20">
              {quality}
            </div>
          )}
          {episode && (
            <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded-sm z-20">
              {episode}
            </div>
          )}
        </div>
      </div>
      <Link 
        to={`/film/${id}`}
        className="text-white font-semibold mt-2 item-title hover:text-[#FFBADE] hover:cursor-pointer line-clamp-1"
      >
        {title}
      </Link>
      
      <div className="flex items-center gap-x-2 w-full overflow-hidden mt-1">
        <div className="text-gray-400 text-[12px] text-nowrap overflow-hidden text-ellipsis flex items-center gap-x-1">
          <FontAwesomeIcon icon={faStar} className="text-[#FFD700] text-[11px]" />
          <span className="font-semibold text-white">{rating || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}

export default FilmCard;
