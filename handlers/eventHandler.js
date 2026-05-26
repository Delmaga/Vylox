const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  for (const file of fs.readdirSync(path.join(__dirname, '../events')).filter(f => f.endsWith('.js'))) {
    const event = require(path.join(__dirname, '../events', file));
    if (event.once) client.once(event.name, (...a) => event.execute(...a, client));
    else client.on(event.name, (...a) => event.execute(...a, client));
    console.log(`  ✅ Event: ${event.name}`);
  }
}

module.exports = { loadEvents };
