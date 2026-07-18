import axios from "axios";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

/**
 * @param {Object} animeInfo  - Data anime komplit dari AniList
 * @param {number} episodeNumber - Nomor episode
 * @param {string} episodeSlug   - Slug episode (khusus untuk ambil stream AL bypass search)
 * @param {string} source        - "AL" atau "OD" (default "AL")
 */
export default async function getStreamInfo(animeInfo, episodeNumber, episodeSlug, source = "AL") {
  if (!animeInfo) return null;

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
    genres: animeInfo.animeInfo?.Genres || [],
    ep: episodeNumber
  };

  try {
    console.log(`[NEETflixapi] Trying ${source} stream for "${titles[0]}" ep ${episodeNumber}`);
    
    let url = "";
    let res;
    if (source === "OD") {
      url = `${NEETFLIXAPI}/api/otakudesu/stream-by-title`;
      res = await axios.post(url, payload);
    } else {
      if (episodeSlug) {
        url = `${NEETFLIXAPI}/api/animelovers/stream?id=${episodeSlug}`;
        res = await axios.get(url);
      } else {
        url = `${NEETFLIXAPI}/api/animelovers/stream-by-title`;
        res = await axios.post(url, payload);
      }
    }

    const result = res.data?.results || res.data;

    if (result && result.sources?.length) {
      const best = result.sources[0];
      console.log(`[NEETflixapi] ✅ Found ${result.sources.length} sources via "${titles[0]}", best: ${best.quality}`);

      return {
        streamingLink: {
          link: {
            file: best.url,
            isIframe: best.type === "iframe",
            allSources: result.sources
          },
          downloads: result.downloads || [],
          tracks: [],
          intro: null,
          outro: null
        }
      };
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err.message;
    console.warn(`[NEETflixapi] ${source} Failed with payload "${titles[0]}": ${msg}`);
  }

  console.error(`[NEETflixapi] ❌ Stream tidak ditemukan di ${source}`);
  return null;
}
