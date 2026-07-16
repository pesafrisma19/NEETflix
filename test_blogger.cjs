const axios = require('axios');
axios.get('https://www.blogger.com/video.g?token=AD6v5dyuI-f4DTuERX0aRd8KXDBknCb4V8J1YJMvhTJ8V0KCyZawiqZQyzokyTUzBhVfo203bjybrLrnPLyfKYEsIgxb1pre6IGzHcYvUqmis1bVTPJ7Mjy0GaA8cAIIyZDSwttK-yo4')
  .then(r => {
    const html = r.data;
    const match = html.match(/"play_url":"([^"]+)"/);
    if(match) console.log('URL:', match[1]);
    else console.log('NO MATCH');
  })
  .catch(e => console.log('ERROR:', e.message));
