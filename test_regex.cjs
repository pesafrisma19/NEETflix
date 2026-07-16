const html = `<iframe id="myIframe" src="https://draft.blogger.com/video.g?token=AD6v5dw" allowfullscreen></iframe>`;
const match = html.match(/<iframe[^>]+src=["'](https:\/\/[^"']*blogger\.com\/video\.g[^"']*)["']/i);
console.log('MATCH:', match ? match[1] : 'FAIL');
