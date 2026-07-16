const axios = require('axios');
const API_KEY = 'd9312f136dcb9c979bdae85d607f9900';

async function test() {
  try {
    const res = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=Mushoku%20Tensei`);
    const results = res.data.results;
    console.log(results[0].name, results[0].id);
    
    // Get TV series details to see seasons
    const details = await axios.get(`https://api.themoviedb.org/3/tv/${results[0].id}?api_key=${API_KEY}`);
    const seasons = details.data.seasons;
    console.log("Seasons:", seasons.map(s => ({name: s.name, ep_count: s.episode_count, s_num: s.season_number})));
    
    // Get season 2 details
    const s2 = await axios.get(`https://api.themoviedb.org/3/tv/${results[0].id}/season/2?api_key=${API_KEY}`);
    const eps = s2.data.episodes;
    console.log("First 3 eps of Season 2:");
    console.log(eps.slice(0, 3).map(e => ({name: e.name, still: e.still_path})));
  } catch (err) {
    console.error(err.message);
  }
}
test();
