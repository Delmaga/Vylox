const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getConfig, getTicketCategories, addTicketCategory, editTicketCategory, deleteTicketCategory, createTicket, getTicket, updateTicket, setConfig } = require('../utils/database');
const { error, success, info, ticketCreated, ticketTaken, ticketClosed, announcement } = require('../utils/embeds');
const LOGO_URL = 'https://files.catbox.moe/biv4bo.gif';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Slash Commands ──────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try { await cmd.execute(interaction); }
      catch (err) {
        console.error(`Erreur /${interaction.commandName}:`, err);
        const reply = { embeds: [error('Erreur interne', err.message)], ephemeral: true };
        if (interaction.deferred || interaction.replied) interaction.editReply(reply).catch(() => {});
        else interaction.reply(reply).catch(() => {});
      }
      return;
    }

    // ── Modals ──────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const id  = interaction.customId;
      const gid = interaction.guild.id;

      // SAY SEND
      if (id.startsWith('say_send_')) {
        const channelId = id.replace('say_send_', '');
        const title     = interaction.fields.getTextInputValue('title');
        const content   = interaction.fields.getTextInputValue('content');
        const colorHex  = interaction.fields.getTextInputValue('color') || '#FF6BB5';
        const imageUrl  = interaction.fields.getTextInputValue('image');
        const color     = parseInt(colorHex.replace('#', ''), 16) || 0xFF6BB5;
        const channel   = interaction.guild.channels.cache.get(channelId);
        if (!channel) return;

        const embed = new EmbedBuilder().setColor(color).setDescription(content).setTimestamp()
          .setFooter({ text: 'Vylox Esport' });
        if (title) embed.setTitle(title);
        if (imageUrl) embed.setImage(imageUrl);

        await channel.send({ embeds: [embed] });
        await interaction.reply({ embeds: [success('Message envoyé !', `> Posté dans <#${channel.id}>`)], ephemeral: true });
        return;
      }

      // SAY EDIT
      if (id.startsWith('say_edit_')) {
        const match     = id.match(/^say_edit_(\d+)_(\d+)$/);
        if (!match) return;
        const msgId     = match[1];
        const channelId = match[2];
        const title     = interaction.fields.getTextInputValue('title');
        const content   = interaction.fields.getTextInputValue('content');
        const colorHex  = interaction.fields.getTextInputValue('color') || '#FF6BB5';
        const imageUrl  = interaction.fields.getTextInputValue('image');
        const color     = parseInt(colorHex.replace('#', ''), 16) || 0xFF6BB5;
        const channel   = interaction.guild.channels.cache.get(channelId);
        const msg       = await channel?.messages.fetch(msgId).catch(() => null);
        if (!msg) return interaction.reply({ embeds: [error('Introuvable', 'Message introuvable.')], ephemeral: true });

        const embed = new EmbedBuilder().setColor(color).setDescription(content).setTimestamp()
          .setFooter({ text: 'Vylox Esport' });
        if (title) embed.setTitle(title);
        if (imageUrl) embed.setImage(imageUrl);

        await msg.edit({ embeds: [embed] });
        await interaction.reply({ embeds: [success('Message modifié !', `> [Voir le message](${msg.url})`)], ephemeral: true });
        return;
      }

      // TICKET ADD
      if (id === 'ticket_add_modal') {
        const label = interaction.fields.getTextInputValue('label');
        const emoji = interaction.fields.getTextInputValue('emoji') || '🎫';
        const desc  = interaction.fields.getTextInputValue('description');
        const ok    = addTicketCategory(gid, label, emoji, desc);
        await interaction.reply({ embeds: [ok ? success('Catégorie ajoutée !', `> **${emoji} ${label}** ajoutée.\n> Relance \`/ticket setup\` pour mettre à jour le panel.`) : error('Doublon', `**${label}** existe déjà.`)], ephemeral: true });
        return;
      }

      // TICKET EDIT modal
      if (id.startsWith('ticket_edit_modal_')) {
        const catId = parseInt(id.replace('ticket_edit_modal_', ''));
        const label = interaction.fields.getTextInputValue('label');
        const emoji = interaction.fields.getTextInputValue('emoji') || '🎫';
        const desc  = interaction.fields.getTextInputValue('description');
        editTicketCategory(catId, label, emoji, desc);
        await interaction.reply({ embeds: [success('Modifié !', `> **${emoji} ${label}** mis à jour.`)], ephemeral: true });
        return;
      }

      // TICKET OPEN reason
      if (id.startsWith('ticket_reason_')) {
        const catId  = id.replace('ticket_reason_', '');
        const reason = interaction.fields.getTextInputValue('reason');
        await openTicket(interaction, catId, reason, client);
        return;
      }

      // ANNOUNCEMENT
      if (id.startsWith('announce_')) {
        const channelId = id.replace('announce_', '');
        const title     = interaction.fields.getTextInputValue('title');
        const content   = interaction.fields.getTextInputValue('content');
        const pingText  = interaction.fields.getTextInputValue('ping');
        const imageUrl  = interaction.fields.getTextInputValue('image');
        const channel   = interaction.guild.channels.cache.get(channelId);
        if (!channel) return;

        const embed = announcement(title, content, interaction.user);
        if (imageUrl) embed.setImage(imageUrl);
        embed.setFooter({ text: `Annoncé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        let ping = '';
        if (pingText) {
          if (pingText.toLowerCase() === '@everyone') ping = '@everyone';
          else if (pingText.toLowerCase() === '@here') ping = '@here';
          else ping = `<@&${pingText.replace(/\D/g, '')}>`;
        }

        await channel.send({ content: ping || undefined, embeds: [embed] });
        await interaction.reply({ embeds: [success('Annonce publiée !', `> Envoyée dans <#${channel.id}>`)], ephemeral: true });
        return;
      }

      // PUB CONFIG
      if (id === 'pub_modal') {
        const msg = interaction.fields.getTextInputValue('message');
        const img = interaction.fields.getTextInputValue('image');
        setConfig(gid, 'pub_message', msg);
        if (img) setConfig(gid, 'pub_image', img);
        await interaction.reply({ embeds: [success('Pub configurée !', '> Utilise `/pub show` pour la voir.')], ephemeral: true });
        return;
      }
    }

    // ── Select Menus ────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      const id  = interaction.customId;
      const gid = interaction.guild.id;

      // TICKET OPEN select → modal raison
      if (id === 'ticket_open_select') {
        const val   = interaction.values[0];
        const catId = val.replace('open_', '');
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId(`ticket_reason_${catId}`).setTitle('Ouvrir un ticket');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('reason').setLabel('Décris ton problème').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500).setPlaceholder('Décris brièvement ta demande...')
          )
        );
        await interaction.showModal(modal);
        return;
      }

      // TICKET EDIT select → modal
      if (id === 'ticket_edit_select') {
        const catId = parseInt(interaction.values[0]);
        const cat   = getTicketCategories(gid).find(c => c.id === catId);
        if (!cat) return;
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId(`ticket_edit_modal_${catId}`).setTitle(`Modifier: ${cat.label}`);
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('label').setLabel('Nom').setStyle(TextInputStyle.Short).setValue(cat.label).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('emoji').setLabel('Emoji').setStyle(TextInputStyle.Short).setValue(cat.emoji||'🎫').setRequired(false)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Short).setValue(cat.description||'').setRequired(false)),
        );
        await interaction.showModal(modal);
        return;
      }

      // TICKET DEL select
      if (id === 'ticket_del_select') {
        const catId = parseInt(interaction.values[0]);
        const cat   = getTicketCategories(gid).find(c => c.id === catId);
        if (!cat) return;
        deleteTicketCategory(catId);
        await interaction.update({ embeds: [success('Supprimé !', `> **${cat.label}** retiré du menu.`)], components: [] });
        return;
      }
    }


    // ── SAY EDIT button → open modal ─────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('say_edit_open_')) {
      const match = interaction.customId.match(/^say_edit_open_(\d+)_(\d+)$/);
      if (!match) return;
      const msgId = match[1], channelId = match[2];
      const ch  = interaction.guild.channels.cache.get(channelId);
      const msg = await ch?.messages.fetch(msgId).catch(() => null);
      if (!msg) return interaction.reply({ embeds: [error('Introuvable', 'Message introuvable.')], ephemeral: true });

      const curContent = msg.embeds?.[0]?.description || msg.content || '';
      const curTitle   = msg.embeds?.[0]?.title || '';
      const curColor   = msg.embeds?.[0]?.hexColor?.replace('#','') || 'FF6BB5';
      const curImage   = msg.embeds?.[0]?.image?.url || '';

      const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
      const modal = new ModalBuilder().setCustomId(`say_edit_${msgId}_${channelId}`).setTitle('✏️ Modifier le message');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setRequired(false).setValue(curTitle).setMaxLength(256)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('content').setLabel('Contenu').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000).setValue(curContent)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex (ex: FF6BB5)').setStyle(TextInputStyle.Short).setRequired(false).setValue(curColor).setMaxLength(7)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL image').setStyle(TextInputStyle.Short).setRequired(false).setValue(curImage).setMaxLength(500)),
      );
      await interaction.showModal(modal);
      return;
    }

    // ── Buttons ─────────────────────────────────────────────────
    if (interaction.isButton()) {
      const id  = interaction.customId;
      const gid = interaction.guild.id;

      if (id === 'ticket_charge') {
        const ticket = getTicket(interaction.channel.id);
        if (!ticket) return;
        if (ticket.taken_by) return interaction.reply({ embeds: [error('Déjà pris', `Géré par <@${ticket.taken_by}>.`)], ephemeral: true });
        updateTicket(interaction.channel.id, { taken_by: interaction.user.id });
        await interaction.reply({ embeds: [ticketTaken(interaction.user)] });
        // Désactiver le bouton "prendre en charge"
        try {
          const msg = await interaction.message.fetch();
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
          );
          await msg.edit({ components: [row] });
        } catch {}
        return;
      }

      if (id === 'ticket_close') {
        const ticket = getTicket(interaction.channel.id);
        if (!ticket) return;
        await interaction.reply({ embeds: [ticketClosed(interaction.user, null)] });
        updateTicket(interaction.channel.id, { status: 'closed', closed_at: new Date().toISOString() });

        // Log
        const config = getConfig(gid);
        if (config.log_tickets) {
          const logCh = interaction.guild.channels.cache.get(config.log_tickets);
          if (logCh) await logCh.send({ embeds: [info(`Ticket #${ticket.id} fermé`, [
            `> 👤 <@${ticket.user_id}>`, `> 📂 ${ticket.category}`, `> 🔒 Fermé par <@${interaction.user.id}>`
          ].join('\n'))] }).catch(() => {});
        }

        // Renommer + supprimer après 24h
        const closedMember = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
        const closedName = (closedMember?.user?.username?.toLowerCase().replace(/[^a-z0-9]/g,'') || 'user') + '-closed';
        await interaction.channel.setName(closedName).catch(() => {});
        await interaction.followUp({ embeds: [info('Fermeture / Closing', '> FR: Suppression dans **24h**.\n> EN: Deletion in **24 hours**.')] });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 24 * 60 * 60 * 1000);
        return;
      }
    }
  }
};

// ── Ouvrir un ticket ─────────────────────────────────────────
async function openTicket(interaction, catId, reason, client) {
  const gid    = interaction.guild.id;
  const config = getConfig(gid);
  const user   = interaction.user;

  const cats = getTicketCategories(gid);
  let catLabel = 'Support', catEmoji = '🎫';
  if (catId !== 'default') {
    const cat = cats.find(c => String(c.id) === String(catId));
    if (cat) { catLabel = cat.label; catEmoji = cat.emoji || '🎫'; }
  }

  const channelName = `${catLabel.toLowerCase().replace(/\s+/g,'-')}-${user.username.toLowerCase().replace(/[^a-z0-9]/g,'')}`;

  const perms = [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
  ];
  if (config.ticket_ping_role) perms.push({ id: config.ticket_ping_role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

  const opts = { name: channelName, type: ChannelType.GuildText, permissionOverwrites: perms };
  if (config.ticket_category) opts.parent = config.ticket_category;

  let ticketCh;
  try { ticketCh = await interaction.guild.channels.create(opts); }
  catch (e) { return interaction.reply({ embeds: [error('Erreur', `Impossible de créer le salon: ${e.message}`)], ephemeral: true }); }

  createTicket(gid, ticketCh.id, user.id, `${catEmoji} ${catLabel}`, reason);

  const embed = ticketCreated(user, `${catEmoji} ${catLabel}`, reason, config.ticket_ping_role);
  
  // GIF ticket
  const { getTicketsGif } = require('../utils/assets');
  const gifEmbed = new EmbedBuilder().setColor(0xFF6BB5).setImage(getTicketsGif());

  // Ping
  const pingParts = [`<@${user.id}>`];
  if (config.ticket_ping_role) pingParts.push(`<@&${config.ticket_ping_role}>`);

  await ticketCh.send({
    content: pingParts.join(' '),
    embeds: [gifEmbed, embed],
  });

  // Log création
  if (config.log_tickets) {
    const logCh = interaction.guild.channels.cache.get(config.log_tickets);
    if (logCh) await logCh.send({ embeds: [info('🎫 Nouveau ticket', `> 👤 <@${user.id}>\n> 📂 ${catEmoji} ${catLabel}\n> 📢 <#${ticketCh.id}>${reason ? `\n> 📝 ${reason}` : ''}`)] }).catch(() => {});
  }

  await interaction.reply({ embeds: [success('Ticket créé !', `> Ton ticket est dans <#${ticketCh.id}> !\n> Notre équipe te répond bientôt.`)], ephemeral: true });
}