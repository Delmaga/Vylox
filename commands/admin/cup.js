const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { error } = require('../../utils/embeds');
const { getCupGif } = require('../../utils/assets');
const { resolveLogoSource } = require('../../utils/logoFetcher');
const { composeLogo } = require('../../utils/gifComposer');

const PALIERS = [50, 100, 150, 200, 250, 300];

function closestPalier(prizeStr) {
  const num = parseInt(prizeStr.replace(/[^0-9]/g, '')) || 0;
  return PALIERS.reduce((a, b) => Math.abs(b-num) < Math.abs(a-num) ? b : a);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cup').setDescription('Annoncer une Cash-Cup')
    .addStringOption(o => o.setName('position').setDescription('Domicile ou Visiteur ?').setRequired(true)
      .addChoices({ name: '🏠 Domicile', value: 'home' }, { name: '✈️ Visiteur', value: 'away' }))
    .addStringOption(o => o.setName('adversaire').setDescription('Nom de l\'équipe adverse').setRequired(true))
    .addStringOption(o => o.setName('logo').setDescription('URL ou ID du message logo adverse').setRequired(true))
    .addStringOption(o => o.setName('prize').setDescription('Prize pool (50, 100, 150, 200, 250 ou 300€)').setRequired(true))
    .addStringOption(o => o.setName('date').setDescription('Date de la cup').setRequired(true))
    .addStringOption(o => o.setName('roster').setDescription('Rôle roster').setRequired(true))
    .addStringOption(o => o.setName('captain').setDescription('@ Capitaine').setRequired(true))
    .addStringOption(o => o.setName('joueur1').setDescription('@ Joueur 1').setRequired(true))
    .addStringOption(o => o.setName('joueur2').setDescription('@ Joueur 2').setRequired(true))
    .addChannelOption(o => o.setName('salon').setDescription('Salon (optionnel)').setRequired(false)),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    await interaction.deferReply({ ephemeral: true });

    const isHome   = interaction.options.getString('position') === 'home';
    const enemy    = interaction.options.getString('adversaire');
    const logoInput= interaction.options.getString('logo');
    const prize    = interaction.options.getString('prize');
    const date     = interaction.options.getString('date');
    const roster   = interaction.options.getString('roster');
    const captain  = interaction.options.getString('captain');
    const joueur1  = interaction.options.getString('joueur1');
    const joueur2  = interaction.options.getString('joueur2');
    const target   = interaction.options.getChannel('salon') || interaction.channel;

    const logoUrl = await resolveLogoSource(logoInput, interaction.guild);
    if (!logoUrl) return interaction.editReply({ embeds: [error('Logo introuvable', 'Impossible de trouver une image.')] });

    const palier    = closestPalier(prize);
    const side      = isHome ? 'Dom' : 'Vis';
    const assetName = `Cup_${palier}_${side}`;
    const imgBuffer = await composeLogo(assetName, logoUrl);

    const infoEmbed = new EmbedBuilder().setColor(0xFFD700)
      .setTitle(`🏆  Vylox Esport  VS  ${enemy}  |  ${prize}`)
      .setThumbnail(logoUrl)
      .addFields(
        { name: '📅 Date',    value: date,     inline: true },
        { name: '🎮 Roster',  value: roster,   inline: true },
        { name: '\u200B',     value: '\u200B', inline: true },
        { name: '👑 Captain', value: captain,  inline: true },
        { name: '🎯 Joueur',  value: joueur1,  inline: true },
        { name: '🎯 Joueur',  value: joueur2,  inline: true },
      ).setTimestamp();

    if (imgBuffer) {
      const att = new AttachmentBuilder(imgBuffer, { name: 'cup.png' });
      const imgEmbed = new EmbedBuilder().setColor(0xFFD700).setImage('attachment://cup.png');
      await target.send({ content: '@everyone 🏆', embeds: [infoEmbed, imgEmbed], files: [att] });
    } else {
      const imgEmbed = new EmbedBuilder().setColor(0xFFD700).setImage(getCupGif(isHome, prize));
      await target.send({ content: '@everyone 🏆', embeds: [infoEmbed, imgEmbed] });
    }
    await interaction.editReply({ content: `✅ Cup postée dans <#${target.id}> !` });
  }
};
