const { PermissionFlagsBits } = require('discord.js');
const { isBypassed } = require('./database');

// ╔══════════════════════════════════════════╗
// ║  ROLE STAFF — Mettre l'ID du rôle ici   ║
// ╚══════════════════════════════════════════╝
const STAFF_ROLE_ID = '1387216243978797267';

const { error } = require('./embeds');

function isAdmin(member) {
  if (!member) return false;

  // Vrais admins Discord
  if (member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;

  // Rôle staff configuré
  if (STAFF_ROLE_ID !== '1387216243978797267' && member.roles.cache.has(STAFF_ROLE_ID)) return true;

  // Bypass list
  return isBypassed(member.guild.id, member.id, member.roles.cache.map(r => r.id));
}

async function requireAdmin(interaction) {
  if (!isAdmin(interaction.member)) {
    await interaction.reply({
      embeds: [error('Accès refusé', 'Tu n\'as pas la permission d\'utiliser cette commande.')],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

module.exports = { isAdmin, requireAdmin, STAFF_ROLE_ID };
