import fs from 'fs';
import path from 'path';
import https from 'https';

const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  {
    name: 'PlayfairDisplay-Bold.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf'
  },
  {
    name: 'PlayfairDisplay-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf'
  },
  {
    name: 'Lora-Regular.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/lora/Lora%5Bwght%5D.ttf'
  },
  {
    name: 'Lora-Bold.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/lora/Lora-Italic%5Bwght%5D.ttf'
  }
];

const downloadFont = (url, dest) => {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${path.basename(dest)}...`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => { file.close(resolve); });
        }).on('error', (err) => { fs.unlink(dest); reject(err); });
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(resolve); });
      }
    }).on('error', (err) => { fs.unlink(dest); reject(err); });
  });
};

(async () => {
  for (const font of fonts) {
    const dest = path.join(fontsDir, font.name);
    if (!fs.existsSync(dest)) {
      try {
        await downloadFont(font.url, dest);
      } catch (e) {
        console.error(`Failed to download ${font.name}:`, e);
      }
    }
  }
  console.log('Font download complete.');
})();
