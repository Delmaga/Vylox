const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcements')
    .setDescription('Publier une annonce officielle')
    .addChannelOption(o => o.setName('salon').setDescription('Salon cible').addChannelTypes(ChannelType.GuildText).setRequired(false)),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    const modal = new ModalBuilder().setCustomId(`announce_${channel.id}`).setTitle('Créer une annonce');
    modal.addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(256).setPlaceholder('Titre de l\'annonce...')),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('content').setLabel('Contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000).setPlaceholder('**gras**, *italique*, @mentions, <#salon>...')),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ping').setLabel('Ping (optionnel: @everyone, @here ou ID rôle)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL image bannière (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(500).setPlaceholder('https://...')),
    );
    await interaction.showModal(modal);
  }
};
