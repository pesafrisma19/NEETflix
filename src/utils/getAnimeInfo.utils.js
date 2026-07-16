import axios from "axios";

const query = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { english romaji native }
    coverImage { extraLarge large }
    bannerImage
    description
    trailer { id site thumbnail }
    format
    status
    episodes
    duration
    startDate { year month day }
    season seasonYear
    isAdult
    averageScore
    genres
    synonyms
    studios { edges { isMain node { name } } }
    characters(sort: ROLE, perPage: 12) {
      edges {
        role
        node { id name { full } image { large } }
        voiceActors(language: JAPANESE, sort: RELEVANCE) { id name { full } image { large } }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes {
        mediaRecommendation {
          id title { english romaji native } coverImage { extraLarge large } description
          format status episodes duration startDate { year month day } isAdult averageScore
        }
      }
    }
    relations {
      edges {
        relationType(version: 2)
        node {
          id type title { english romaji native } coverImage { extraLarge large }
          format status episodes duration startDate { year month day } isAdult averageScore
        }
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
      sub: m.episodes || "?", // mock sub
      dub: null
    }
  };
}

export default async function fetchAnimeInfo(id, random = false) {
  try {
    let aniId = parseInt(id, 10);

    // Mock random if requested
    if (random) {
       // just pick a popular one like One Piece (21) or Naruto (20) if random is requested
       aniId = 21; 
    }

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

    const charactersVoiceActors = (m.characters?.edges || []).map(edge => {
      const char = edge.node;
      const va = edge.voiceActors && edge.voiceActors.length > 0 ? edge.voiceActors[0] : null;
      return {
        character: {
          id: char.id,
          name: char.name.full,
          poster: char.image?.large,
          cast: edge.role
        },
        voiceActors: va ? [{
          id: va.id,
          name: va.name.full,
          poster: va.image?.large
        }] : []
      };
    });

    const recommended_data = (m.recommendations?.nodes || [])
      .map(node => formatCard(node.mediaRecommendation))
      .filter(x => x !== null);

    // Build Seasons & Related
    const seasons = [];
    const related_data = [];

    (m.relations?.edges || []).forEach(edge => {
      if (edge.node.type === "ANIME") {
        // If it's a direct prequel/sequel or alternative/side-story, add it to seasons
        const seasonTypes = ["PREQUEL", "SEQUEL", "SPIN_OFF", "ALTERNATIVE", "SIDE_STORY", "PARENT", "SUMMARY"];
        if (seasonTypes.includes(edge.relationType)) {
          seasons.push({
            id: edge.node.id.toString(),
            season: edge.node.title.english || edge.node.title.romaji,
            season_poster: edge.node.coverImage?.extraLarge || edge.node.coverImage?.large
          });
        } else {
          // Other relations go to related
          related_data.push(formatCard(edge.node));
        }
      }
    });

    // Ensure the current anime is also in the "seasons" list to highlight it as active
    seasons.push({
        id: m.id.toString(),
        season: m.title.english || m.title.romaji,
        season_poster: m.coverImage?.extraLarge || m.coverImage?.large
    });

    const finalData = {
      data: {
        id: m.id.toString(),
        title: m.title.english || m.title.romaji,
        japanese_title: m.title.romaji || m.title.native,
        poster: m.coverImage?.extraLarge || m.coverImage?.large,
        adultContent: m.isAdult,
        animeInfo: {
          Overview: m.description ? m.description.replace(/<[^>]*>?/gm, '') : "No synopsis available.",
          Japanese: m.title.native || m.title.romaji,
          Synonyms: m.synonyms ? m.synonyms.join(", ") : "",
          Aired: airedDate,
          Premiered: m.season ? `${m.season} ${m.seasonYear || ""}` : "?",
          Duration: m.duration ? `${m.duration}m` : "?",
          Status: m.status,
          "MAL Score": m.averageScore ? (m.averageScore / 10).toFixed(1) : "?",
          Genres: m.genres || [],
          Studios: (m.studios?.edges || []).filter(e => e.isMain).map(e => e.node.name),
          Producers: (m.studios?.edges || []).filter(e => !e.isMain).map(e => e.node.name),
          trailer: m.trailer,
          tvInfo: {
            rating: m.isAdult ? "18+" : "PG-13",
            quality: "HD",
            sub: m.episodes || "?",
            dub: null,
            showType: m.format || "TV"
          }
        },
        charactersVoiceActors,
        recommended_data,
        related_data
      },
      seasons
    };

    return finalData;

  } catch (error) {
    console.error("Error fetching anime info:", error);
    return null;
  }
}
