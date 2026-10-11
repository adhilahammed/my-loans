import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImg = 'C:\\Users\\ikm\\.gemini\\antigravity-ide\\brain\\1592b631-b507-4c8f-ba85-a99f51758231\\loan_tracker_icon_1791735779475.jpg';
const publicDir = 'c:\\Users\\ikm\\.gemini\\antigravity-ide\\scratch\\my-loans\\public';

async function makeIcons() {
  const baseImg = sharp(sourceImg);

  // 1. 512x512 PWA icon
  await baseImg.clone()
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 2. 192x192 PWA icon
  await baseImg.clone()
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 3. 180x180 Apple touch icon (standard iOS size)
  await baseImg.clone()
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. Precomposed apple touch icon
  await baseImg.clone()
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));

  // 5. 32x32 favicon
  await baseImg.clone()
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  // 6. 16x16 favicon
  await baseImg.clone()
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // 7. Base64 encoded SVG favicon so SVG loaders render it crisply
  const png512Buffer = await baseImg.clone().resize(512, 512).png().toBuffer();
  const b64 = png512Buffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="112" fill="#0b0f14"/>
  <image href="data:image/png;base64,${b64}" width="512" height="512" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

  console.log('All icons successfully generated in public directory!');
}

makeIcons().catch(console.error);
