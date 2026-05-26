const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  function readDir(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) readDir(full);
      else if (item.endsWith('.js')) {
        const cmd = require(full);
        if (cmd.data && cmd.execute) {
          client.commands.set(cmd.data.name, cmd);
          console.log(`  ✅ /${cmd.data.name}`);
        }
      }
    }
  }
  readDir(path.join(__dirname, '../commands'));
  console.log(`\n📦 ${client.commands.size} commandes chargées\n`);
}

module.exports = { loadCommands };
