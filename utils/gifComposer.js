const sharp = require('sharp');
const { GifUtil, GifFrame, GifCodec, BitmapImage } = require('gifwrap');
const axios = require('axios');

// Positions des ronds adverses sur les GIFs
// Domicile → rond adverse à DROITE
// Visiteur → rond adverse à GAUCHE
const POSITIONS = {
  home: { cx: 1090, cy: 500, r: 110 },
  away: { cx: 350,  cy: 500, r: 110 },
};

async function downloadBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(res.data);
}

async function composeLogo(gifUrl, logoUrl, isHome) {
  try {
    const pos = isHome ? POSITIONS.home : POSITIONS.away;
    const size = pos.r * 2;

    // Télécharger
    const [gifBuffer, logoBuffer] = await Promise.all([
      downloadBuffer(gifUrl),
      downloadBuffer(logoUrl),
    ]);

    // Lire le GIF pour connaître les dimensions réelles de la première frame
    const gif = await GifUtil.read(gifBuffer);
    const frameWidth  = gif.frames[0].bitmap.width;
    const frameHeight = gif.frames[0].bitmap.height;

    console.log(`GIF dimensions: ${frameWidth}x${frameHeight}, logo circle size: ${size}, pos: ${pos.cx},${pos.cy}`);

    // Vérifier que le logo rentre dans le GIF
    const left = Math.round(pos.cx - pos.r);
    const top  = Math.round(pos.cy - pos.r);
    if (left < 0 || top < 0 || left + size > frameWidth || top + size > frameHeight) {
      console.error(`Position hors limites: left=${left}, top=${top}, size=${size}, frame=${frameWidth}x${frameHeight}`);
      return null;
    }

    // Resize le logo en carré puis masque circulaire
    const resized = await sharp(logoBuffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer();

    const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${pos.r}" cy="${pos.r}" r="${pos.r}" fill="white"/></svg>`;

    const logoCircle = await sharp(resized)
      .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
      .png()
      .toBuffer();

    // Composer sur chaque frame
    const newFrames = [];
    for (const frame of gif.frames) {
      const framePng = await sharp(Buffer.from(frame.bitmap.data), {
        raw: { width: frameWidth, height: frameHeight, channels: 4 }
      })
        .composite([{ input: logoCircle, left, top }])
        .raw()
        .toBuffer();

      const newBitmap = new BitmapImage(frameWidth, frameHeight, framePng);
      GifUtil.quantizeDekker(newBitmap);
      const newFrame = new GifFrame(newBitmap, {
        delayCentisecs: frame.delayCentisecs,
        disposalMethod: frame.disposalMethod,
      });
      newFrames.push(newFrame);
    }

    const codec  = new GifCodec();
    const newGif = await codec.encodeGif(newFrames, { loops: 0 });
    return newGif.buffer;

  } catch (err) {
    console.error('composeLogo error:', err.message);
    return null;
  }
}

module.exports = { composeLogo };
