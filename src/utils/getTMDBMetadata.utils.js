import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'd9312f136dcb9c979bdae85d607f9900';

export async function getTMDBMetadata(animeTitle, totalEpisodes) {
  try {
    if (!animeTitle) return null;

    // Bersihkan judul dari kata-kata seperti "Season 3", "Part 2", dsb
    const cleanedTitle = animeTitle.replace(/season\s*\d+|part\s*\d+/ig, '').trim().replace(/[:\-]/g, ' ');
    
    // Ekstrak nomor season dari judul (default 1)
    const seasonMatch = animeTitle.match(/season\s*(\d+)/i);
    let targetSeason = seasonMatch ? parseInt(seasonMatch[1]) : 1;

    // 1. Cari TV Show di TMDB
    const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(cleanedTitle)}`;
    const searchRes = await axios.get(searchUrl);
    
    const results = searchRes.data.results;
    if (!results || results.length === 0) {
      return null; // Tidak ditemukan
    }

    // Prioritaskan Anime Jepang (original_language === 'ja')
    const bestMatch = results.find(show => show.original_language === 'ja') || results[0];
    const showId = bestMatch.id;

    // 2. Ambil detail show untuk melihat season yang tersedia
    const detailsUrl = `https://api.themoviedb.org/3/tv/${showId}?api_key=${API_KEY}`;
    const detailsRes = await axios.get(detailsUrl);
    const seasons = detailsRes.data.seasons || [];

    // Validasi apakah targetSeason ada di TMDB
    let matchedSeasonObj = seasons.find(s => s.season_number === targetSeason);
    
    // Jika tidak ada season yang persis, atau jumlah episodenya sangat berbeda, 
    // kita cari season yang jumlah episodenya paling mendekati totalEpisodes dari Otakudesu
    if (!matchedSeasonObj || (totalEpisodes && Math.abs(matchedSeasonObj.episode_count - totalEpisodes) > 5)) {
       const bestMatch = seasons.reduce((prev, curr) => {
         // Abaikan season 0 (Specials) kecuali memang diminta
         if (curr.season_number === 0) return prev;
         return (Math.abs(curr.episode_count - totalEpisodes) < Math.abs(prev.episode_count - totalEpisodes)) ? curr : prev;
       }, seasons[seasons.length - 1]); // default ke season terakhir
       
       if (bestMatch) {
         targetSeason = bestMatch.season_number;
       }
    }

    // 3. Ambil data spesifik dari season tersebut
    const seasonUrl = `https://api.themoviedb.org/3/tv/${showId}/season/${targetSeason}?api_key=${API_KEY}`;
    const seasonRes = await axios.get(seasonUrl).catch(() => null);
    
    if (!seasonRes || !seasonRes.data || !seasonRes.data.episodes) {
      return null;
    }

    // 4. Format hasil ke dalam dictionary dengan key episode_number
    const tmdbEpisodes = {};
    seasonRes.data.episodes.forEach(ep => {
      tmdbEpisodes[ep.episode_number] = {
        title: ep.name,
        thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w780${ep.still_path}` : null,
        overview: ep.overview,
        airDate: ep.air_date,
        rating: ep.vote_average
      };
    });

    return tmdbEpisodes;

  } catch (err) {
    console.error("Error fetching TMDB metadata:", err);
    return null;
  }
}
