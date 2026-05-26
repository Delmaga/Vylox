const Jimp = require('jimp');
const axios = require('axios');

// Coordonnées des ronds sur les GIFs (1440x810px)
// Domicile → logo Vylox à gauche, rond adverse à DROITE
// Visiteur → logo Vylox à droite, rond adverse à GAUCHE
const POSITIONS = {
  home: { x: 990, y: 395, r: 115 },  // rond droit (adverse)
  away: { x: 255, y: 395, r: 115 },  // rond gauche (adverse)
};

/**
 * Télécharge une image depuis une URL et retourne un Buffer
 */
async function downloadImage(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
  return Buffer.from(res.data);
}

/**
 * Compose le logo adverse dans le rond du GIF
 * Retourne un Buffer PNG (frame statique avec logo)
 * Note: Jimp ne supporte pas l'écriture de GIF animé,
 * on envoie donc la première frame en PNG avec le logo collé
 */
async function composeLogo(gifUrl, logoUrl, isHome) {
  try {
    const pos = isHome ? POSITIONS.home : POSITIONS.away;

    // Télécharger le GIF et le logo
    const [gifBuffer, logoBuffer] = await Promise.all([
      downloadImage(gifUrl),
      downloadImage(logoUrl),
    ]);

    // Charger la première frame du GIF avec Jimp
    const base = await Jimp.read(gifBuffer);

    // Charger et redimensionner le logo pour qu'il rentre dans le rond
    const size   = pos.r * 2;
    const logo   = await Jimp.read(logoBuffer);
    logo.resize(size, size);

    // Créer un masque circulaire
    const mask = new Jimp(size, size, 0x00000000);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = x - pos.r, cy = y - pos.r;
        if (cx * cx + cy * cy <= pos.r * pos.r) {
          mask.setPixelColor(0xFFFFFFFF, x, y);
        }
      }
    }
    logo.mask(mask, 0, 0);

    // Coller le logo sur la frame
    base.composite(logo, pos.x - pos.r, pos.y - pos.r);

    // Retourner en PNG buffer
    return await base.getBufferAsync(Jimp.MIME_PNG);
  } catch (err) {
    console.error('composeLogo error:', err.message);
    return null;
  }
}

module.exports = { composeLogo };
