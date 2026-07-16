const axios = require('axios');
axios.get('https://vidhidepro.com/v/hchgybb5xikf', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => {
    const html = r.data;
    const match = html.match(/sources:\s*\[([^\]]+)\]/);
    if(match) console.log('SOURCES MATCH:', match[1]);
    else {
      const m3u8Match = html.match(/(https?:\/\/[^\s"'>]+?\.m3u8[^\s"'>]*)/i);
      console.log('M3U8 MATCH:', m3u8Match ? m3u8Match[1] : 'NONE');
    }
  })
  .catch(e => console.log('ERROR:', e.message));
