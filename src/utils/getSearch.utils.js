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

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

const getSearch = async (keyword, page) => {
  if (!page) page = 1;
  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { search: keyword, page: parseInt(page, 10) }
    });

    const pageData = response.data.data.Page;
    const anilistResults = pageData.media.map(formatCard).filter(Boolean);

    // Jika AniList punya hasil → kembalikan langsung
    if (anilistResults.length > 0) {
      return {
        data: anilistResults,
        totalPage: pageData.pageInfo.lastPage
      };
    }

    // Jika AniList kosong → fallback ke AnimeLovers (untuk konten tidak ada di AniList)
    console.log(`[Search] AniList kosong untuk "${keyword}", mencoba AnimeLovers...`);
    const alRes = await axios.get(`${NEETFLIXAPI}/api/animelovers/search?q=${encodeURIComponent(keyword)}&page=${page}`);
    const alItems = alRes.data?.results || alRes.data || [];

    return {
      data: alItems.map(item => ({
        id: `AL-${item.id}`,
        title: item.title,
        japanese_title: item.title,
        poster: (item.image || "").replace(/https:\/\/i\d+\.wp\.com\//, "https://"),
        tvInfo: {
          showType: item.type || "TV",
          duration: "?",
          rating: "PG-13",
          eps: item.total_episode || "?",
          sub: item.total_episode || "?",
          dub: null
        }
      })),
      totalPage: 1
    };
  } catch (err) {
    console.error("Error fetching search result:", err);
    return { data: [], totalPage: 1 };
  }
};

export default getSearch;
