import axios from "axios";

const query = `
query ($start: Int, $end: Int) {
  Page(page: 1, perPage: 50) {
    airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
      episode
      airingAt
      media {
        id
        title { english romaji }
      }
    }
  }
}
`;

export default async function getSchedInfo(date) {
  try {
    // date is in "YYYY-MM-DD" format
    // Convert to start and end of that date in Unix timestamp (seconds)
    const dateObj = new Date(date);
    // Use local time start of day
    dateObj.setHours(0, 0, 0, 0);
    const start = Math.floor(dateObj.getTime() / 1000);
    
    dateObj.setHours(23, 59, 59, 999);
    const end = Math.floor(dateObj.getTime() / 1000);

    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { start, end }
    });

    const schedules = response.data.data.Page.airingSchedules;
    
    return schedules.map(s => {
      const airingDate = new Date(s.airingAt * 1000);
      const hours = String(airingDate.getHours()).padStart(2, '0');
      const minutes = String(airingDate.getMinutes()).padStart(2, '0');
      
      return {
        id: s.media.id.toString(),
        time: `${hours}:${minutes}`,
        title: s.media.title.english || s.media.title.romaji,
        episode_no: s.episode
      };
    });

  } catch (error) {
    console.error("Error fetching schedule info:", error);
    return [];
  }
}
