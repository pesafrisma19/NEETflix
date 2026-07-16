const axios = require('axios');

async function testJikan() {
  try {
    console.log("Mencari One Piece di Jikan API...");
    // 1. Cari Anime (One Piece)
    const searchRes = await axios.get("https://api.jikan.moe/v4/anime?q=One Piece&limit=1");
    const anime = searchRes.data.data[0];
    const malId = anime.mal_id;
    console.log(`Ditemukan: ${anime.title} (MAL ID: ${malId})`);

    // 2. Ambil Episode dari Jikan
    console.log(`Mengambil daftar episode untuk MAL ID ${malId}...`);
    const epsRes = await axios.get(`https://api.jikan.moe/v4/anime/${malId}/episodes`);
    const episodes = epsRes.data.data;
    
    console.log(`Total episode di halaman 1: ${episodes.length}`);
    console.log("Contoh 5 Episode Terakhir di Halaman 1:");
    
    episodes.slice(-5).forEach(ep => {
      console.log(`Ep ${ep.mal_id}: ${ep.title} | Filler: ${ep.filler} | Recap: ${ep.recap}`);
    });
    
    // Coba cari episode filler di halaman 1
    const fillers = episodes.filter(ep => ep.filler);
    console.log(`\nJumlah Filler di Halaman 1: ${fillers.length}`);
    if (fillers.length > 0) {
      console.log("Contoh Filler:", fillers[0].mal_id, fillers[0].title);
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testJikan();
