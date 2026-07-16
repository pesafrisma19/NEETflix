import axios from "axios";

const query = `
query ($search: String, $page: Int) {
  Page(page: $page, perPage: 24) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id title { english romaji native } coverImage { extraLarge large }
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

const getSearch = async (keyword, page) => {
  if (!page) page = 1;
  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { search: keyword, page: parseInt(page, 10) }
    });

    const pageData = response.data.data.Page;
    
    return {
      data: pageData.media.map(formatCard).filter(Boolean),
      totalPage: pageData.pageInfo.lastPage
    };
  } catch (err) {
    console.error("Error fetching search result:", err);
    return { data: [], totalPage: 1 };
  }
};

export default getSearch;
