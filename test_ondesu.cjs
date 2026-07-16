const axios = require('axios');
async function test() {
  const url = 'https://desustream.info/dstream/ondesu/v5/index.php?id=TkhWMSs4U2pzWWhrMCtuVmh0TytuUT09';
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
  
  try {
     console.log('Fetching from corsproxy.io...');
     const r = await axios.get(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
     const htmlContent = r.data;
     
     let gvMatch = htmlContent.match(/<source[^>]+src=["'](https:\/\/[^"']*googlevideo\.com\/videoplayback[^"']*)["']/i);
     if (!gvMatch) {
         console.log('No direct source found, looking for Blogger iframe...');
         const bloggerMatch = htmlContent.match(/<iframe[^>]+src=["'](https:\/\/[^"']*blogger\.com\/video\.g[^"']*)["']/i);
         if (bloggerMatch) {
             const bloggerUrl = bloggerMatch[1];
             console.log('Found Blogger URL:', bloggerUrl);
             
             console.log('Fetching blogger iframe from corsproxy.io...');
             const bResp = await axios.get('https://corsproxy.io/?' + encodeURIComponent(bloggerUrl), { headers: { 'User-Agent': 'Mozilla/5.0' } });
             const bloggerHtml = bResp.data;
             
             gvMatch = bloggerHtml.match(/(https:\/\/[^\s"'<]*googlevideo\.com\/videoplayback[^\s"'<]*)/i);
         } else {
             console.log('NO BLOGGER IFRAME FOUND!');
             console.log(htmlContent.substring(0, 500));
         }
     }
     
     if (gvMatch) {
         let videoUrl = gvMatch[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
         console.log('SUCCESS MP4:', videoUrl.substring(0, 100));
     } else {
         console.log('FAIL EXTRACT MP4');
     }
  } catch(e) {
     console.log('AXIOS ERROR:', e.message);
  }
}
test();
