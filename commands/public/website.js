const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig, setConfig } = require('../../utils/database');
const { requireAdmin } = require('../../utils/permissions');
const { error, success } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('website')
    .setDescription('Afficher ou configurer le site web')
    .addSubcommand(s => s.setName('show').setDescription('Afficher le site web'))
    .addSubcommand(s => s.setName('config').setDescription('Configurer (Admin)')
      .addStringOption(o => o.setName('url').setDescription('URL du site').setRequired(true))
      .addStringOption(o => o.setName('image').setDescription('URL image bannière').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'config') {
      if (!await requireAdmin(interaction)) return;
      const url = interaction.options.getString('url');
      const img = interaction.options.getString('image');
      setConfig(gid, 'website_url', url);
      if (img) setConfig(gid, 'website_image', img);
      return interaction.reply({ embeds: [success('Site web configuré !', `> **${url}**`)], ephemeral: true });
    }

    const config = getConfig(gid);
    if (!config.website_url) return interaction.reply({ embeds: [error('Non configuré', 'Un admin peut utiliser `/website config`.')], ephemeral: true });

    const embed = new EmbedBuilder().setColor(0xFF6BB5).setTitle('🌐  Vylox Esport — Site Web')
      .setDescription(`> Toutes les infos sur notre site officiel !\n> Actualités, équipe, tournois...\n\n> 🔗 **[Visiter le site](${config.website_url})**`)
      .setURL(config.website_url).setTimestamp().setFooter({ text: 'Vylox Esport • Website' });
    if (config.website_image) embed.setImage(config.website_image);
    await interaction.reply({ embeds: [embed] });
  }
};
