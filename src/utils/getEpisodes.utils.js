import axios from "axios";

export default async function getEpisodes(animeTitle) {
  if (!animeTitle) return { episodes: [], totalEpisodes: 0 };
  const api_url = import.meta.env.VITE_ANIMASU_API_URL || import.meta.env.VITE_API_URL;
  
  try {
    let url;
    let response;
    let animeId = null;

    // 1. Bersihkan judul (buang karakter aneh) dan ambil 2 kata pertama untuk menghindari error 500
    const cleanTitle = animeTitle.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
    const shortTitle = cleanTitle.split(/\s+/).slice(0, 2).join(" ");
    const searchUrl = `${api_url}/search/${encodeURIComponent(shortTitle)}`;
    
    const searchRes = await axios.get(searchUrl).catch(() => null);
    
    if (searchRes?.data?.data?.animeList?.length > 0) {
        const animeList = searchRes.data.data.animeList;
        const originalWords = cleanTitle.toLowerCase().split(/\s+/);
        
        let bestMatch = animeList[0];
        let highestScore = -1;

        animeList.forEach(anime => {
            const resultWords = anime.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/);
            let score = 0;
            
            // Hitung kata yang cocok
            originalWords.forEach(word => {
                if (resultWords.includes(word)) score++;
            });
            
            // Beri bobot tinggi untuk kata penentu musim (Season, Part, Angka)
            const crucialWords = ["season", "part", "2", "3", "4", "5", "ii", "iii", "iv"];
            originalWords.forEach(word => {
                if (crucialWords.includes(word) && resultWords.includes(word)) {
                    score += 5;
                }
            });

            if (score > highestScore) {
                highestScore = score;
                bestMatch = anime;
            }
        });

        animeId = bestMatch.animeId;
    }

    if (!animeId) {
        // Fallback jika pencarian gagal: tebak slug manual (biasanya salah untuk judul aneh)
        animeId = animeTitle.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() + "-sub-indo";
    }

    // 2. Gunakan animeId yang didapat untuk mengambil daftar episode
    url = `${api_url}/anime/${animeId}`;
    console.log("Fetching Otakudesu Episodes:", url);
    response = await axios.get(url).catch(() => null);

    const rawEpisodes = response?.data?.data?.episodeList || [];
    const reversedRaw = rawEpisodes.slice().reverse();

    const seen = new Set();
    const episodes = reversedRaw.map((ep, index) => {
      const epNumMatch = ep.title.match(/episode\s+(\d+)/i) || ep.title.match(/ep\s+(\d+)/i);
      let epNum = epNumMatch ? parseInt(epNumMatch[1], 10) : index + 1;
      
      while (seen.has(epNum)) {
        epNum++;
      }
      seen.add(epNum);

      return {
        id: `ep=${epNum}`,
        episode_no: epNum,
        slug: ep.episodeId, // Otakudesu uses episodeId as the slug
      };
    });

    return {
      episodes: episodes,
      totalEpisodes: episodes.length
    };
  } catch (error) {
    console.error("Error fetching anime episodes from Otakudesu:", error);
    return { episodes: [], totalEpisodes: 0 };
  }
}
