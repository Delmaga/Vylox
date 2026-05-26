const { getConfig } = require('../utils/database');
const { logMessage } = require('../utils/embeds');

module.exports = {
  name: 'messageDelete',
  async execute(msg, client) {
    if (msg.author?.bot) return;
    if (!msg.guild) return;
    const config = getConfig(msg.guild.id);
    if (!config?.log_message) return;
    const logCh = msg.guild.channels.cache.get(config.log_message);
    if (!logCh || !msg.author) return;
    await logCh.send({ embeds: [logMessage('delete', msg, null)] }).catch(console.error);
  }
};
