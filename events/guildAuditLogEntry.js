const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { getConfig } = require('../utils/database');
const { getLogRoleGif, getLogPermGif, getLogSalonGif, getLogCategoryGif } = require('../utils/assets');

module.exports = {
  name: 'guildAuditLogEntryCreate',
  async execute(entry, guild, client) {
    const config = getConfig(guild.id);
    if (!config.log_moderation) return;
    const logCh = guild.channels.cache.get(config.log_moderation);
    if (!logCh) return;

    const executor = entry.executor;
    const target   = entry.target;
    const now      = Math.floor(Date.now() / 1000);
    let embed;

    // ── ROLES ──────────────────────────────────────────────────
    if (entry.action === AuditLogEvent.RoleCreate) {
      embed = new EmbedBuilder().setColor(0x44FF99).setTitle('🎭  Rôle créé')
        .addFields(
          { name: '👤 Par',         value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '🎭 Rôle créé',   value: `<@&${target.id}> \`${target.name}\``, inline: true },
          { name: '🕐 Date/Heure',  value: `<t:${now}:F>`, inline: false },
        ).setImage(getLogRoleGif()).setTimestamp();
    }

    else if (entry.action === AuditLogEvent.RoleDelete) {
      embed = new EmbedBuilder().setColor(0xFF2244).setTitle('🎭  Rôle supprimé')
        .addFields(
          { name: '👤 Par',         value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '🎭 Rôle sup.',   value: `\`${target.name}\``, inline: true },
          { name: '🕐 Date/Heure',  value: `<t:${now}:F>`, inline: false },
        ).setImage(getLogRoleGif()).setTimestamp();
    }

    else if (entry.action === AuditLogEvent.RoleUpdate) {
      const changes = entry.changes.map(c => {
        if (c.key === 'permissions') return `Permissions: \`${c.old}\` → \`${c.new}\``;
        if (c.key === 'name') return `Nom: \`${c.old}\` → \`${c.new}\``;
        if (c.key === 'color') return `Couleur: \`#${c.old?.toString(16)}\` → \`#${c.new?.toString(16)}\``;
        return `${c.key}: \`${c.old}\` → \`${c.new}\``;
      }).join('\n');
      embed = new EmbedBuilder().setColor(0xFFAA00).setTitle('🎭  Rôle modifié')
        .addFields(
          { name: '👤 Par',        value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '🎭 Rôle',       value: `<@&${target.id}> \`${target.name}\``, inline: true },
          { name: '🕐 Date/Heure', value: `<t:${now}:F>`, inline: false },
          { name: '📝 Changements', value: changes.substring(0, 1020) || 'Aucun détail' },
        ).setImage(getLogRoleGif()).setTimestamp();
    }

    // ── MEMBER ROLE UPDATE ─────────────────────────────────────
    else if (entry.action === AuditLogEvent.MemberRoleUpdate) {
      const added   = entry.changes.filter(c => c.key === '$add').flatMap(c => c.new).map(r => `<@&${r.id}>`);
      const removed = entry.changes.filter(c => c.key === '$remove').flatMap(c => c.new).map(r => `<@&${r.id}>`);
      embed = new EmbedBuilder().setColor(0xFF9900).setTitle('👤  Rôles membre modifiés')
        .addFields(
          { name: '👤 Membre',      value: `<@${target.id}>`, inline: true },
          { name: '👮 Par',         value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '🕐 Date/Heure', value: `<t:${now}:F>`, inline: false },
        );
      if (added.length)   embed.addFields({ name: '✅ Rôle(s) ajouté(s)',   value: added.join(', ') });
      if (removed.length) embed.addFields({ name: '❌ Rôle(s) retiré(s)',   value: removed.join(', ') });
      embed.setImage(getLogRoleGif()).setTimestamp();
    }

    // ── CHANNELS ───────────────────────────────────────────────
    else if (entry.action === AuditLogEvent.ChannelCreate) {
      const isCategory = target.type === 4;
      embed = new EmbedBuilder().setColor(0x44FF99).setTitle(`${isCategory ? '📁' : '📢'}  Salon${isCategory ? '/Catégorie' : ''} créé`)
        .addFields(
          { name: '👤 Par',        value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '📢 Salon',      value: `${isCategory ? '' : `<#${target.id}>`} \`${target.name}\``, inline: true },
          { name: '🕐 Date/Heure',value: `<t:${now}:F>`, inline: false },
        ).setImage(isCategory ? getLogCategoryGif() : getLogSalonGif()).setTimestamp();
    }

    else if (entry.action === AuditLogEvent.ChannelDelete) {
      const isCategory = target.type === 4;
      embed = new EmbedBuilder().setColor(0xFF2244).setTitle(`${isCategory ? '📁' : '📢'}  Salon${isCategory ? '/Catégorie' : ''} supprimé`)
        .addFields(
          { name: '👤 Par',        value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '📢 Nom',        value: `\`${target.name}\``, inline: true },
          { name: '🕐 Date/Heure',value: `<t:${now}:F>`, inline: false },
        ).setImage(isCategory ? getLogCategoryGif() : getLogSalonGif()).setTimestamp();
    }

    else if (entry.action === AuditLogEvent.ChannelUpdate) {
      const changes = entry.changes.map(c => `${c.key}: \`${c.old ?? 'N/A'}\` → \`${c.new ?? 'N/A'}\``).join('\n');
      const isCategory = target.type === 4;
      embed = new EmbedBuilder().setColor(0xFFAA00).setTitle(`${isCategory ? '📁' : '📢'}  Salon${isCategory ? '/Catégorie' : ''} modifié`)
        .addFields(
          { name: '👤 Par',         value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '📢 Salon',       value: `${isCategory ? '' : `<#${target.id}>`} \`${target.name}\``, inline: true },
          { name: '🕐 Date/Heure', value: `<t:${now}:F>`, inline: false },
          { name: '📝 Changements', value: changes.substring(0, 1020) || 'Aucun détail' },
        ).setImage(isCategory ? getLogCategoryGif() : getLogSalonGif()).setTimestamp();
    }

    // ── PERMISSIONS ────────────────────────────────────────────
    else if (entry.action === AuditLogEvent.ChannelOverwriteCreate ||
             entry.action === AuditLogEvent.ChannelOverwriteUpdate ||
             entry.action === AuditLogEvent.ChannelOverwriteDelete) {
      const actionLabel = entry.action === AuditLogEvent.ChannelOverwriteCreate ? 'ajoutée' :
                          entry.action === AuditLogEvent.ChannelOverwriteDelete ? 'supprimée' : 'modifiée';
      const changes = entry.changes.map(c => `${c.key}: \`${c.old ?? 'N/A'}\` → \`${c.new ?? 'N/A'}\``).join('\n');
      embed = new EmbedBuilder().setColor(0xFF6600).setTitle(`🔐  Permission ${actionLabel}`)
        .addFields(
          { name: '👤 Par',         value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '📢 Salon',       value: target ? `<#${target.id}>` : 'Inconnu', inline: true },
          { name: '🕐 Date/Heure', value: `<t:${now}:F>`, inline: false },
          { name: '📝 Changements', value: changes.substring(0, 1020) || 'Aucun détail' },
        ).setImage(getLogPermGif()).setTimestamp();
    }

    // ── MEMBER UPDATE ──────────────────────────────────────────
    else if (entry.action === AuditLogEvent.MemberUpdate) {
      const changes = entry.changes.map(c => `${c.key}: \`${c.old ?? 'N/A'}\` → \`${c.new ?? 'N/A'}\``).join('\n');
      if (!changes) return;
      embed = new EmbedBuilder().setColor(0xFFAA00).setTitle('👤  Membre modifié')
        .addFields(
          { name: '🎯 Membre',      value: `<@${target.id}>`, inline: true },
          { name: '👮 Par',         value: executor ? `<@${executor.id}>` : 'Inconnu', inline: true },
          { name: '🕐 Date/Heure', value: `<t:${now}:F>`, inline: false },
          { name: '📝 Changements', value: changes.substring(0, 1020) },
        ).setImage(getLogRoleGif()).setTimestamp();
    }

    if (embed) await logCh.send({ embeds: [embed] }).catch(console.error);
  }
};
