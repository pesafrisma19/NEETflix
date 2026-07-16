import axios from "axios";

const query = `
query ($page: Int, $sort: [MediaSort], $status: MediaStatus, $format: MediaFormat, $genre: String) {
  Page(page: $page, perPage: 24) {
    pageInfo {
      lastPage
    }
    media(sort: $sort, status: $status, format: $format, genre: $genre, type: ANIME, isAdult: false) {
      id title { english romaji native } coverImage { extraLarge large } description
      format status episodes duration startDate { year month day } isAdult averageScore
    }
  }
}
`;

function formatCard(m) {
  if (!m) return null;
  return {
    id: m.id.toString(),
    title: m.title.english || m.title.romaji,
    japanese_title: m.title.romaji || m.title.native,
    poster: m.coverImage?.extraLarge || m.coverImage?.large,
    description: m.description ? m.description.replace(/<[^>]*>?/gm, '') : "",
    tvInfo: {
      showType: m.format || "TV",
      duration: m.duration ? `${m.duration}m` : "?",
      rating: m.isAdult ? "18+" : "PG-13",
      eps: m.episodes || "?",
      sub: m.episodes || "?",
      dub: null
    }
  };
}

const getCategoryInfo = async (path, page) => {
  if (!page) page = 1;
  let sort = ["POPULARITY_DESC"];
  let status = undefined;
  let format = undefined;
  let genre = undefined;

  // Route path to AniList variables mapping
  if (path.startsWith("genre/")) {
    const rawGenre = path.split("/")[1];
    if (rawGenre === "sci-fi") {
      genre = "Sci-Fi";
    } else if (rawGenre === "slice-of-life") {
      genre = "Slice of Life";
    } else {
      genre = rawGenre.replace("-", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  } else {
    switch (path) {
      case "most-popular": sort = ["POPULARITY_DESC"]; break;
      case "top-airing": sort = ["SCORE_DESC"]; status = "RELEASING"; break;
      case "most-favorite": sort = ["FAVOURITES_DESC"]; break;
      case "completed": sort = ["POPULARITY_DESC"]; status = "FINISHED"; break;
      case "recently-updated": sort = ["UPDATED_AT_DESC"]; break;
      case "recently-added": sort = ["ID_DESC"]; break;
      case "top-upcoming": sort = ["POPULARITY_DESC"]; status = "NOT_YET_RELEASED"; break;
      case "movie": format = "MOVIE"; break;
      case "special": format = "SPECIAL"; break;
      case "ova": format = "OVA"; break;
      case "ona": format = "ONA"; break;
      case "tv": format = "TV"; break;
      default: break;
    }
  }

  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { page: parseInt(page, 10), sort, status, format, genre }
    });

    const pageData = response.data.data.Page;
    return {
      data: pageData.media.map(formatCard).filter(Boolean),
      totalPages: pageData.pageInfo.lastPage
    };
  } catch (err) {
    console.error("Error fetching category info:", err);
    return { data: [], totalPages: 1 };
  }
};

export default getCategoryInfo;
