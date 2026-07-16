import React, { useState, useEffect } from "react";
import { Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function Soundtrack({ anilistId }) {
  const [themes, setThemes] = useState({ op: [], ed: [] });
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState(null);

  useEffect(() => {
    if (!anilistId) return;
    const fetchSoundtracks = async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}&include=animethemes.animethemeentries.videos.audio,animethemes.song.artists`);
        const data = await res.json();

        if (data && data.anime && data.anime.length > 0) {
          const allThemes = data.anime[0].animethemes || [];

          const op = allThemes.filter(t => t.type === "OP");
          const ed = allThemes.filter(t => t.type === "ED");

          setThemes({ op, ed });
        }
      } catch (err) {
        console.error("Error fetching soundtracks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSoundtracks();
  }, [anilistId]);

  if (loading) {
    return (
      <div className="flex flex-col mt-8 w-full px-0 max-[1200px]:px-4 max-md:px-0">
        <div className="w-[150px] h-[30px] bg-[#2A2A38] rounded-md animate-pulse mb-5 pl-4 max-md:pl-4"></div>
        <div className="flex gap-4 overflow-hidden px-4">
          <div className="w-[300px] h-[150px] bg-[#2A2A38] rounded-xl animate-pulse"></div>
          <div className="w-[300px] h-[150px] bg-[#2A2A38] rounded-xl animate-pulse hidden sm:block"></div>
          <div className="w-[300px] h-[150px] bg-[#2A2A38] rounded-xl animate-pulse hidden md:block"></div>
        </div>
      </div>
    );
  }

  if (themes.op.length === 0 && themes.ed.length === 0) return null;

  const renderThemeCard = (theme) => {
    const entry = theme.animethemeentries?.[0];
    const video = entry?.videos?.[0];
    if (!video) return null;

    const audioUrl = video.audio?.link || video.link; // fallback to webm if ogg not available
    const videoUrl = video.link;
    const songTitle = theme.song?.title || theme.slug;
    const artistName = theme.song?.artists?.[0]?.name || theme.slug;

    const isExpanded = expandedVideo === theme.id;

    return (
      <SwiperSlide key={theme.id} className="h-auto">
        <div className="flex flex-col bg-[#2A2A38] rounded-xl p-4 gap-y-3 w-full h-full">
          <div className="flex justify-between items-start">
            <div className="flex flex-col pr-2">
              <p className="text-[15px] font-bold text-white line-clamp-1">{songTitle}</p>
              <p className="text-[12px] text-gray-400 line-clamp-1">{artistName}</p>
            </div>
            <button
              onClick={() => setExpandedVideo(isExpanded ? null : theme.id)}
              className="text-[12px] bg-[#191826] text-white px-3 py-1 rounded-md hover:bg-[#ffbade] hover:text-[#191826] transition-all whitespace-nowrap flex-shrink-0"
            >
              {isExpanded ? "Tutup Video ▲" : "Buka Video ▼"}
            </button>
          </div>

          <audio controls src={audioUrl} className="w-full h-[40px] mt-auto" preload="none"></audio>

          {isExpanded && (
            <div className="w-full mt-1 rounded-lg overflow-hidden border border-[#191826] bg-black">
              <video controls autoPlay src={videoUrl} className="w-full"></video>
            </div>
          )}
        </div>
      </SwiperSlide>
    );
  };

  const renderCarousel = (title, items, type) => {
    const nextClass = `btn-next-${type}`;
    const prevClass = `btn-prev-${type}`;
    const paginationClass = `pagination-${type}`;

    return (
      <div className="flex flex-col w-full relative">
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>

          {items.length > 1 && (
            <div className="flex items-center gap-2 bg-[#2A2A38] rounded-full px-3 py-1">
              <div className={`${prevClass} text-[14px] text-gray-300 hover:text-[#ffbade] cursor-pointer transition-colors p-1`}>
                <FaChevronLeft />
              </div>
              <div className={`${paginationClass} text-[13px] text-white font-semibold min-w-[30px] text-center`}></div>
              <div className={`${nextClass} text-[14px] text-gray-300 hover:text-[#ffbade] cursor-pointer transition-colors p-1`}>
                <FaChevronRight />
              </div>
            </div>
          )}
        </div>

        <div className="relative mx-auto overflow-hidden z-[1] w-full px-4">
          <Swiper
            className="w-full h-full"
            slidesPerView={1}
            spaceBetween={15}
            modules={[Pagination, Navigation]}
            pagination={{
              el: `.${paginationClass}`,
              type: "fraction",
            }}
            navigation={{
              nextEl: `.${nextClass}`,
              prevEl: `.${prevClass}`,
            }}
          >
            {items.map(renderThemeCard)}
          </Swiper>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col mt-8 w-full max-w-full overflow-visible px-0 max-[1200px]:px-4 max-md:px-0">
      <h1 className="w-fit text-2xl text-[#ffbade] max-[478px]:text-[18px] font-bold mb-5 pl-4 max-md:pl-4">
        Soundtrack
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {themes.op.length > 0 && renderCarousel("Opening Themes", themes.op, "op")}
        {themes.ed.length > 0 && renderCarousel("Ending Themes", themes.ed, "ed")}
      </div>
    </div>
  );
}

export default Soundtrack;
