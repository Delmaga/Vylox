const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { getTicket } = require('../../utils/database');
const { error, success } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketscript')
    .setDescription('Exporter la conversation du ticket actuel en fichier texte'),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    await interaction.deferReply({ ephemeral: true });

    const ticket = getTicket(interaction.channel.id);
    if (!ticket) {
      return interaction.editReply({ embeds: [error('Pas un ticket', 'Cette commande doit être utilisée dans un salon de ticket.')] });
    }

    // Récupérer tous les messages du salon
    let messages = [];
    let lastId = null;
    while (true) {
      const opts = { limit: 100 };
      if (lastId) opts.before = lastId;
      const batch = await interaction.channel.messages.fetch(opts);
      if (!batch.size) break;
      messages = messages.concat([...batch.values()]);
      lastId = batch.last().id;
      if (batch.size < 100) break;
    }

    // Trier du plus ancien au plus récent
    messages.reverse();

    // Générer le transcript
    const lines = [
      `╔══════════════════════════════════════════╗`,
      `║  TRANSCRIPT — Ticket #${ticket.id}`,
      `║  Catégorie : ${ticket.category}`,
      `║  Créé le   : ${new Date(ticket.created_at).toLocaleString('fr-FR')}`,
      `║  Statut    : ${ticket.status}`,
      `╚══════════════════════════════════════════╝`,
      '',
    ];

    for (const msg of messages) {
      if (msg.author.bot && !msg.content) continue;
      const date = msg.createdAt.toLocaleString('fr-FR');
      const author = `${msg.author.tag}`;
      const content = msg.content || '[Embed/Fichier]';
      const reply = msg.reference ? `[Réponse à un message] ` : '';
      lines.push(`[${date}] ${author}: ${reply}${content}`);
      if (msg.attachments.size) {
        msg.attachments.forEach(a => lines.push(`  📎 Fichier: ${a.url}`));
      }
    }

    const transcript = lines.join('\n');
    const buffer = Buffer.from(transcript, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `ticket-${ticket.id}-transcript.txt` });

    await interaction.editReply({
      embeds: [success('Transcript généré !', `> ${messages.length} messages exportés.`)],
      files: [attachment],
    });
  }
};
