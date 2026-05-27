require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { initDatabase } = require('./utils/database');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.commands = new Collection();
initDatabase();
loadCommands(client);
client.removeAllListeners(); // Eviter les doublons
loadEvents(client);

client.once('ready', async () => {
  // Auto-deploy slash commands avec juste le token
  const commands = [];
  function readDir(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) readDir(full);
      else if (item.endsWith('.js')) {
        const cmd = require(full);
        if (cmd.data && cmd.execute) commands.push(cmd.data.toJSON());
      }
    }
  }
  readDir(path.join(__dirname, 'commands'));

  try {
    const rest = new REST().setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ ${commands.length} commandes déployées globalement`);
  } catch (e) {
    console.error('❌ Erreur deploy:', e);
  }
});

client.login(process.env.TOKEN);
