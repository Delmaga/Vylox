const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { error, success } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Envoyer ou modifier un message via le bot')
    .addSubcommand(s => s.setName('send').setDescription('Envoyer un message stylisé')
      .addChannelOption(o => o.setName('salon').setDescription('Salon cible').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(s => s.setName('edit').setDescription('Modifier un message du bot par son ID')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message à modifier').setRequired(true))
      .addChannelOption(o => o.setName('salon').setDescription('Salon contenant le message').addChannelTypes(ChannelType.GuildText).setRequired(true))
    ),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'send') {
      const channel = interaction.options.getChannel('salon');
      const modal = new ModalBuilder()
        .setCustomId(`say_send_${channel.id}`)
        .setTitle('Créer un message');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(256).setPlaceholder('Titre...')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('content').setLabel('Contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000).setPlaceholder('**gras** | *italique* | @mention | <#salon>')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex (ex: FF6BB5)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(7).setPlaceholder('FF6BB5')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL image (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(500).setPlaceholder('https://...')),
      );
      await interaction.showModal(modal);
    }

    else if (sub === 'edit') {
      const msgId   = interaction.options.getString('message_id');
      const channel = interaction.options.getChannel('salon');

      // Chercher le message directement dans le salon fourni
      const targetMsg = await channel.messages.fetch(msgId).catch(() => null);

      if (!targetMsg) {
        return interaction.reply({ embeds: [error('Introuvable', `Message \`${msgId}\` introuvable dans <#${channel.id}>.\nVérifie que l'ID est correct et que c'est le bon salon.`)], ephemeral: true });
      }
      if (targetMsg.author.id !== interaction.client.user.id) {
        return interaction.reply({ embeds: [error('Pas un message bot', 'Ce message n\'appartient pas au bot.')], ephemeral: true });
      }

      const curContent = targetMsg.embeds?.[0]?.description || targetMsg.content || '';
      const curTitle   = targetMsg.embeds?.[0]?.title || '';
      const curColor   = targetMsg.embeds?.[0]?.hexColor?.replace('#','') || 'FF6BB5';
      const curImage   = targetMsg.embeds?.[0]?.image?.url || '';

      const modal = new ModalBuilder()
        .setCustomId(`say_edit_${msgId}_${channel.id}`)
        .setTitle('Modifier le message');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setRequired(false).setValue(curTitle.substring(0,256)).setMaxLength(256)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('content').setLabel('Contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000).setValue(curContent.substring(0,4000))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex').setStyle(TextInputStyle.Short).setRequired(false).setValue(curColor).setMaxLength(7)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL image').setStyle(TextInputStyle.Short).setRequired(false).setValue(curImage.substring(0,500)).setMaxLength(500)),
      );
      await interaction.showModal(modal);
    }
  }
};
