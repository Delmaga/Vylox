const { SlashCommandBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
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
    ),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'send') {
      const channel = interaction.options.getChannel('salon');
      const modal = new ModalBuilder()
        .setCustomId(`say_send_${channel.id}`)
        .setTitle('✍ Créer un message');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('title').setLabel('Titre (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(256).setPlaceholder('Titre...')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('content').setLabel('Contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000).setPlaceholder('**gras** | *italique* | @mention | <#salon>\n> citation | ```code```')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('color').setLabel('Couleur hex (ex: FF6BB5)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(7).setPlaceholder('FF6BB5')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('image').setLabel('URL image (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(500).setPlaceholder('https://...')
        ),
      );
      await interaction.showModal(modal);
    }

    else if (sub === 'edit') {
      await interaction.deferReply({ ephemeral: true });
      const msgId = interaction.options.getString('message_id');
      let targetMsg = null, targetCh = null;

      for (const [, ch] of interaction.guild.channels.cache.filter(c => c.isTextBased())) {
        try {
          const m = await ch.messages.fetch(msgId);
          if (m?.author?.id === interaction.client.user.id) { targetMsg = m; targetCh = ch; break; }
        } catch {}
      }

      if (!targetMsg) return interaction.editReply({ embeds: [error('Introuvable', 'Message introuvable ou il n\'appartient pas au bot.')] });

      // Store msgId and channelId for the modal response
      interaction.client._sayEditCache = interaction.client._sayEditCache || {};
      interaction.client._sayEditCache[interaction.user.id] = { msgId, channelId: targetCh.id };

      const curContent = targetMsg.embeds?.[0]?.description || targetMsg.content || '';
      const curTitle   = targetMsg.embeds?.[0]?.title || '';
      const curColor   = targetMsg.embeds?.[0]?.hexColor?.replace('#','') || 'FF6BB5';
      const curImage   = targetMsg.embeds?.[0]?.image?.url || '';

      await interaction.editReply({ embeds: [success('Prêt !', '> Le modal d\'édition va s\'ouvrir, utilise `/say edit` puis copie l\'ID.')] });

      // Send a followup that shows a button to open the modal
      const { ButtonBuilder, ButtonStyle } = require('discord.js');
      const row = new require('discord.js').ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`say_edit_open_${msgId}_${targetCh.id}`)
          .setLabel('Ouvrir l\'éditeur')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✏️')
      );
      await interaction.followUp({ content: '> Clique pour ouvrir l\'éditeur de message :', components: [row], ephemeral: true });
    }
  }
};
