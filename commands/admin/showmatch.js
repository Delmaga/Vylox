const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { error } = require('../../utils/embeds');
const { getShowMatchGif } = require('../../utils/assets');
const { resolveLogoSource } = require('../../utils/logoFetcher');
const { composeLogo } = require('../../utils/gifComposer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showmatch')
    .setDescription('Annoncer un showmatch')
    .addStringOption(o => o.setName('position').setDescription('Domicile ou Visiteur ?').setRequired(true)
      .addChoices({ name: '🏠 Domicile', value: 'home' }, { name: '✈️ Visiteur', value: 'away' }))
    .addStringOption(o => o.setName('adversaire').setDescription('Nom de l\'équipe adverse').setRequired(true))
    .addStringOption(o => o.setName('logo').setDescription('URL ou ID du message contenant le logo adverse').setRequired(true))
    .addStringOption(o => o.setName('date').setDescription('Date du showmatch (ex: 27/05 à 20h00)').setRequired(true))
    .addStringOption(o => o.setName('roster').setDescription('Rôle roster à mentionner').setRequired(true))
    .addStringOption(o => o.setName('captain').setDescription('@ du capitaine').setRequired(true))
    .addStringOption(o => o.setName('joueur1').setDescription('@ du joueur 1').setRequired(true))
    .addStringOption(o => o.setName('joueur2').setDescription('@ du joueur 2').setRequired(true))
    .addChannelOption(o => o.setName('salon').setDescription('Salon où poster (optionnel)').setRequired(false)),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    await interaction.deferReply({ ephemeral: true });

    const isHome   = interaction.options.getString('position') === 'home';
    const enemy    = interaction.options.getString('adversaire');
    const logoInput= interaction.options.getString('logo');
    const date     = interaction.options.getString('date');
    const roster   = interaction.options.getString('roster');
    const captain  = interaction.options.getString('captain');
    const joueur1  = interaction.options.getString('joueur1');
    const joueur2  = interaction.options.getString('joueur2');
    const salonOpt = interaction.options.getChannel('salon');
    const target   = salonOpt || interaction.channel;

    const logoUrl = await resolveLogoSource(logoInput, interaction.guild);
    if (!logoUrl) return interaction.editReply({ embeds: [error('Logo introuvable', 'Impossible de trouver une image depuis cet ID ou URL.')] });

    const infoEmbed = new EmbedBuilder()
      .setColor(0xFF6BB5)
      .setTitle(`🎭  Vylox Esport  VS  ${enemy}`)
      .addFields(
        { name: '📅 Date', value: date, inline: true },
        { name: '🎮 Roster', value: roster, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '👑 Captain', value: captain, inline: true },
        { name: '🎯 Joueur', value: joueur1, inline: true },
        { name: '🎯 Joueur', value: joueur2, inline: true },
      )
      .setTimestamp();

    const gifUrl   = getShowMatchGif(isHome);
    const composed = await composeLogo(gifUrl, logoUrl, isHome);

    if (composed) {
      const attachment = new AttachmentBuilder(composed, { name: 'showmatch.png' });
      const gifEmbed = new EmbedBuilder().setColor(0xFF6BB5).setImage('attachment://showmatch.png');
      await target.send({ content: '@everyone', embeds: [infoEmbed, gifEmbed], files: [attachment] });
    } else {
      const gifEmbed = new EmbedBuilder().setColor(0xFF6BB5).setImage(gifUrl).setThumbnail(logoUrl);
      await target.send({ content: '@everyone', embeds: [infoEmbed, gifEmbed] });
    }

    await interaction.editReply({ content: `✅ Showmatch posté dans <#${target.id}> !` });
  }
};
