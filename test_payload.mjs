import fetchAnimeInfo from './src/utils/getAnimeInfo.utils.js';
import axios from 'axios';
async function test() {
  const res = await fetchAnimeInfo('101922');
  const animeInfo = res.data;
  
  const rawSynonyms = animeInfo.animeInfo?.Synonyms || "";
  const synonyms = rawSynonyms ? rawSynonyms.split(',').map(s => s.trim()) : [];
  const titles = [...new Set([
    animeInfo.title,
    animeInfo.japanese_title,
    animeInfo.animeInfo?.Japanese,
    ...synonyms
  ].filter(Boolean))];

  const year = animeInfo.animeInfo?.Aired ? parseInt(animeInfo.animeInfo.Aired.split('-')[0]) : null;

  const payload = {
    id: animeInfo.id,
    titles,
    year,
    format: animeInfo.animeInfo?.tvInfo?.showType,
    status: animeInfo.animeInfo?.Status,
    totalEpisodes: animeInfo.animeInfo?.tvInfo?.eps,
    studio: animeInfo.animeInfo?.Studios?.[0] || "",
    genres: animeInfo.animeInfo?.Genres || []
  };
  
  console.log('Sending payload:', JSON.stringify(payload));
  try {
     const postRes = await axios.post('http://localhost:4444/api/animelovers/episodes-by-title', payload);
     console.log('Success!', postRes.data.results.episodes.length);
  } catch (e) {
     console.error('ERROR:', e.response?.status, e.response?.data);
  }
}
test();
