const fs = require('fs');
const https = require('https');
const path = require('path');

const publicDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const images = [
  { url: 'https://i.postimg.cc/rFZnx5tQ/2-Kn-Kzog-md.webp', filename: '2-Kn-Kzog-md.webp' },
  { url: 'https://i.postimg.cc/pVGY6RXd/thumb.png', filename: 'thumb.png' },
  { url: 'https://i.postimg.cc/d34WWyNQ/share-icon.gif', filename: 'share-icon.gif' },
  { url: 'https://i.postimg.cc/HnHKvHpz/no-avatar.jpg', filename: 'no-avatar.jpg' }
];

images.forEach(img => {
  const filepath = path.join(publicDir, img.filename);
  const req = https.get(img.url, (res) => {
    if (res.statusCode === 200) {
      res.pipe(fs.createWriteStream(filepath));
      console.log('Downloaded:', img.filename);
    } else {
      console.log('Failed to download:', img.filename, res.statusCode);
    }
  });
  req.on('error', (e) => {
    console.error('Error fetching', img.filename, e.message);
  });
});
