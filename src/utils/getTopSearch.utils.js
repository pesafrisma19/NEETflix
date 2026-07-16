import axios from "axios";

const query = `
query {
  Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
      id 
      title { english romaji native }
    }
  }
}
`;

const getTopSearch = async () => {
  try {
    const storedData = localStorage.getItem("topSearch");
    if (storedData) {
      const { data, timestamp } = JSON.parse(storedData);
      if (Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000) {
        return data;
      }
    }

    const response = await axios.post("https://graphql.anilist.co", { query });
    const media = response.data.data.Page.media;

    const results = media.map(m => ({
      id: m.id.toString(),
      title: m.title.english || m.title.romaji,
      japanese_title: m.title.romaji || m.title.native
    }));

    if (results.length) {
      localStorage.setItem(
        "topSearch",
        JSON.stringify({ data: results, timestamp: Date.now() })
      );
      return results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching top search data:", error);
    return null;
  }
};

export default getTopSearch;
