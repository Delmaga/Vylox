const sharp = require('sharp');
const axios = require('axios');
const path  = require('path');

// Coordonnées des ronds détectées pixel par pixel sur chaque image
const POSITIONS = {
  // Match: rayon 139px
  'Match_Dom': { cx: 1264, cy: 569, r: 135 },
  'Match_Vis': { cx: 422,  cy: 566, r: 135 },
  // Showmatch: rayon 108px
  'Show_Dom':  { cx: 1266, cy: 563, r: 104 },
  'Show_Vis':  { cx: 423,  cy: 564, r: 104 },
  // Cup Domicile: rayon 108px
  'Cup_50_Dom':  { cx: 1266, cy: 564, r: 104 },
  'Cup_100_Dom': { cx: 1265, cy: 565, r: 104 },
  'Cup_150_Dom': { cx: 1269, cy: 567, r: 104 },
  'Cup_200_Dom': { cx: 1268, cy: 564, r: 104 },
  'Cup_250_Dom': { cx: 1267, cy: 564, r: 104 },
  'Cup_300_Dom': { cx: 1267, cy: 564, r: 104 },
  // Cup Visiteur: rayon 108px
  'Cup_50_Vis':  { cx: 424, cy: 565, r: 104 },
  'Cup_100_Vis': { cx: 423, cy: 565, r: 104 },
  'Cup_150_Vis': { cx: 423, cy: 564, r: 104 },
  'Cup_200_Vis': { cx: 424, cy: 563, r: 104 },
  'Cup_250_Vis': { cx: 423, cy: 565, r: 104 },
  'Cup_300_Vis': { cx: 422, cy: 564, r: 104 },
};

const ASSETS = path.join(__dirname, '../assets');

async function downloadBuffer(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VyloxBot/1.0)' }
  });
  return Buffer.from(res.data);
}

/**
 * Compose le logo adverse dans le rond de l'image de base
 * @param {string} assetName - ex: 'Match_Dom', 'Cup_150_Vis'
 * @param {string} logoUrl   - URL du logo adverse
 * @returns {Buffer} PNG buffer
 */
async function composeLogo(assetName, logoUrl) {
  try {
    const pos = POSITIONS[assetName];
    if (!pos) throw new Error(`Position inconnue pour ${assetName}`);

    const size = pos.r * 2;
    const left = Math.round(pos.cx - pos.r);
    const top  = Math.round(pos.cy - pos.r);

    // Charger l'image de base depuis les assets locaux
    const basePath   = path.join(ASSETS, `${assetName}.png`);
    const logoBuffer = await downloadBuffer(logoUrl);

    // Logo circulaire
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

    // Coller sur l'image de base
    const result = await sharp(basePath)
      .composite([{ input: logoCircle, left, top }])
      .png()
      .toBuffer();

    console.log(`✅ ${assetName}: logo collé cx=${pos.cx}, cy=${pos.cy}, r=${pos.r}`);
    return result;

  } catch (err) {
    console.error(`composeLogo error (${assetName}):`, err.message);
    console.error(`  Stack:`, err.stack?.split('\n')[1]);
    console.error(`  basePath exists:`, require('fs').existsSync(require('path').join(__dirname, '../assets', assetName + '.png')));
    return null;
  }
}

module.exports = { composeLogo };
