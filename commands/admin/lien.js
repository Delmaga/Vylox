const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { setLienConfig, getLienConfig } = require('../../utils/database');
const { success, info } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lien')
    .setDescription('Activer ou désactiver les liens dans ce salon')
    .addStringOption(o => o.setName('mode').setDescription('on = liens autorisés, off = liens bloqués').setRequired(true)
      .addChoices({ name: '✅ ON — Liens autorisés', value: 'on' }, { name: '❌ OFF — Liens bloqués', value: 'off' })),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    const mode      = interaction.options.getString('mode');
    const enabled   = mode === 'on';
    const guildId   = interaction.guild.id;
    const channelId = interaction.channel.id;

    setLienConfig(guildId, channelId, enabled);

    await interaction.reply({
      embeds: [success(
        `Liens ${enabled ? 'activés' : 'désactivés'} !`,
        `> Les liens sont maintenant **${enabled ? '✅ autorisés' : '❌ bloqués'}** dans <#${channelId}>.`
      )],
      ephemeral: true,
    });
  }
};
