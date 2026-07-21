import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css/effect-fade";
import DonghuaBanner from "./DonghuaBanner";

function DonghuaSpotlight({ spotlights = [] }) {
  if (!spotlights || spotlights.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-[#191826]">
        <p className="text-gray-400">Loading spotlight...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative overflow-hidden group mb-8">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          renderBullet: function (index, className) {
            return `<span class="${className} bg-white/50 hover:bg-[#ffbade] transition-colors w-2 h-2 rounded-full mx-1"></span>`;
          },
        }}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        className="w-full h-full"
      >
        {spotlights.map((anime, index) => (
          <SwiperSlide key={anime.id || index}>
            {({ isActive }) => (
              <DonghuaBanner anime={anime} index={index} isActive={isActive} />
            )}
          </SwiperSlide>
        ))}
        
        {/* Custom Navigation Buttons */}
        <div className="swiper-button-prev !text-[#ffbade] opacity-0 group-hover:opacity-100 transition-opacity !left-4 after:!text-2xl font-bold drop-shadow-md"></div>
        <div className="swiper-button-next !text-[#ffbade] opacity-0 group-hover:opacity-100 transition-opacity !right-4 after:!text-2xl font-bold drop-shadow-md"></div>
      </Swiper>
    </div>
  );
}

export default DonghuaSpotlight;
