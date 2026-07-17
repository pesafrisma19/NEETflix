const axios = require('axios');
const url = 'https://desustream.me/dstream/otakuwatch3/?id=clJHbFBUUGlmcENmVXVoRWdsd08rcDNySC90cVVZRVRFYkdiNFNOa2lKbz0=';
axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(async res => {
  const html = res.data;
  console.log('HTML Length:', html.length);
  const gvMatch = html.match(/(https:\/\/[^\s"'<]*googlevideo\.com\/videoplayback[^\s"'<]*)/i);
  console.log('Direct Match:', gvMatch ? 'FOUND' : 'NOT FOUND');
  const bloggerMatch = html.match(/<iframe[^>]+src=["'](https:\/\/[^"']*blogger\.com\/video\.g[^"']*)["']/i);
  console.log('Blogger Match:', bloggerMatch ? bloggerMatch[1] : 'NOT FOUND');
  
  if (bloggerMatch) {
     const bHtml = (await axios.get(bloggerMatch[1])).data;
     const bMatch = bHtml.match(/(https:\/\/[^\s"'<]*googlevideo\.com\/videoplayback[^\s"'<]*)/i);
     console.log('Blogger Extracted:', bMatch ? 'FOUND' : 'NOT FOUND');
  }
}).catch(console.error);
