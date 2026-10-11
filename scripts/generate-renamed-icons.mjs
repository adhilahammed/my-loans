import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImg = 'C:\\Users\\ikm\\.gemini\\antigravity-ide\\brain\\1592b631-b507-4c8f-ba85-a99f51758231\\loan_tracker_icon_1791735779475.jpg';
const publicDir = 'c:\\Users\\ikm\\.gemini\\antigravity-ide\\scratch\\my-loans\\public';

async function run() {
  const baseImg = sharp(sourceImg);

  // New unique filename that iOS Safari has never seen
  await baseImg.clone()
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon-v2.png'));

  await baseImg.clone()
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon-v2.png'));

  // Also write favicon.ico (as 32x32 png which modern browsers/Safari parse seamlessly)
  await baseImg.clone()
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Generated apple-touch-icon-v2.png, favicon-v2.png, and favicon.ico');
}

run().catch(console.error);
