const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { error, success } = require('../../utils/embeds');
const { getLogo } = require('../../utils/assets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Envoyer ou modifier un message via le bot')
    .addSubcommand(s => s.setName('send').setDescription('Envoyer un message stylisé')
      .addChannelOption(o => o.setName('salon').setDescription('Salon cible').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(s => s.setName('edit').setDescription('Modifier un message du bot par son ID')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message à modifier').setRequired(true))
    ),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'send') {
      const channel = interaction.options.getChannel('salon');
      const modal = new ModalBuilder().setCustomId(`say_send_${channel.id}`).setTitle('Créer un message');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(256).setPlaceholder('Titre de l\'embed...')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('content').setLabel('Contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000)
          .setPlaceholder('Supporte le markdown Discord :\n**gras** | *italique* | @mentions | <#salon> | <@&role>\n> citation | ```code```')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex (ex: #FF6BB5)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(7).setPlaceholder('#FF6BB5')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL image (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(500).setPlaceholder('https://...')),
      );
      await interaction.showModal(modal);
    }

    else if (sub === 'edit') {
      const msgId = interaction.options.getString('message_id');
      let targetMsg = null, targetCh = null;
      for (const [, ch] of interaction.guild.channels.cache.filter(c => c.isTextBased())) {
        try { const m = await ch.messages.fetch(msgId); if (m?.author?.id === interaction.client.user.id) { targetMsg = m; targetCh = ch; break; } } catch {}
      }
      if (!targetMsg) return interaction.reply({ embeds: [error('Introuvable', 'Message introuvable ou il n\'appartient pas au bot.')], ephemeral: true });

      const curContent = targetMsg.embeds?.[0]?.description || targetMsg.content || '';
      const curTitle   = targetMsg.embeds?.[0]?.title || '';
      const curColor   = targetMsg.embeds?.[0]?.color ? `#${targetMsg.embeds[0].color.toString(16).padStart(6,'0')}` : '#FF6BB5';
      const curImage   = targetMsg.embeds?.[0]?.image?.url || '';

      const modal = new ModalBuilder().setCustomId(`say_edit_${msgId}_${targetCh.id}`).setTitle('Modifier le message');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setRequired(false).setValue(curTitle || '')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('content').setLabel('Contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000).setValue(curContent || '')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex').setStyle(TextInputStyle.Short).setRequired(false).setValue(curColor || '#FF6BB5')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL image').setStyle(TextInputStyle.Short).setRequired(false).setValue(curImage || '')),
      );
      await interaction.showModal(modal);
    }
  }
};
