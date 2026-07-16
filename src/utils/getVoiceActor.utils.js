import axios from "axios";

const query = `
query ($id: Int, $page: Int) {
  Media(id: $id) {
    characters(page: $page, sort: [ROLE, RELEVANCE, ID]) {
      pageInfo {
        lastPage
      }
      edges {
        role
        node {
          name { full }
          image { large }
        }
        voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
          name { full }
          image { large }
        }
      }
    }
  }
}
`;

function formatVoiceActor(edge) {
  if (!edge) return null;
  return {
    character: {
      name: edge.node?.name?.full || "Unknown",
      poster: edge.node?.image?.large || "",
      cast: edge.role || "Supporting"
    },
    voiceActors: edge.voiceActors ? edge.voiceActors.map(va => ({
      name: va.name?.full || "Unknown",
      poster: va.image?.large || ""
    })) : []
  };
}

export default async function fetchVoiceActorInfo(id, page) {
  if (!page) page = 1;
  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { id: parseInt(id, 10), page: parseInt(page, 10) }
    });

    const charactersData = response.data?.data?.Media?.characters;
    if (!charactersData) {
      return { data: [], totalPages: 1 };
    }

    return {
      data: charactersData.edges.map(formatVoiceActor).filter(Boolean),
      totalPages: charactersData.pageInfo.lastPage || 1
    };
  } catch (error) {
    console.error("Error fetching voice actor info from AniList:", error);
    return { data: [], totalPages: 1 };
  }
}
