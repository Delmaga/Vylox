const { getConfig } = require('../utils/database');
const { logMessage } = require('../utils/embeds');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg, client) {
    if (newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    const config = getConfig(newMsg.guild?.id);
    if (!config?.log_message) return;
    const logCh = newMsg.guild.channels.cache.get(config.log_message);
    if (!logCh) return;
    await logCh.send({ embeds: [logMessage('edit', newMsg, oldMsg.content)] }).catch(console.error);
  }
};
