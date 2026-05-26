const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { setConfig, getConfig } = require('../../utils/database');
const { success, error, welcome: welcomeEmbed } = require('../../utils/embeds');
const { getWelcomeGif } = require('../../utils/assets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Gestion du système de bienvenue')
    .addSubcommand(s => s.setName('setup').setDescription('Configurer le salon et le rôle')
      .addChannelOption(o => o.setName('salon').setDescription('Salon de bienvenue').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Rôle auto attribué').setRequired(false))
    )
    .addSubcommand(s => s.setName('test').setDescription('Tester le message de bienvenue')),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('salon');
      const role    = interaction.options.getRole('role');
      setConfig(gid, 'welcome_channel', channel.id);
      if (role) setConfig(gid, 'welcome_role', role.id);
      await interaction.reply({ embeds: [success('Bienvenue configuré !', `> 📢 Salon : <#${channel.id}>${role ? `\n> 🎭 Rôle : <@&${role.id}>` : ''}`)], ephemeral: true });
    }
    else if (sub === 'test') {
      const config = getConfig(gid);
      if (!config.welcome_channel) return interaction.reply({ embeds: [error('Non configuré', 'Utilise `/welcome setup` d\'abord.')], ephemeral: true });
      const channel = interaction.guild.channels.cache.get(config.welcome_channel);
      if (channel) {
        const embed = welcomeEmbed(interaction.member);
        embed.setImage(getWelcomeGif());
        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });
      }
      await interaction.reply({ embeds: [success('Aperçu envoyé !', `> Envoyé dans <#${config.welcome_channel}>`)], ephemeral: true });
    }
  }
};
