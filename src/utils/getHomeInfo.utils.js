import axios from "axios";

const CACHE_KEY = "homeInfoCache";
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

const query = `
query {
  trending: Page(page: 1, perPage: 20) {
    media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  popular: Page(page: 1, perPage: 12) {
    media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  top_airing: Page(page: 1, perPage: 12) {
    media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  upcoming: Page(page: 1, perPage: 12) {
    media(sort: POPULARITY_DESC, type: ANIME, status: NOT_YET_RELEASED, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  favorites: Page(page: 1, perPage: 12) {
    media(sort: FAVOURITES_DESC, type: ANIME, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  latest_episode: Page(page: 1, perPage: 12) {
    media(sort: UPDATED_AT_DESC, type: ANIME, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  latest_completed: Page(page: 1, perPage: 12) {
    media(sort: END_DATE_DESC, type: ANIME, status: FINISHED, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  topten_today: Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  topten_week: Page(page: 1, perPage: 10) {
    media(sort: SCORE_DESC, type: ANIME, status: RELEASING, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
  topten_month: Page(page: 1, perPage: 10) {
    media(sort: FAVOURITES_DESC, type: ANIME, status: RELEASING, isAdult: false) {
      id title { romaji english native } coverImage { extraLarge large } bannerImage description
      format status episodes duration startDate { year month day }
    }
  }
}
`;

function formatMedia(m) {
  return {
    id: m.id.toString(),
    title: m.title.english || m.title.romaji,
    japanese_title: m.title.romaji || m.title.native,
    poster: m.coverImage.extraLarge || m.coverImage.large,
    description: m.description ? m.description.replace(/<[^>]*>?/gm, '') : "",
    duration: m.duration ? `${m.duration}m` : "?",
    tvInfo: {
      showType: m.format || "TV",
      duration: m.duration ? `${m.duration}m` : "?",
      releaseDate: m.startDate?.year ? `${m.startDate.year}` : "?",
      quality: "HD",
      sub: null,
      dub: null,
      eps: m.episodes || "?",
      rating: m.isAdult ? "18+" : ""
    }
  };
}

export default async function getHomeInfo() {
  const currentTime = Date.now();

  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cachedData = JSON.parse(cachedRaw);
      const isValidCache =
        cachedData?.data &&
        Object.keys(cachedData.data).length > 0 &&
        currentTime - cachedData.timestamp < CACHE_DURATION;

      if (isValidCache) {
        return cachedData.data;
      }
    }
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }

  try {
    const response = await axios.post("https://graphql.anilist.co", { query });
    const d = response.data.data;

    if (!d) return null;

    const spotlights = d.trending.media.slice(0, 10).map(m => {
      const formatted = formatMedia(m);
      formatted.poster = m.bannerImage || m.coverImage.extraLarge || m.coverImage.large;
      return formatted;
    });

    const trending = d.trending.media.slice(10, 20).map(formatMedia);
    const topten = {
      today: d.topten_today.media.map(formatMedia),
      week: d.topten_week.media.map(formatMedia),
      month: d.topten_month.media.map(formatMedia)
    };
    const top_airing = d.top_airing.media.map(formatMedia);
    const most_popular = d.popular.media.map(formatMedia);
    const most_favorite = d.favorites.media.map(formatMedia);
    const latest_completed = d.latest_completed.media.map(formatMedia);
    const latest_episode = d.latest_episode.media.map(formatMedia);
    const top_upcoming = d.upcoming.media.map(formatMedia);
    const recently_added = d.trending.media.slice(0, 12).map(formatMedia); // fallback
    const todaySchedule = [];
    const genres = [
      "Action", "Adventure", "Comedy", "Drama", "Fantasy",
      "Horror", "Mecha", "Music", "Mystery", "Psychological",
      "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"
    ];

    const finalData = {
      spotlights,
      trending,
      topten,
      todaySchedule,
      top_airing,
      most_popular,
      most_favorite,
      latest_completed,
      latest_episode,
      top_upcoming,
      recently_added,
      genres,
    };

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: finalData,
        timestamp: currentTime,
      })
    );

    return finalData;
  } catch (error) {
    console.error("Error fetching AniList home info:", error);
    return null;
  }
}
