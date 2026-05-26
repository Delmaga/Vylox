const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { requireAdmin } = require('../../utils/permissions');
const { setConfig } = require('../../utils/database');
const { success } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configurer les salons de logs')
    .addSubcommand(s => s.setName('vocal').setDescription('Logs vocal').addChannelOption(o => o.setName('salon').setDescription('Salon de logs vocal').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName('message').setDescription('Logs messages').addChannelOption(o => o.setName('salon').setDescription('Salon de logs messages').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName('tickets').setDescription('Logs tickets').addChannelOption(o => o.setName('salon').setDescription('Salon de logs tickets').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName('moderation').setDescription('Logs modération').addChannelOption(o => o.setName('salon').setDescription('Salon de logs modération').addChannelTypes(ChannelType.GuildText).setRequired(true))),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;
    const sub = interaction.options.getSubcommand();
    const ch  = interaction.options.getChannel('salon');
    const keys = { vocal: 'log_vocal', message: 'log_message', tickets: 'log_tickets', moderation: 'log_moderation' };
    const icons = { vocal: '🔊', message: '💬', tickets: '🎫', moderation: '🔨' };
    setConfig(interaction.guild.id, keys[sub], ch.id);
    await interaction.reply({ embeds: [success(`${icons[sub]} Logs ${sub} configuré !`, `> Envoyés dans <#${ch.id}>`)], ephemeral: true });
  }
};
