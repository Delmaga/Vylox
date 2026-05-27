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
      log_lien TEXT,
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

    CREATE TABLE IF NOT EXISTS lien_config (
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      enabled INTEGER DEFAULT 0,
      PRIMARY KEY (guild_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS vocal_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      left_at INTEGER,
      duration INTEGER
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

// Lien config
function setLienConfig(guildId, channelId, enabled) {
  db.prepare('INSERT OR REPLACE INTO lien_config (guild_id, channel_id, enabled) VALUES (?, ?, ?)').run(guildId, channelId, enabled ? 1 : 0);
}
function getLienConfig(guildId, channelId) {
  return db.prepare('SELECT * FROM lien_config WHERE guild_id=? AND channel_id=?').get(guildId, channelId);
}
function isLienEnabled(guildId, channelId) {
  const row = getLienConfig(guildId, channelId);
  return row ? row.enabled === 1 : true; // Par défaut activé
}

// Vocal sessions
function startVocalSession(guildId, userId, channelId) {
  db.prepare('INSERT INTO vocal_sessions (guild_id, user_id, channel_id, joined_at) VALUES (?, ?, ?, ?)').run(guildId, userId, channelId, Date.now());
}
function endVocalSession(guildId, userId, channelId) {
  const session = db.prepare('SELECT * FROM vocal_sessions WHERE guild_id=? AND user_id=? AND channel_id=? AND left_at IS NULL ORDER BY joined_at DESC LIMIT 1').get(guildId, userId, channelId);
  if (session) {
    const duration = Math.floor((Date.now() - session.joined_at) / 1000);
    db.prepare('UPDATE vocal_sessions SET left_at=?, duration=? WHERE id=?').run(Date.now(), duration, session.id);
    return { ...session, duration };
  }
  return null;
}
function getVocalSession(guildId, userId) {
  return db.prepare('SELECT * FROM vocal_sessions WHERE guild_id=? AND user_id=? AND left_at IS NULL ORDER BY joined_at DESC LIMIT 1').get(guildId, userId);
}

module.exports = {
  initDatabase, getConfig, setConfig,
  getTicketCategories, addTicketCategory, editTicketCategory, deleteTicketCategory,
  createTicket, getTicket, updateTicket,
  addBypass, removeBypass, isBypassed, getBypassList,
  setLienConfig, getLienConfig, isLienEnabled,
  startVocalSession, endVocalSession, getVocalSession,
};
