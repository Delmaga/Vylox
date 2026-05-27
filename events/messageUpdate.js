const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/database');
const { getLogMessageGif } = require('../utils/assets');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg, client) {
    if (newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    if (!newMsg.guild) return;

    const config = getConfig(newMsg.guild.id);
    if (!config?.log_message) return;
    const logCh = newMsg.guild.channels.cache.get(config.log_message);
    if (!logCh) return;

    // Infos sur la réponse éventuelle
    let replyInfo = '';
    if (newMsg.reference) {
      try {
        const replied = await newMsg.channel.messages.fetch(newMsg.reference.messageId);
        replyInfo = `<@${replied.author.id}> (\`${replied.author.tag}\`)`;
      } catch {}
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle('✏️  Message modifié')
      .setThumbnail(newMsg.author.displayAvatarURL())
      .addFields(
        { name: '👤 Auteur',    value: `<@${newMsg.author.id}> \`${newMsg.author.tag}\``, inline: true },
        { name: '📢 Salon',     value: `<#${newMsg.channelId}>`, inline: true },
        { name: '🕐 Date/Heure',value: `<t:${Math.floor(newMsg.editedTimestamp/1000)}:F>`, inline: false },
      );

    if (replyInfo) embed.addFields({ name: '↩️ En réponse à', value: replyInfo, inline: false });

    embed.addFields(
      { name: '📝 Avant', value: (oldMsg.content || '*Inconnu*').substring(0, 1020) },
      { name: '📝 Après', value: (newMsg.content || '*Vide*').substring(0, 1020) },
      { name: '🔗 Lien',  value: `[Aller au message](${newMsg.url})` },
    )
    .setImage(getLogMessageGif())
    .setTimestamp();

    await logCh.send({ embeds: [embed] }).catch(console.error);
  }
};
