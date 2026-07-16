import axios from "axios";

const getNextEpisodeSchedule = async (id) => {
  try {
    const aniId = parseInt(id, 10);
    if (isNaN(aniId)) return null;

    const response = await axios.post("https://graphql.anilist.co", {
      query: `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            nextAiringEpisode {
              airingAt
              timeUntilAiring
              episode
            }
          }
        }
      `,
      variables: { id: aniId }
    });

    const nextEp = response.data?.data?.Media?.nextAiringEpisode;
    if (!nextEp) return null;

    return {
      episode: nextEp.episode,
      airingTime: nextEp.airingAt,
      timeUntilAiring: nextEp.timeUntilAiring
    };
  } catch (err) {
    console.error("Error fetching next episode schedule:", err);
    return null;
  }
};

export default getNextEpisodeSchedule;
