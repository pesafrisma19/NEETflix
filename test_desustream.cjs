const axios = require('axios');
axios.get('https://desustream.info/dstream/otakuwatch5/new/index.php?id=TGdRNDRNazNrcGl6MUN4RG81MlRlOUQvYnFDTm1wZVZ6ZGxGMjRnTVdndz0=', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => {
    const html = r.data;
    const mp4Match = html.match(/(https?:\/\/[^\s"'>]+?\.mp4[^\s"'>]*)/i);
    const m3u8Match = html.match(/(https?:\/\/[^\s"'>]+?\.m3u8[^\s"'>]*)/i);
    console.log('MP4:', mp4Match ? 'FOUND' : 'NONE');
    console.log('M3U8:', m3u8Match ? 'FOUND' : 'NONE');
    if (!mp4Match && !m3u8Match) {
       console.log('HTML SAMPLE:', html.slice(0, 1000));
    }
  })
  .catch(e => console.log('ERROR:', e.message));
