require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

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

const rest = new REST().setToken(process.env.TOKEN);
(async () => {
  try {
    console.log(`🔄 Déploiement de ${commands.length} commandes...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log(`✅ ${data.length} commandes déployées !`);
  } catch (e) { console.error('❌', e); }
})();
