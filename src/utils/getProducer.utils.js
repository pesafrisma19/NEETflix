import axios from "axios";

const query = `
query ($producer: String, $page: Int) {
  Studio(search: $producer) {
    id
    name
    media(page: $page, sort: POPULARITY_DESC, isMain: true) {
      pageInfo {
        lastPage
      }
      nodes {
        id title { english romaji native } coverImage { extraLarge large } description
        format status episodes duration startDate { year month day } isAdult averageScore
      }
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

const getProducer = async (producer, page) => {
  if (!page) page = 1;
  // Ubah format id "toei-animation" menjadi "toei animation" agar AniList bisa mencarinya
  const searchName = producer.replace(/-/g, " ");

  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { producer: searchName, page: parseInt(page, 10) }
    });

    const studio = response.data?.data?.Studio;
    if (!studio || !studio.media) {
       return { data: [], totalPages: 1 };
    }
    
    return {
      data: studio.media.nodes.map(formatCard).filter(Boolean),
      totalPages: studio.media.pageInfo.lastPage
    };
  } catch (err) {
    console.error("Error fetching producer info from AniList:", err);
    return { data: [], totalPages: 1 };
  }
};

export default getProducer;
