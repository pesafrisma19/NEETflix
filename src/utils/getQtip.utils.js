import axios from "axios";

const query = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    title { english romaji native }
    synonyms
    startDate { year month day }
    status
    genres
    description
    format
    episodes
    isAdult
    averageScore
  }
}
`;

const getQtip = async (id) => {
  try {
    const aniId = parseInt(id, 10);
    if (isNaN(aniId)) return null;

    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { id: aniId }
    });

    const m = response.data.data.Media;
    if (!m) return null;

    let airedDate = "?";
    if (m.startDate?.year) {
      airedDate = `${m.startDate.year}-${m.startDate.month ? String(m.startDate.month).padStart(2, '0') : '01'}-${m.startDate.day ? String(m.startDate.day).padStart(2, '0') : '01'}`;
    }

    return {
      title: m.title.english || m.title.romaji,
      japaneseTitle: m.title.native || "",
      Synonyms: m.synonyms ? m.synonyms.join(", ") : "",
      airedDate: airedDate,
      status: m.status,
      genres: m.genres || [],
      description: m.description ? m.description.replace(/<[^>]*>?/gm, '') : "",
      quality: "HD",
      rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : "?",
      episodeCount: m.episodes || "?",
      type: m.format || "TV",
      watchLink: `/watch/${id}`,
      subCount: null,
      dubCount: null
    };
  } catch (err) {
    console.error("Error fetching qtip info from AniList:", err);
    return null;
  }
};

export default getQtip;
