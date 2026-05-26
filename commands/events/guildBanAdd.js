const { AuditLogEvent } = require('discord.js');
const { getConfig } = require('../utils/database');
const { logMod } = require('../utils/embeds');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const config = getConfig(ban.guild.id);
    if (!config.log_moderation) return;
    const logCh = ban.guild.channels.cache.get(config.log_moderation);
    if (!logCh) return;
    let mod = { id: '0', tag: 'Inconnu' }, reason = 'Aucune raison';
    try {
      await new Promise(r => setTimeout(r, 800));
      const logs  = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = logs.entries.first();
      if (entry?.target?.id === ban.user.id) { mod = entry.executor; reason = entry.reason || reason; }
    } catch {}
    await logCh.send({ embeds: [logMod('ban', ban.user, mod, reason)] }).catch(console.error);
  }
};
