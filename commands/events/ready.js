const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`\n╔══════════════════════════════════╗`);
    console.log(`║  🌸  ${client.user.tag} — En ligne !`);
    console.log(`╚══════════════════════════════════╝\n`);
    client.user.setPresence({ activities: [{ name: 'Vylox Esport 🌸', type: ActivityType.Watching }], status: 'online' });
  }
};
