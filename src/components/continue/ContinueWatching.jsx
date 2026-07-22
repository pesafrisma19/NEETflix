import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { FaHistory, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/src/context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/src/lib/supabaseClient";

const ContinueWatching = ({ mediaType = 'anime' }) => {
  const [watchList, setWatchList] = useState([]);
  const { language } = useLanguage();
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchWatchList = async () => {
      try {
        let localData = JSON.parse(localStorage.getItem("continueWatching") || "[]");
        localData.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: dbHistory } = await supabase
            .from('watch_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('watched_at', { ascending: false })
            .limit(20);
            
          if (dbHistory && dbHistory.length > 0) {
            let mappedDb = dbHistory.map(item => ({
              id: item.anime_id,
              episodeId: item.episode_id,
              episodeNum: String(item.episode_id).replace('ep=', '').replace('chapter-', ''),
              poster: item.details?.poster,
              title: item.details?.title,
              leftAt: item.left_at,
              mediaType: item.details?.mediaType || 'anime',
              updatedAt: new Date(item.watched_at).getTime()
            }));

            if (mediaType && mediaType !== 'all') {
              mappedDb = mappedDb.filter(item => (item.mediaType || 'anime') === mediaType);
            }
            setWatchList(mappedDb);
            return;
          }
        }
        
        let filteredLocal = localData;
        if (mediaType && mediaType !== 'all') {
          filteredLocal = localData.filter(item => (item.mediaType || 'anime') === mediaType);
        }
        setWatchList(filteredLocal);
      } catch (err) {
        console.error("Error fetching watch history", err);
      }
    };

    fetchWatchList();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchWatchList();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [mediaType]);

  // Memoize watchList to avoid unnecessary re-renders
  const memoizedWatchList = useMemo(() => watchList, [watchList]);

  const removeFromWatchList = async (episodeId, animeId) => {
    setWatchList((prevList) => {
      const updatedList = prevList.filter(
        (item) => item.id !== animeId
      );
      localStorage.setItem("continueWatching", JSON.stringify(updatedList));
      return updatedList;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && animeId) {
        await supabase
          .from('watch_history')
          .delete()
          .eq('user_id', session.user.id)
          .eq('anime_id', animeId);
      }
    } catch (err) {}
  };

  const getTargetUrl = (item) => {
    const type = item.mediaType || 'anime';
    if (type === 'comic') {
      return `/comic/read/${item.episodeId || item.id}`;
    }
    if (type === 'film') {
      return item.episodeId && item.episodeId !== item.id
        ? `/film/watch/${item.id}?epId=${encodeURIComponent(item.episodeId)}`
        : `/film/watch/${item.id}`;
    }
    if (type === 'donghua') {
      return item.episodeId
        ? `/donghua/watch/${item.id}?ep=${encodeURIComponent(item.episodeId)}`
        : `/donghua/watch/${item.id}`;
    }
    return `/watch/${item.id}?ep=${item.episodeId}`;
  };

  const getDisplayTitle = (item) => {
    if (!item) return '';
    const type = item.mediaType || 'anime';
    if (type === 'comic') {
      if (!item.title || item.title.toLowerCase().startsWith('chapter') || item.title.includes('__')) {
        if (item.id) {
          const cleanId = String(item.id)
            .replace(/^chapter-/, '')
            .replace(/__\d+$/, '')
            .replace(/-/g, ' ');
          return cleanId.replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    }
    return item.title || '';
  };

  const getEpisodeLabel = (item) => {
    const type = item.mediaType || 'anime';
    const epNum = item.episodeNum || item.episodeId || '';
    if (type === 'comic') {
      const numMatch = String(epNum).match(/(?:chapter[-_]|__|\s|^)(\d+)(?:[^\d]|$)/i);
      const cleanNum = numMatch ? numMatch[1] : String(epNum).replace(/^chapter-/, '');
      return `Chapter ${cleanNum}`;
    }
    if (type === 'film') {
      if (!item.episodeId || item.episodeId === item.id) return 'Movie';
      const numMatch = String(epNum).match(/(?:episode[-_]|ep[-_]|\s|^)(\d+)(?:[^\d]|$)/i);
      const cleanNum = numMatch ? numMatch[1] : epNum;
      return `Episode ${cleanNum}`;
    }
    const numMatch = String(epNum).match(/(?:episode[-_]|ep[-_]|\s|^)(\d+)(?:[^\d]|$)/i);
    const cleanNum = numMatch ? numMatch[1] : epNum;
    return `Episode ${cleanNum}`;
  };

  if (memoizedWatchList.length === 0) return null;

  const sectionTitle = mediaType === 'comic' ? 'Continue Reading' : 'Continue Watching';

  return (
    <div className="mt-6 max-[1200px]:px-6 max-md:px-0">
      <div className="flex items-center justify-between max-md:pl-4">
        <div className="flex items-center gap-x-2 justify-center">
          <FaHistory className="text-[#ffbade]" />
          <h1 className="text-[#ffbade] text-2xl font-bold max-[450px]:text-xl max-[450px]:mb-1 max-[350px]:text-lg">
            {sectionTitle}
          </h1>
        </div>

        <div className="flex gap-x-2 pr-2 max-[350px]:hidden">
          <button className="btn-prev bg-gray-700 text-white p-3 rounded-full hover:bg-gray-500 transition max-[768px]:p-2">
            <FaChevronLeft className="text-xs" />
          </button>
          <button className="btn-next bg-gray-700 text-white p-3 rounded-full hover:bg-gray-500 transition max-[768px]:p-2">
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto overflow-hidden z-[1] mt-6 max-[450px]:mt-3">
        <Swiper
          ref={swiperRef}
          className="w-full h-full"
          slidesPerView={3}
          spaceBetween={15}
          breakpoints={{
            640: { slidesPerView: 4, spaceBetween: 15 },
            768: { slidesPerView: 4, spaceBetween: 15 },
            1024: { slidesPerView: 5, spaceBetween: 15 },
            1300: { slidesPerView: 6, spaceBetween: 15 },
            1600: { slidesPerView: 7, spaceBetween: 20 },
          }}
          modules={[Navigation]}
          navigation={{
            nextEl: ".btn-next",
            prevEl: ".btn-prev",
          }}
        >
          {memoizedWatchList.map((item, index) => (
            <SwiperSlide
              key={index}
              className="text-center flex justify-center items-center"
            >
              <div className="w-full h-auto pb-[140%] relative inline-block overflow-hidden">
                <button
                  className="absolute top-2 right-2 bg-black text-white px-3 py-2 bg-opacity-60 rounded-full text-sm z-10 font-extrabold hover:bg-white hover:text-black transition-all"
                  onClick={() => removeFromWatchList(item.episodeId, item.id)}
                >
                  ✖
                </button>

                <Link
                  to={getTargetUrl(item)}
                  className="inline-block bg-[#2a2c31] absolute left-0 top-0 w-full h-full group"
                >
                  <img
                    src={item?.poster && !item.poster.startsWith('/api/image-proxy') ? item.poster : "https://via.placeholder.com/200x300?text=Komik"}
                    alt={getDisplayTitle(item)}
                    referrerPolicy="no-referrer"
                    className="block w-full h-full object-cover transition-all duration-300 ease-in-out group-hover:blur-[4px]"
                    title={getDisplayTitle(item)}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200x300?text=Komik";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FontAwesomeIcon
                      icon={faPlay}
                      className="text-[50px] text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] max-[450px]:text-[36px]"
                    />
                  </div>
                </Link>
                {item?.adultContent === true && (
                  <div className="text-white px-2 rounded-md bg-[#FF5700] absolute top-2 left-2 flex items-center justify-center text-[14px] font-bold">
                    18+
                  </div>
                )}
                <div className="absolute bottom-0 left-0 flex flex-col gap-y-2 right-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent max-[450px]:gap-y-1">
                  <p className="text-white text-md font-bold text-left truncate max-[450px]:text-sm">
                    {language === "EN"
                      ? getDisplayTitle(item)
                      : item?.japanese_title || getDisplayTitle(item)}
                  </p>
                  <p className="text-gray-300 text-sm font-semibold text-left max-[450px]:text-[12px]">
                    {getEpisodeLabel(item)}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ContinueWatching;
