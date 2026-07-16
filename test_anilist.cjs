const axios = require('axios');

const query = `
query {
  Media(id: 178789, type: ANIME) {
    id
    title {
      english
      romaji
      native
    }
  }
}
`;

axios.post('https://graphql.anilist.co', { query })
  .then(res => {
    console.log("=== BUKTI DATA DARI ANILIST API ===");
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => console.error(err.message));
