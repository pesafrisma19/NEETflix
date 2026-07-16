const axios = require('axios');

async function testFillerApi() {
  try {
    console.log("Mencari One Piece di Anime Filler List API...");
    // 1. Coba Endpoint
    const res = await axios.get("https://api-anime-filler.vercel.app/api/anime/one-piece");
    console.log("Response:", Object.keys(res.data));
    console.log("Total Eps:", res.data.episodes?.length);
    if(res.data.episodes) {
       const filler = res.data.episodes.filter(ep => ep.isFiller);
       console.log("Total Filler:", filler.length);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testFillerApi();
