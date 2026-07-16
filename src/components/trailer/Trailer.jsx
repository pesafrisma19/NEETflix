import React from "react";

function Trailer({ trailer }) {
  if (!trailer || !trailer.id) return null;

  // We only support youtube trailers for now
  if (trailer.site !== "youtube") return null;

  return (
    <div className="flex flex-col gap-y-5 mt-8 w-full max-w-[800px] pl-4 max-md:pl-4">
      <h1 className="w-fit text-2xl text-[#ffbade] max-[478px]:text-[18px] font-bold">
        Trailer Anime
      </h1>
      <div className="relative w-full overflow-hidden pt-[56.25%] rounded-xl shadow-lg border border-[#4c4b57c3] pr-4">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${trailer.id}`}
          title="Anime Trailer"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}

export default Trailer;
