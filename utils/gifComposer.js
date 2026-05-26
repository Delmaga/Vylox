const sharp = require('sharp');
const axios = require('axios');

// Positions des ronds adverses sur les GIFs 1920x1080
// Domicile → rond adverse à DROITE
// Visiteur → rond adverse à GAUCHE
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

/**
 * Extrait la première frame d'un GIF et colle le logo dans le rond
 * Retourne un Buffer PNG
 */
async function composeLogo(gifUrl, logoUrl, isHome) {
  try {
    const pos  = isHome ? POSITIONS.home : POSITIONS.away;
    const size = pos.r * 2;
    const left = Math.round(pos.cx - pos.r);
    const top  = Math.round(pos.cy - pos.r);

    // Télécharger en parallèle
    const [gifBuffer, logoBuffer] = await Promise.all([
      downloadBuffer(gifUrl),
      downloadBuffer(logoUrl),
    ]);

    // Extraire première frame du GIF → PNG via sharp
    const framePng = await sharp(gifBuffer, { pages: 1 })
      .png()
      .toBuffer();

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

    // Coller le logo sur la frame
    const result = await sharp(framePng)
      .composite([{ input: logoCircle, left, top }])
      .png()
      .toBuffer();

    console.log(`✅ Image composée: ${result.length} bytes`);
    return result;

  } catch (err) {
    console.error('composeLogo error:', err.message);
    return null;
  }
}

module.exports = { composeLogo };
