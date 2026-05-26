const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig, setConfig } = require('../../utils/database');
const { requireAdmin } = require('../../utils/permissions');
const { error, success } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('twitch')
    .setDescription('Afficher ou configurer le Twitch')
    .addSubcommand(s => s.setName('show').setDescription('Afficher le lien Twitch'))
    .addSubcommand(s => s.setName('config').setDescription('Configurer (Admin)')
      .addStringOption(o => o.setName('url').setDescription('URL Twitch').setRequired(true))
      .addStringOption(o => o.setName('image').setDescription('URL image bannière').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'config') {
      if (!await requireAdmin(interaction)) return;
      const url = interaction.options.getString('url');
      const img = interaction.options.getString('image');
      setConfig(gid, 'twitch_url', url);
      if (img) setConfig(gid, 'twitch_image', img);
      return interaction.reply({ embeds: [success('Twitch configuré !', `> **${url}**`)], ephemeral: true });
    }

    const config = getConfig(gid);
    if (!config.twitch_url) return interaction.reply({ embeds: [error('Non configuré', 'Un admin peut utiliser `/twitch config`.')], ephemeral: true });

    const embed = new EmbedBuilder().setColor(0x9146FF).setTitle('🟣  Vylox Esport — Twitch')
      .setDescription(`> Rejoins-nous en live !\n> Des parties, events et bien plus.\n\n> 🔗 **[Regarder le live](${config.twitch_url})**`)
      .setURL(config.twitch_url).setTimestamp().setFooter({ text: 'Vylox Esport • Twitch' });
    if (config.twitch_image) embed.setImage(config.twitch_image);
    await interaction.reply({ embeds: [embed] });
  }
};
