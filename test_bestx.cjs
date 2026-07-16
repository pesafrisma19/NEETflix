const axios = require('axios');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

function unpack(packed) {
    const pMatch = packed.match(/eval\(function\(p,a,c,k,e,d\).*?return p}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)/);
    if (!pMatch) return null;
    let p = pMatch[1];
    const a = parseInt(pMatch[2]);
    const c = parseInt(pMatch[3]);
    const k = pMatch[4].split('|');
    const e = function(c) {
        return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36));
    };
    for (let i = c - 1; i >= 0; i--) {
        if (k[i]) {
            const regex = new RegExp('\\b' + e(i) + '\\b', 'g');
            p = p.replace(regex, k[i]);
        }
    }
    return p;
}

axios.get('https://bestx.stream/v/nSRczu7tgG0K/', { httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => {
    const html = r.data;
    const packed = html.match(/eval\(function\(p,a,c,k,e,d\).*?split\('\|'\)\)\)/);
    if(packed) {
      console.log('PACKED FOUND. Length:', packed[0].length);
      const unpacked = unpack(packed[0]);
      if(unpacked) {
         const m3u8Match = unpacked.match(/(https?:\/\/[^\s"'>]+?\.m3u8[^\s"'>]*)/i);
         console.log('EXTRACTED M3U8:', m3u8Match ? m3u8Match[1] : 'NONE');
      }
    } else {
      const m3u8Match = html.match(/(https?:\/\/[^\s"'>]+?\.m3u8[^\s"'>]*)/i);
      console.log('M3U8 MATCH:', m3u8Match ? m3u8Match[1] : 'NONE');
    }
  })
  .catch(e => console.log('ERROR:', e.message));
