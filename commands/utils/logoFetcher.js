const axios = require('axios');

async function resolveLogoSource(input, guild) {
  if (!input) return null;

  // URL directe
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }

  // ID de message Discord
  if (/^\d{17,19}$/.test(input) && guild) {
    const channels = guild.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      try {
        const msg = await channel.messages.fetch(input);
        if (!msg) continue;
        const att = msg.attachments.find(a => a.contentType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(a.url));
        if (att) return att.url;
        for (const emb of msg.embeds) {
          if (emb.image?.url) return emb.image.url;
          if (emb.thumbnail?.url) return emb.thumbnail.url;
        }
      } catch {}
    }
  }

  return null;
}

module.exports = { resolveLogoSource };
