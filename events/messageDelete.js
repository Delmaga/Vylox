const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/database');
const { getLogMessageGif } = require('../utils/assets');

module.exports = {
  name: 'messageDelete',
  async execute(msg, client) {
    if (msg.author?.bot) return;
    if (!msg.guild) return;

    const config = getConfig(msg.guild.id);
    if (!config?.log_message) return;
    const logCh = msg.guild.channels.cache.get(config.log_message);
    if (!logCh || !msg.author) return;

    // Infos sur la réponse éventuelle
    let replyInfo = '';
    if (msg.reference) {
      try {
        const replied = await msg.channel.messages.fetch(msg.reference.messageId).catch(() => null);
        if (replied) replyInfo = `<@${replied.author.id}> (\`${replied.author.tag}\`)`;
      } catch {}
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF2244)
      .setTitle('🗑️  Message supprimé')
      .setThumbnail(msg.author.displayAvatarURL())
      .addFields(
        { name: '👤 Auteur',     value: `<@${msg.author.id}> \`${msg.author.tag}\``, inline: true },
        { name: '📢 Salon',      value: `<#${msg.channelId}>`, inline: true },
        { name: '🕐 Date/Heure', value: `<t:${Math.floor(msg.createdTimestamp/1000)}:F>`, inline: false },
      );

    if (replyInfo) embed.addFields({ name: '↩️ Était en réponse à', value: replyInfo });
    embed.addFields({ name: '📝 Contenu', value: (msg.content || '*Aucun contenu texte*').substring(0, 1020) });

    if (msg.attachments.size) {
      embed.addFields({ name: '📎 Fichiers', value: [...msg.attachments.values()].map(a => a.name).join('\n') });
    }

    embed.setImage(getLogMessageGif()).setTimestamp();
    await logCh.send({ embeds: [embed] }).catch(console.error);
  }
};
