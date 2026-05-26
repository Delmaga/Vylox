const sharp = require('sharp');
const { GifUtil, GifFrame, GifCodec, BitmapImage } = require('gifwrap');
const axios = require('axios');

// Positions des ronds adverses sur les GIFs 1920x1080
// Domicile → Vylox à gauche, rond adverse à DROITE
// Visiteur → Vylox à droite, rond adverse à GAUCHE
const POSITIONS = {
  home: { cx: 1453, cy: 666, r: 146 },
  away: { cx: 466,  cy: 666, r: 146 },
};

async function downloadBuffer(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VyloxBot/1.0)' }
  });
  return Buffer.from(res.data);
}

async function composeLogo(gifUrl, logoUrl, isHome) {
  try {
    const pos  = isHome ? POSITIONS.home : POSITIONS.away;
    const size = pos.r * 2;

    // Télécharger GIF et logo en parallèle
    const [gifBuffer, logoBuffer] = await Promise.all([
      downloadBuffer(gifUrl),
      downloadBuffer(logoUrl),
    ]);

    // Lire le GIF
    const gif = await GifUtil.read(gifBuffer);
    const frameW = gif.frames[0].bitmap.width;
    const frameH = gif.frames[0].bitmap.height;

    console.log(`GIF: ${frameW}x${frameH} | Logo pos: cx=${pos.cx}, cy=${pos.cy}, r=${pos.r}`);

    const left = Math.round(pos.cx - pos.r);
    const top  = Math.round(pos.cy - pos.r);

    // Vérifier les bounds
    if (left < 0 || top < 0 || left + size > frameW || top + size > frameH) {
      console.error(`Hors limites: left=${left}, top=${top}, size=${size}, frame=${frameW}x${frameH}`);
      return null;
    }

    // Préparer logo circulaire
    const resized = await sharp(logoBuffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    const svgMask = `<svg width="${size}" height="${size}">
      <circle cx="${pos.r}" cy="${pos.r}" r="${pos.r}" fill="white"/>
    </svg>`;

    const logoCircle = await sharp(resized)
      .composite([{ input: Buffer.from(svgMask), blend: 'dest-in' }])
      .png()
      .toBuffer();

    // Composer sur chaque frame
    const newFrames = [];
    for (const frame of gif.frames) {
      const composed = await sharp(Buffer.from(frame.bitmap.data), {
        raw: { width: frameW, height: frameH, channels: 4 }
      })
        .composite([{ input: logoCircle, left, top }])
        .raw()
        .toBuffer();

      const bitmap  = new BitmapImage(frameW, frameH, composed);
      GifUtil.quantizeDekker(bitmap);
      newFrames.push(new GifFrame(bitmap, {
        delayCentisecs: frame.delayCentisecs,
        disposalMethod: frame.disposalMethod,
      }));
    }

    const codec  = new GifCodec();
    const newGif = await codec.encodeGif(newFrames, { loops: 0 });
    console.log(`GIF composé: ${newGif.buffer.length} bytes`);
    return newGif.buffer;

  } catch (err) {
    console.error('composeLogo error:', err.message);
    return null;
  }
}

module.exports = { composeLogo };
