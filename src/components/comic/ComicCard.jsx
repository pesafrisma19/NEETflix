import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

function ComicCard({ id, title, image, tvInfo }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col transition-transform duration-300 ease-in-out" style={{ height: "fit-content" }}>
      <div 
        className="w-full relative group hover:cursor-pointer"
        onClick={() => navigate(`/comic/${id}`)}
      >
        <div className="overlay"></div>
        <div className="overflow-hidden relative">
          <img 
            src={image || "https://via.placeholder.com/200x300"} 
            alt={title} 
            className="w-full h-[320px] object-cover max-[1200px]:h-[35vw] max-[758px]:h-[45vw] max-[478px]:h-[60vw] group-hover:blur-[7px] transform transition-all duration-300 ease-in-out ultra-wide:h-[400px]"
            loading="lazy"
          />
        </div>
      </div>
      <Link 
        to={`/comic/${id}`}
        className="text-white font-semibold mt-1 item-title hover:text-[#FFBADE] hover:cursor-pointer line-clamp-1"
      >
        {title}
      </Link>
      
      {tvInfo && (
        <div className="flex flex-col mt-1 space-y-1">
          {tvInfo.eps && (
            <div className="flex space-x-1 items-center bg-[#a9a6b16f] rounded-[2px] px-[6px] text-white py-[1px] w-fit">
              <p className="text-[11px] font-extrabold">{tvInfo.eps}</p>
            </div>
          )}
          <div className="flex items-center gap-x-2 w-full overflow-hidden">
            <div className="text-gray-400 text-[12px] text-nowrap overflow-hidden text-ellipsis flex items-center gap-x-1 capitalize">
              {tvInfo?.showType?.toLowerCase() === "manga" ? <span className="px-1 rounded text-[10px] font-bold border border-gray-600">JP</span> : tvInfo?.showType?.toLowerCase() === "manhwa" ? <span className="px-1 rounded text-[10px] font-bold border border-gray-600">KR</span> : tvInfo?.showType?.toLowerCase() === "manhua" ? <span className="px-1 rounded text-[10px] font-bold border border-gray-600">CN</span> : ""} 
              {tvInfo?.showType?.split(" ").shift()}
            </div>
            <div className="dot"></div>
            <div className="text-gray-400 text-[12px] text-nowrap overflow-hidden text-ellipsis flex items-center gap-x-1">
              <FontAwesomeIcon icon={faStar} className="text-[#FFD700] text-[10px]" />
              {tvInfo?.rating || "N/A"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComicCard;
