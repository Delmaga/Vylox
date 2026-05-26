const { SlashCommandBuilder, ChannelType, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { setConfig, getConfig, getTicketCategories, addTicketCategory, editTicketCategory, deleteTicketCategory } = require('../../utils/database');
const { success, error, info } = require('../../utils/embeds');
const { getTicketsGif } = require('../../utils/assets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gestion des tickets')
    .addSubcommand(s => s.setName('setup').setDescription('Créer le panel de tickets')
      .addChannelOption(o => o.setName('salon').setDescription('Salon du panel').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addChannelOption(o => o.setName('categorie').setDescription('Catégorie Discord pour les salons').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
    )
    .addSubcommand(s => s.setName('add').setDescription('Ajouter une catégorie au menu'))
    .addSubcommand(s => s.setName('edit').setDescription('Modifier une catégorie'))
    .addSubcommand(s => s.setName('del').setDescription('Supprimer une catégorie'))
    .addSubcommand(s => s.setName('ping').setDescription('Rôle pingué à la création d\'un ticket')
      .addRoleOption(o => o.setName('role').setDescription('Rôle à mentionner').setRequired(true))
    )
    .addSubcommand(s => s.setName('charge').setDescription('Prendre en charge le ticket actuel'))
    .addSubcommand(s => s.setName('close').setDescription('Fermer le ticket actuel')
      .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;
    const adminCmds = ['setup','add','edit','del','ping'];
    if (adminCmds.includes(sub) && !await requireAdmin(interaction)) return;

    if (sub === 'setup') {
      const channel  = interaction.options.getChannel('salon');
      const category = interaction.options.getChannel('categorie');
      setConfig(gid, 'ticket_channel', channel.id);
      if (category) setConfig(gid, 'ticket_category', category.id);
      await interaction.deferReply({ ephemeral: true });
      await postPanel(channel, gid);
      await interaction.editReply({ embeds: [success('Panel créé !', `> Panel posté dans <#${channel.id}>.`)] });
    }

    else if (sub === 'add') {
      const modal = new ModalBuilder().setCustomId('ticket_add_modal').setTitle('Ajouter une catégorie');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('label').setLabel('Nom').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Support, Bug, Partenariat...')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('emoji').setLabel('Emoji').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(8).setPlaceholder('🎫')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100).setPlaceholder('Description courte...')),
      );
      await interaction.showModal(modal);
    }

    else if (sub === 'edit') {
      const cats = getTicketCategories(gid);
      if (!cats.length) return interaction.reply({ embeds: [error('Vide', 'Aucune catégorie. Utilise `/ticket add` d\'abord.')], ephemeral: true });
      const select = new StringSelectMenuBuilder().setCustomId('ticket_edit_select').setPlaceholder('Choisir une catégorie...')
        .addOptions(cats.map(c => ({ label: c.label, value: String(c.id), emoji: c.emoji || '🎫', description: c.description || undefined })));
      await interaction.reply({ embeds: [info('Modifier', 'Sélectionne la catégorie à modifier :')], components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
    }

    else if (sub === 'del') {
      const cats = getTicketCategories(gid);
      if (!cats.length) return interaction.reply({ embeds: [error('Vide', 'Aucune catégorie à supprimer.')], ephemeral: true });
      const select = new StringSelectMenuBuilder().setCustomId('ticket_del_select').setPlaceholder('Choisir une catégorie...')
        .addOptions(cats.map(c => ({ label: c.label, value: String(c.id), emoji: c.emoji || '🎫' })));
      await interaction.reply({ embeds: [info('Supprimer', '⚠️ Action irréversible. Sélectionne la catégorie à supprimer :')], components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
    }

    else if (sub === 'ping') {
      const role = interaction.options.getRole('role');
      setConfig(gid, 'ticket_ping_role', role.id);
      await interaction.reply({ embeds: [success('Rôle configuré !', `> <@&${role.id}> sera pingué pour chaque nouveau ticket.`)], ephemeral: true });
    }

    else if (sub === 'charge') {
      const { getTicket, updateTicket } = require('../../utils/database');
      const ticket = getTicket(interaction.channel.id);
      if (!ticket) return interaction.reply({ embeds: [error('Pas un ticket', 'Utilise cette commande dans un salon de ticket.')], ephemeral: true });
      if (ticket.taken_by) return interaction.reply({ embeds: [error('Déjà pris', `Déjà géré par <@${ticket.taken_by}>.`)], ephemeral: true });
      updateTicket(interaction.channel.id, { taken_by: interaction.user.id });
      const { ticketTaken } = require('../../utils/embeds');
      await interaction.reply({ embeds: [ticketTaken(interaction.user)] });
    }

    else if (sub === 'close') {
      const { getTicket, updateTicket } = require('../../utils/database');
      const ticket = getTicket(interaction.channel.id);
      if (!ticket) return interaction.reply({ embeds: [error('Pas un ticket', 'Utilise cette commande dans un salon de ticket.')], ephemeral: true });
      const reason = interaction.options.getString('raison');
      const { ticketClosed } = require('../../utils/embeds');
      await interaction.reply({ embeds: [ticketClosed(interaction.user, reason)] });
      updateTicket(interaction.channel.id, { status: 'closed', closed_at: new Date().toISOString() });
      await logTicketClose(interaction, ticket, reason);
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
};

async function postPanel(channel, guildId) {
  const cats = getTicketCategories(guildId);
  
  const options = cats.length
    ? cats.map(c => ({ label: c.label, value: `open_${c.id}`, emoji: c.emoji || '🎫', description: c.description || `Ouvrir un ticket ${c.label}` }))
    : [{ label: 'Support', value: 'open_default', emoji: '🎫', description: 'Ouvrir un ticket support' }];
  const select = new StringSelectMenuBuilder().setCustomId('ticket_open_select').setPlaceholder('⬇  Choisir une catégorie...').addOptions(options);
  await channel.send({ components: [new ActionRowBuilder().addComponents(select)] });
}

async function logTicketClose(interaction, ticket, reason) {
  const config = getConfig(interaction.guild.id);
  if (!config.log_tickets) return;
  const logCh = interaction.guild.channels.cache.get(config.log_tickets);
  if (!logCh) return;
  const { info } = require('../../utils/embeds');
  await logCh.send({ embeds: [info(`Ticket #${ticket.id} fermé`, [
    `> 👤 Utilisateur : <@${ticket.user_id}>`,
    `> 📂 Catégorie : ${ticket.category}`,
    `> 🔒 Fermé par : <@${interaction.user.id}>`,
    reason ? `> 📝 Raison : ${reason}` : '',
  ].filter(Boolean).join('\n'))] });
}

module.exports.postPanel = postPanel;
