const sharp = require('sharp');
const { GifUtil, GifFrame, GifCodec, BitmapImage } = require('gifwrap');
const axios = require('axios');

// Positions des ronds adverses sur les GIFs (1440x810px)
// Domicile → Vylox à gauche, rond adverse à DROITE
// Visiteur → Vylox à droite, rond adverse à GAUCHE
const POSITIONS = {
  home: { cx: 1090, cy: 500, r: 110 },
  away: { cx: 350,  cy: 500, r: 110 },
};

async function downloadBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(res.data);
}

/**
 * Prépare le logo adverse : le resize en cercle, retourne un buffer RGBA PNG
 */
async function prepareLogoCircle(logoUrl, radius) {
  const size     = radius * 2;
  const logoBuf  = await downloadBuffer(logoUrl);

  // Resize le logo en carré
  const resized = await sharp(logoBuf)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();

  // Créer un masque circulaire SVG
  const circleMask = `<svg width="${size}" height="${size}">
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
  </svg>`;

  // Appliquer le masque circulaire
  const circular = await sharp(resized)
    .composite([{ input: Buffer.from(circleMask), blend: 'dest-in' }])
    .png()
    .toBuffer();

  return circular;
}

/**
 * Compose le logo adverse dans chaque frame du GIF
 * Retourne un Buffer GIF animé
 */
async function composeLogo(gifUrl, logoUrl, isHome) {
  try {
    const pos = isHome ? POSITIONS.home : POSITIONS.away;

    // Télécharger le GIF
    const gifBuffer = await downloadBuffer(gifUrl);

    // Préparer le logo en cercle
    const logoCircle = await prepareLogoCircle(logoUrl, pos.r);
    const logoSharp  = sharp(logoCircle).raw().toBuffer({ resolveWithObject: true });
    const { data: logoData, info: logoInfo } = await logoSharp;

    // Lire le GIF
    const gif = await GifUtil.read(gifBuffer);

    // Composer le logo sur chaque frame
    const newFrames = [];
    for (const frame of gif.frames) {
      // Convertir la frame en buffer PNG via sharp
      const frameWidth  = frame.bitmap.width;
      const frameHeight = frame.bitmap.height;

      // frame.bitmap.data est RGBA
      const frameBuf = await sharp(frame.bitmap.data, {
        raw: { width: frameWidth, height: frameHeight, channels: 4 }
      })
        .composite([{
          input: logoCircle,
          left: Math.round(pos.cx - pos.r),
          top:  Math.round(pos.cy - pos.r),
        }])
        .raw()
        .toBuffer();

      const newBitmap = new BitmapImage(frameWidth, frameHeight, frameBuf);
      const newFrame  = new GifFrame(newBitmap, {
        delayCentisecs: frame.delayCentisecs,
        disposalMethod: frame.disposalMethod,
      });
      newFrames.push(newFrame);
    }

    // Encoder le nouveau GIF
    const codec    = new GifCodec();
    const newGif   = await codec.encodeGif(newFrames, { loops: 0 });
    return newGif.buffer;

  } catch (err) {
    console.error('composeLogo error:', err.message);
    return null;
  }
}

module.exports = { composeLogo };
