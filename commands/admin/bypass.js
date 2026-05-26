const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addBypass, removeBypass, getBypassList } = require('../../utils/database');
const { success, error, info } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bypass')
    .setDescription('Gérer les utilisateurs/rôles exemptés')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('add').setDescription('Ajouter à la liste blanche')
      .addMentionableOption(o => o.setName('cible').setDescription('Utilisateur ou rôle').setRequired(true)))
    .addSubcommand(s => s.setName('sup').setDescription('Retirer de la liste blanche')
      .addMentionableOption(o => o.setName('cible').setDescription('Utilisateur ou rôle').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('Voir la liste des bypass')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ embeds: [error('Accès refusé', 'Seul un vrai administrateur peut gérer les bypass.')], ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'add') {
      const t    = interaction.options.getMentionable('cible');
      const type = t.constructor?.name === 'Role' ? 'role' : 'user';
      const ok   = addBypass(gid, t.id, type);
      await interaction.reply({ embeds: [ok ? success('Bypass ajouté !', `> ${type === 'role' ? `<@&${t.id}>` : `<@${t.id}>`} peut maintenant utiliser les commandes admin.`) : error('Déjà présent', 'Cette cible est déjà dans la liste blanche.')], ephemeral: true });
    }
    else if (sub === 'sup') {
      const t  = interaction.options.getMentionable('cible');
      const ok = removeBypass(gid, t.id);
      await interaction.reply({ embeds: [ok ? success('Retiré !', '> La cible a été retirée de la liste blanche.') : error('Introuvable', 'Cette cible n\'est pas dans la liste.')], ephemeral: true });
    }
    else if (sub === 'list') {
      const list = getBypassList(gid);
      if (!list.length) return interaction.reply({ embeds: [info('Liste vide', 'Aucun bypass actif.')], ephemeral: true });
      const lines = list.map(b => `> ${b.target_type === 'role' ? `<@&${b.target_id}> (rôle)` : `<@${b.target_id}> (utilisateur)`}`);
      await interaction.reply({ embeds: [info('Liste des bypass', lines.join('\n'))], ephemeral: true });
    }
  }
};
