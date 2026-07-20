import { Jimp } from "jimp";

async function resizeIcons() {
  console.log("Reading image...");
  const image = await Jimp.read("public/logon2.png");
  
  console.log("Resizing to 192x192...");
  const img192 = image.clone();
  img192.resize({ w: 192, h: 192 });
  await img192.write("public/icon-192.png");
  
  console.log("Resizing to 512x512...");
  const img512 = image.clone();
  img512.resize({ w: 512, h: 512 });
  await img512.write("public/icon-512.png");
  
  console.log("Done!");
}

resizeIcons().catch(console.error);
