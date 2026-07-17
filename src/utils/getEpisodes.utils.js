import axios from "axios";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

/**
 * Ambil daftar episode dari source (AL / OD)
 * Kembalikan format yang kompatibel dengan useWatch.js:
 *   { id: "ep=1", episode_no: 1, slug: "al-150441-1", source: "AL" }
 *
 * @param {Object} animeInfo  - Data anime komplit dari AniList
 * @param {string} source     - "AL" atau "OD"
 */
export default async function getEpisodes(animeInfo, source = "AL") {
  if (!animeInfo) return { episodes: [], totalEpisodes: 0, sourceAnimeId: null, sourceTitle: null };

  const rawSynonyms = animeInfo.animeInfo?.Synonyms || "";
  const synonyms = rawSynonyms ? rawSynonyms.split(',').map(s => s.trim()) : [];
  const titles = [...new Set([
    animeInfo.title,
    animeInfo.japanese_title,
    animeInfo.animeInfo?.Japanese,
    ...synonyms
  ].filter(Boolean))];

  const year = animeInfo.animeInfo?.Aired ? parseInt(animeInfo.animeInfo.Aired.split('-')[0]) : null;

  const payload = {
    id: animeInfo.id,
    titles,
    year,
    format: animeInfo.animeInfo?.tvInfo?.showType,
    status: animeInfo.animeInfo?.Status,
    totalEpisodes: animeInfo.animeInfo?.tvInfo?.eps,
    studio: animeInfo.animeInfo?.Studios?.[0] || "",
    genres: animeInfo.animeInfo?.Genres || []
  };

  try {
    console.log(`[getEpisodes] Trying ${source} with rich payload for "${titles[0]}"`);
    
    let url = "";
    if (source === "OD") {
      url = `${NEETFLIXAPI}/api/otakudesu/episodes-by-title`; // jika OD sudah diubah ke POST
    } else {
      url = `${NEETFLIXAPI}/api/animelovers/episodes-by-title`;
    }

    const res = await axios.post(url, payload);
    const data = res.data?.results || res.data;

    if (data?.episodes?.length) {
      console.log(`[getEpisodes] ✅ ${source} found ${data.totalEpisodes} episodes for "${titles[0]}"`);
      const episodes = data.episodes.map((ep) => ({
        id: `ep=${ep.number}`,
        episode_no: ep.number,
        slug: ep.id,
        source: source,
      }));

      return {
        episodes,
        totalEpisodes: data.totalEpisodes,
        sourceAnimeId: data.animeId,
        sourceTitle: data.animeTitle,
      };
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err.message;
    console.warn(`[getEpisodes] ${source} failed for "${titles[0]}": ${msg}`);
  }

  return { episodes: [], totalEpisodes: 0, sourceAnimeId: null, sourceTitle: null };
}

