// URLs Catbox — GIFs Canva de Vylox Esport
const GIFS = {
  welcome:          'https://files.catbox.moe/avola4.gif',
  tickets:          'https://files.catbox.moe/q7xo6f.gif',
  match_home:       'https://files.catbox.moe/2zcoog.gif',
  match_away:       'https://files.catbox.moe/v0wzud.gif',
  showmatch_home:   'https://files.catbox.moe/ig6fvx.gif',
  showmatch_away:   'https://files.catbox.moe/ajtxgo.gif',
  cup: {
    home: {
      50:  'https://files.catbox.moe/5excjg.gif',
      100: 'https://files.catbox.moe/z87q43.gif',
      150: 'https://files.catbox.moe/441wzi.gif',
      200: 'https://files.catbox.moe/qagmys.gif',
      250: 'https://files.catbox.moe/xw5n4z.gif',
      300: 'https://files.catbox.moe/qji6dd.gif',
    },
    away: {
      50:  'https://files.catbox.moe/k77s6f.gif',
      100: 'https://files.catbox.moe/gngrsu.gif',
      150: 'https://files.catbox.moe/arc6uy.gif',
      200: 'https://files.catbox.moe/3771ui.gif',
      250: 'https://files.catbox.moe/p4fhvh.gif',
      300: 'https://files.catbox.moe/d9gp5t.gif',
    }
  }
};

function getMatchGif(isHome)     { return isHome ? GIFS.match_home : GIFS.match_away; }
function getShowMatchGif(isHome) { return isHome ? GIFS.showmatch_home : GIFS.showmatch_away; }
function getWelcomeGif()         { return GIFS.welcome; }
function getTicketsGif()         { return GIFS.tickets; }
function getLogo()               { return 'https://files.catbox.moe/biv4bo.gif'; } // logo Vylox

function getCupGif(isHome, priceStr) {
  const PALIERS = [50, 100, 150, 200, 250, 300];
  const num = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
  let best = PALIERS[0], minDiff = Math.abs(num - PALIERS[0]);
  for (const p of PALIERS) { const d = Math.abs(num - p); if (d < minDiff) { minDiff = d; best = p; } }
  return isHome ? GIFS.cup.home[best] : GIFS.cup.away[best];
}

module.exports = { getMatchGif, getShowMatchGif, getCupGif, getWelcomeGif, getTicketsGif, getLogo };
