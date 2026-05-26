const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { getConfig, setConfig } = require('../../utils/database');
const { requireAdmin } = require('../../utils/permissions');
const { error } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pub')
    .setDescription('Afficher ou configurer la publicité')
    .addSubcommand(s => s.setName('show').setDescription('Afficher la pub'))
    .addSubcommand(s => s.setName('config').setDescription('Configurer (Admin)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'config') {
      if (!await requireAdmin(interaction)) return;
      const config = getConfig(gid);
      const modal = new ModalBuilder().setCustomId('pub_modal').setTitle('Configurer la publicité');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('message').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000).setValue(config.pub_message || '').setPlaceholder('Rejoins Vylox Esport !')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL image').setStyle(TextInputStyle.Short).setRequired(false).setValue(config.pub_image || '').setPlaceholder('https://...')),
      );
      return interaction.showModal(modal);
    }

    const config = getConfig(gid);
    if (!config.pub_message) return interaction.reply({ embeds: [error('Non configuré', 'Un admin peut utiliser `/pub config`.')], ephemeral: true });

    const embed = new EmbedBuilder().setColor(0xFF6BB5).setTitle('📣  Vylox Esport — Rejoins-nous !')
      .setDescription(config.pub_message).setTimestamp().setFooter({ text: 'Vylox Esport' });
    if (config.pub_image) embed.setImage(config.pub_image);
    await interaction.reply({ embeds: [embed] });
  }
};
