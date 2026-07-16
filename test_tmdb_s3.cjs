const axios = require('axios');
const API_KEY = 'd9312f136dcb9c979bdae85d607f9900';

async function test() {
  try {
    console.log("Mencari data Mushoku Tensei Season 3 di TMDB...\n");
    // ID TMDB untuk Mushoku Tensei adalah 94664
    // Season 3 berada di season_number = 3
    const res = await axios.get(`https://api.themoviedb.org/3/tv/94664/season/3?api_key=${API_KEY}`);
    
    // Ambil episode 1 dari Season 3
    const eps1 = res.data.episodes[0];
    
    const output = {
      judul_episode: eps1.name,
      thumbnail_url: `https://image.tmdb.org/t/p/w300${eps1.still_path}`,
      sinopsis: eps1.overview,
      tanggal_rilis: eps1.air_date,
      rating: eps1.vote_average,
      durasi_menit: eps1.runtime
    };
    
    console.log("=== HASIL DATA EPISODE 1 (SEASON 3) DARI TMDB ===");
    console.log(JSON.stringify(output, null, 2));

  } catch (err) {
    console.error(err.message);
  }
}
test();
