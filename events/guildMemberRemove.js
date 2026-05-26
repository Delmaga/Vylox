const { AuditLogEvent } = require('discord.js');
const { getConfig } = require('../utils/database');
const { logMod } = require('../utils/embeds');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const config = getConfig(member.guild.id);
    if (!config.log_moderation) return;
    const logCh = member.guild.channels.cache.get(config.log_moderation);
    if (!logCh) return;
    try {
      await new Promise(r => setTimeout(r, 800));
      const logs  = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
      const entry = logs.entries.first();
      if (entry?.target?.id === member.user.id && Date.now() - entry.createdTimestamp < 5000) {
        await logCh.send({ embeds: [logMod('kick', member.user, entry.executor, entry.reason || 'Aucune raison')] }).catch(console.error);
      }
    } catch {}
  }
};
