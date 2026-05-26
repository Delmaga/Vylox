const { SlashCommandBuilder } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { competition, error } = require('../../utils/embeds');
const { getShowMatchGif } = require('../../utils/assets');
const { resolveLogoSource } = require('../../utils/logoFetcher');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showmatch')
    .setDescription('Annoncer un showmatch')
    .addStringOption(o => o.setName('position').setDescription('Domicile ou Visiteur ?').setRequired(true)
      .addChoices({ name: '🏠 Domicile', value: 'home' }, { name: '✈️ Visiteur', value: 'away' }))
    .addStringOption(o => o.setName('adversaire').setDescription('Nom de l\'équipe adverse').setRequired(true))
    .addStringOption(o => o.setName('logo').setDescription('URL ou ID du message contenant le logo adverse').setRequired(true))
    .addChannelOption(o => o.setName('salon').setDescription('Salon où poster (optionnel)').setRequired(false)),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    await interaction.deferReply({ ephemeral: true });
    const isHome    = interaction.options.getString('position') === 'home';
    const enemy     = interaction.options.getString('adversaire');
    const logoInput = interaction.options.getString('logo');
    const salonOpt  = interaction.options.getChannel('salon');
    const logoUrl   = await resolveLogoSource(logoInput, interaction.guild);
    if (!logoUrl) return interaction.editReply({ embeds: [error('Logo introuvable', 'Impossible de trouver une image depuis cet ID ou URL.')] });
    const embed = competition('showmatch', isHome, enemy, null);
    embed.setImage(getShowMatchGif(isHome));
    embed.setThumbnail(logoUrl);
    const target = salonOpt || interaction.channel;
    await target.send({ content: '@everyone', embeds: [embed] });
    await interaction.editReply({ embeds: [{ color: 0xFF6BB5, description: `✅ Showmatch posté dans <#${target.id}> !` }] });
  }
};
