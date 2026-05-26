const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'vylox.db'));

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      guild_id TEXT PRIMARY KEY,
      welcome_channel TEXT,
      welcome_role TEXT,
      ticket_channel TEXT,
      ticket_category TEXT,
      ticket_ping_role TEXT,
      log_vocal TEXT,
      log_message TEXT,
      log_tickets TEXT,
      log_moderation TEXT,
      twitch_url TEXT,
      twitch_image TEXT,
      website_url TEXT,
      website_image TEXT,
      pub_message TEXT,
      pub_image TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      label TEXT NOT NULL,
      emoji TEXT DEFAULT '🎫',
      description TEXT,
      UNIQUE(guild_id, label)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'open',
      taken_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS bypass (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      UNIQUE(guild_id, target_id)
    );
  `);
  console.log('✅ Base de données prête');
}

function getConfig(guildId) {
  let c = db.prepare('SELECT * FROM config WHERE guild_id = ?').get(guildId);
  if (!c) { db.prepare('INSERT INTO config (guild_id) VALUES (?)').run(guildId); c = db.prepare('SELECT * FROM config WHERE guild_id = ?').get(guildId); }
  return c;
}
function setConfig(guildId, key, value) { getConfig(guildId); db.prepare(`UPDATE config SET ${key} = ? WHERE guild_id = ?`).run(value, guildId); }

function getTicketCategories(guildId) { return db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ?').all(guildId); }
function addTicketCategory(guildId, label, emoji, description) {
  try { db.prepare('INSERT INTO ticket_categories (guild_id, label, emoji, description) VALUES (?, ?, ?, ?)').run(guildId, label, emoji, description); return true; }
  catch { return false; }
}
function editTicketCategory(id, label, emoji, description) { db.prepare('UPDATE ticket_categories SET label=?,emoji=?,description=? WHERE id=?').run(label, emoji, description, id); }
function deleteTicketCategory(id) { db.prepare('DELETE FROM ticket_categories WHERE id=?').run(id); }

function createTicket(guildId, channelId, userId, category, reason) { db.prepare('INSERT INTO tickets (guild_id,channel_id,user_id,category,reason) VALUES (?,?,?,?,?)').run(guildId, channelId, userId, category, reason); }
function getTicket(channelId) { return db.prepare('SELECT * FROM tickets WHERE channel_id=?').get(channelId); }
function updateTicket(channelId, data) {
  const keys = Object.keys(data).map(k => `${k}=?`).join(',');
  db.prepare(`UPDATE tickets SET ${keys} WHERE channel_id=?`).run(...Object.values(data), channelId);
}

function addBypass(guildId, targetId, targetType) {
  try { db.prepare('INSERT INTO bypass (guild_id,target_id,target_type) VALUES (?,?,?)').run(guildId, targetId, targetType); return true; }
  catch { return false; }
}
function removeBypass(guildId, targetId) { return db.prepare('DELETE FROM bypass WHERE guild_id=? AND target_id=?').run(guildId, targetId).changes > 0; }
function isBypassed(guildId, userId, roleIds = []) {
  if (db.prepare('SELECT 1 FROM bypass WHERE guild_id=? AND target_id=? AND target_type="user"').get(guildId, userId)) return true;
  for (const r of roleIds) if (db.prepare('SELECT 1 FROM bypass WHERE guild_id=? AND target_id=? AND target_type="role"').get(guildId, r)) return true;
  return false;
}
function getBypassList(guildId) { return db.prepare('SELECT * FROM bypass WHERE guild_id=?').all(guildId); }

module.exports = {
  initDatabase, getConfig, setConfig,
  getTicketCategories, addTicketCategory, editTicketCategory, deleteTicketCategory,
  createTicket, getTicket, updateTicket,
  addBypass, removeBypass, isBypassed, getBypassList,
};
