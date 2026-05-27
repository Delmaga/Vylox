const { EmbedBuilder } = require('discord.js');
const { getConfig, isLienEnabled } = require('../utils/database');
const { getLogLienGif } = require('../utils/assets');

const URL_REGEX = /https?:\/\/[^\s]+|discord\.gg\/[^\s]+|www\.[^\s]+/gi;

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;

    // Vérification des liens
    const hasLink = URL_REGEX.test(message.content);
    URL_REGEX.lastIndex = 0;

    if (hasLink) {
      const guildId   = message.guild.id;
      const channelId = message.channel.id;
      const config    = getConfig(guildId);

      // Vérifier si les liens sont désactivés dans ce salon
      if (!isLienEnabled(guildId, channelId)) {
        // Supprimer le message
        await message.delete().catch(() => {});

        // Avertir l'utilisateur
        const warn = await message.channel.send({
          content: `> ❌ <@${message.author.id}> Les liens ne sont pas autorisés dans ce salon ! / Links are not allowed in this channel!`
        });
        setTimeout(() => warn.delete().catch(() => {}), 5000);

        // Log
        if (config.log_lien) {
          const logCh = message.guild.channels.cache.get(config.log_lien);
          if (logCh) {
            const links = message.content.match(URL_REGEX) || [];
            const embed = new EmbedBuilder()
              .setColor(0xFF4444)
              .setTitle('🔗  Lien bloqué')
              .setThumbnail(message.author.displayAvatarURL())
              .addFields(
                { name: '👤 Utilisateur', value: `<@${message.author.id}> \`${message.author.tag}\``, inline: true },
                { name: '📢 Salon',       value: `<#${channelId}>`, inline: true },
                { name: '🕐 Date/Heure', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false },
                { name: '🔗 Lien(s) tenté(s)', value: links.map(l => `\`${l}\``).join('\n').substring(0, 1020) },
                { name: '💬 Message complet', value: message.content.substring(0, 1020) },
              )
              .setImage(getLogLienGif())
              .setTimestamp();
            await logCh.send({ embeds: [embed] }).catch(console.error);
          }
        }
      }
    }
  }
};
