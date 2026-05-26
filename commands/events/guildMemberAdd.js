const { getConfig } = require('../utils/database');
const { welcome } = require('../utils/embeds');
const { getWelcomeGif } = require('../utils/assets');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const config = getConfig(member.guild.id);
    if (config.welcome_role) {
      const role = member.guild.roles.cache.get(config.welcome_role);
      if (role) await member.roles.add(role).catch(console.error);
    }
    if (!config.welcome_channel) return;
    const channel = member.guild.channels.cache.get(config.welcome_channel);
    if (!channel) return;
    const embed = welcome(member);
    embed.setImage(getWelcomeGif());
    await channel.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(console.error);
  }
};
