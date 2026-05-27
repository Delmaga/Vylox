const { EmbedBuilder } = require('discord.js');
const { getConfig, startVocalSession, endVocalSession, getVocalSession } = require('../utils/database');
const { getLogVocalGif } = require('../utils/assets');

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guild  = oldState.guild || newState.guild;
    const config = getConfig(guild.id);
    if (!config.log_vocal) return;
    const logCh = guild.channels.cache.get(config.log_vocal);
    if (!logCh) return;
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const now = Math.floor(Date.now() / 1000);
    let embed;

    if (!oldState.channelId && newState.channelId) {
      // Connexion
      startVocalSession(guild.id, member.id, newState.channelId);
      embed = new EmbedBuilder()
        .setColor(0x44FF99)
        .setTitle('🟢  Vocal — Connexion')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: '👤 Membre',     value: `<@${member.id}> \`${member.user.tag}\``, inline: true },
          { name: '📢 Salon',      value: `<#${newState.channelId}>`, inline: true },
          { name: '🕐 Connecté à', value: `<t:${now}:F>`, inline: false },
        )
        .setImage(getLogVocalGif())
        .setTimestamp();

    } else if (oldState.channelId && !newState.channelId) {
      // Déconnexion
      const session = endVocalSession(guild.id, member.id, oldState.channelId);
      const duration = session ? formatDuration(session.duration) : 'Inconnu';
      const joinedAt = session ? Math.floor(session.joined_at / 1000) : null;

      embed = new EmbedBuilder()
        .setColor(0xFF2244)
        .setTitle('🔴  Vocal — Déconnexion')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: '👤 Membre',         value: `<@${member.id}> \`${member.user.tag}\``, inline: true },
          { name: '📢 Salon quitté',   value: `<#${oldState.channelId}>`, inline: true },
          { name: '🕐 Déconnecté à',  value: `<t:${now}:F>`, inline: false },
          { name: '⏱️ Connecté à',     value: joinedAt ? `<t:${joinedAt}:F>` : 'Inconnu', inline: true },
          { name: '⏳ Durée',          value: duration, inline: true },
        )
        .setImage(getLogVocalGif())
        .setTimestamp();

    } else if (oldState.channelId !== newState.channelId) {
      // Déplacement
      endVocalSession(guild.id, member.id, oldState.channelId);
      startVocalSession(guild.id, member.id, newState.channelId);

      embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🔀  Vocal — Déplacement')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: '👤 Membre',    value: `<@${member.id}> \`${member.user.tag}\``, inline: true },
          { name: '🕐 Date',      value: `<t:${now}:F>`, inline: true },
          { name: '📤 Depuis',    value: `<#${oldState.channelId}>`, inline: true },
          { name: '📥 Vers',      value: `<#${newState.channelId}>`, inline: true },
        )
        .setImage(getLogVocalGif())
        .setTimestamp();
    }

    if (embed) await logCh.send({ embeds: [embed] }).catch(console.error);
  }
};
