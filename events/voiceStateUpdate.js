const { getConfig } = require('../utils/database');
const { logVoice } = require('../utils/embeds');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guild  = oldState.guild || newState.guild;
    const config = getConfig(guild.id);
    if (!config.log_vocal) return;
    const logCh = guild.channels.cache.get(config.log_vocal);
    if (!logCh) return;
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    let embed;
    if (!oldState.channelId && newState.channelId)       embed = logVoice('join', member, null, newState.channelId);
    else if (oldState.channelId && !newState.channelId)  embed = logVoice('leave', member, oldState.channelId, null);
    else if (oldState.channelId !== newState.channelId)  embed = logVoice('move', member, oldState.channelId, newState.channelId);
    if (embed) await logCh.send({ embeds: [embed] }).catch(console.error);
  }
};
