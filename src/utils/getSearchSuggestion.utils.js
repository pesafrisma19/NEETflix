import axios from "axios";

const query = `
query ($search: String) {
  Page(page: 1, perPage: 5) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id 
      title { english romaji native } 
      coverImage { extraLarge large }
      format 
      duration 
      startDate { year month day }
    }
  }
}
`;

const getSearchSuggestion = async (keyword) => {
  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { search: keyword }
    });
    
    const media = response.data.data.Page.media;
    
    return media.map(m => {
      let releaseDate = "N/A";
      if (m.startDate?.year) {
          releaseDate = `${m.startDate.year}-${m.startDate.month ? String(m.startDate.month).padStart(2, '0') : '01'}-${m.startDate.day ? String(m.startDate.day).padStart(2, '0') : '01'}`;
      }

      return {
        id: m.id.toString(),
        poster: m.coverImage?.extraLarge || m.coverImage?.large,
        title: m.title.english || m.title.romaji,
        japanese_title: m.title.romaji || m.title.native,
        releaseDate: releaseDate,
        showType: m.format || "TV",
        duration: m.duration ? `${m.duration}m` : "N/A"
      };
    });
  } catch (err) {
    console.error("Error fetching search suggestion:", err);
    return [];
  }
};

export default getSearchSuggestion;
