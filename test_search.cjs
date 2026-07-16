const axios = require('axios');
axios.get('https://www.sankavollerei.web.id/anime/search?q=sakamoto%20days', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } })
  .then(r => console.log('SEARCH:', JSON.stringify(r.data, null, 2).slice(0, 500)))
  .catch(e => console.log('ERROR:', e.message));
