const { PermissionFlagsBits } = require('discord.js');
const { isBypassed } = require('./database');
const { error } = require('./embeds');

function isAdmin(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return isBypassed(member.guild.id, member.id, member.roles.cache.map(r => r.id));
}

async function requireAdmin(interaction) {
  if (!isAdmin(interaction.member)) {
    await interaction.reply({ embeds: [error('Accès refusé', 'Tu n\'as pas la permission d\'utiliser cette commande.')], ephemeral: true });
    return false;
  }
  return true;
}

module.exports = { isAdmin, requireAdmin };
