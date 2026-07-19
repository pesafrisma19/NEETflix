import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faStar } from "@fortawesome/free-solid-svg-icons";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../banner/Banner.css";

function FilmBanner({ item, index }) {
  return (
    <section className="spotlight w-full h-full">
      <img
        src={`${item.image}`}
        alt={item.title}
        className="absolute right-0 object-cover h-full w-[80%] bg-auto max-[1200px]:w-full max-[1200px]:bottom-0"
      />
      <div className="spotlight-overlay"></div>
      <div className="absolute flex flex-col left-0 bottom-[50px] w-[55%] p-4 z-10 max-[1390px]:w-[45%] max-[1390px]:bottom-[10px] max-[1300px]:w-[600px] max-[1120px]:w-[60%] max-md:w-[90%] max-[300px]:w-full">
        <p className="text-[#ffbade] font-semibold text-[20px] w-fit max-[1300px]:text-[15px]">
          #{index + 1} Spotlight
        </p>
        <h3 className="text-white line-clamp-2 text-5xl font-bold mt-6 text-left max-[1390px]:text-[45px] max-[1300px]:text-3xl max-[1300px]:mt-4 max-md:text-2xl max-md:mt-1 max-[575px]:text-[22px] max-sm:leading-6 max-sm:w-[80%] max-[320px]:w-full ">
          {item.title}
        </h3>
        <div className="flex h-fit justify-center items-center w-fit space-x-5 mt-8 max-[1300px]:mt-6 max-md:hidden">
            <div className="flex space-x-1 justify-center items-center">
              <FontAwesomeIcon
                icon={faStar}
                className="text-[#FFD700] text-[14px]"
              />
              <p className="text-white text-[16px]">
                {item.rating || "N/A"}
              </p>
            </div>
            {item.episode && (
                <div className="bg-[#B9E7FF] py-[1px] px-[6px] rounded-md w-fit text-[11px] font-bold text-black h-fit">
                    {item.episode}
                </div>
            )}
        </div>
        <p className="text-white text-[17px] font-sm mt-6 text-left line-clamp-3 max-[1200px]:line-clamp-2 max-[1300px]:w-[500px] max-[1120px]:w-[90%] max-md:hidden">
          Nonton {item.title} selengkapnya.
        </p>
        <div className="flex gap-x-5 mt-10 max-md:mt-6 max-sm:w-full max-[320px]:flex-col max-[320px]:space-y-3">
          <button className="flex justify-center items-center bg-[#ffbade] px-4 py-2 rounded-3xl gap-x-2 max-[320px]:w-fit ">
            <FontAwesomeIcon
              icon={faPlay}
              className="text-[8px] bg-[#000000] px-[6px] py-[6px] rounded-full text-[#ffbade] max-[320px]:text-[6px]"
            />
            <Link
              to={`/film/watch/${item.id}`}
              className="max-[1000px]:text-[15px] font-semibold text-black max-[320px]:text-[12px]"
            >
              Watch Now
            </Link>
          </button>
          <Link
            to={`/film/${item.id}`}
            className="flex bg-[#3B3A52] justify-center items-center px-4 py-2 rounded-3xl gap-x-2 max-[320px]:w-fit max-[320px]:px-3"
          >
            <p className="text-white max-[1000px]:text-[15px] font-semibold max-[320px]:text-[12px]">
              Detail
            </p>
            <FaChevronRight className="text-white max-[320px]:text-[10px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FilmBanner;
