import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send("URL parameter is missing");

  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'Referer': 'https://komikcast.cc/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36)'
      },
      httpsAgent: agent
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.data.pipe(res);
  } catch (error) {
    console.error("Image Proxy Error:", error.message);
    res.status(500).send("Error fetching image");
  }
}
