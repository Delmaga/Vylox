const { EmbedBuilder } = require('discord.js');

const C = { PINK: 0xFF6BB5, RED: 0xFF2244, GREEN: 0x44FF99, GOLD: 0xFFD700, PURPLE: 0xB000A0, WHITE: 0xFFFFFF };

function base(color = C.PINK) {
  return new EmbedBuilder().setColor(color).setTimestamp();
}
function success(title, desc) { return base(C.GREEN).setTitle(`✅  ${title}`).setDescription(desc); }
function error(title, desc)   { return base(C.RED).setTitle(`❌  ${title}`).setDescription(desc); }
function info(title, desc)    { return base(C.PINK).setTitle(`💠  ${title}`).setDescription(desc); }
function warn(title, desc)    { return base(C.GOLD).setTitle(`⚠️  ${title}`).setDescription(desc); }

function welcome(member) {
  return base(C.PINK)
    .setDescription([
      `> 🌸 **Bienvenue sur **${member.guild.name}**, <@${member.id}> !**`,
      '',
      `> 📋 Lis le règlement et choisis tes rôles.`,
      `> 🎫 Besoin d'aide ? Ouvre un ticket !`,
      '',
      `> 👥 Tu es le **${member.guild.memberCount}ème** membre !`,
    ].join('\n'));
}

function ticketCreated(user, category, reason, pingRole) {
  const e = base(C.PURPLE)
    .setTitle('🎫  Nouveau Ticket')
    .addFields(
      { name: '👤  Créé par', value: `<@${user.id}>`, inline: true },
      { name: '📂  Catégorie', value: category, inline: true },
      { name: '📅  Date', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
    );
  if (reason) e.addFields({ name: '📝  Raison', value: reason });
  if (pingRole) e.addFields({ name: '🔔  Équipe notifiée', value: `<@&${pingRole}>` });
  e.addFields({ name: '━━━━━━━━━━━━━━━━━━━━━', value: [
    '> 🇫🇷 Notre équipe te répondra **sous 24h**.',
    '> Décris ton problème avec un maximum de détails.',
    '> Reste disponible et respectueux.',
    '> ',
    '> 🇺🇸 Our team will respond within **24 hours**.',
    '> Please describe your issue in as much detail as possible.',
    '> Stay available and respectful.',
  ].join('\n') });
  return e;
}

function ticketTaken(staff) {
  return base(C.GREEN).setTitle('✅  Ticket pris en charge')
    .setDescription(`> <@${staff.id}> prend en charge ce ticket.\n> Il revient vers toi au plus vite !`);
}

function ticketClosed(staff, reason) {
  const e = base(C.RED).setTitle('🔒  Ticket fermé')
    .setDescription(`> Fermé par <@${staff.id}>.`);
  if (reason) e.addFields({ name: '📝 Raison', value: reason });
  e.addFields({ name: '\u200B', value: '> Le salon sera supprimé dans **5 secondes**.' });
  return e;
}

function competition(type, isHome, enemyName, price) {
  const conf = {
    match:     { color: C.PINK,   title: '⚔  MATCH' },
    showmatch: { color: C.PURPLE, title: '🎭  SHOWMATCH' },
    cup:       { color: C.GOLD,   title: '🏆  CUP' },
  }[type] || { color: C.PINK, title: 'MATCH' };

  const e = new EmbedBuilder().setColor(conf.color).setTitle(conf.title)
    .addFields(
      { name: isHome ? '🏠 Domicile' : '✈️ Visiteur', value: '**Vylox Esport**', inline: true },
      { name: 'VS', value: '⚡', inline: true },
      { name: !isHome ? '🏠 Domicile' : '✈️ Visiteur', value: `**${enemyName}**`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'Vylox Esport • Bonne chance !' });
  if (type === 'cup' && price) e.addFields({ name: '💰 Prize Pool', value: `**${price}**` });
  return e;
}

function announcement(title, content, author) {
  return new EmbedBuilder().setColor(C.PINK)
    .setTitle(`📢  ${title}`)
    .setDescription(content)
    .setTimestamp()
    .setFooter({ text: `Annoncé par ${author.tag}`, iconURL: author.displayAvatarURL() });
}

function logVoice(action, member, from, to) {
  const col = { join: C.GREEN, leave: C.RED, move: C.GOLD }[action];
  const ico = { join: '🟢', leave: '🔴', move: '🔀' }[action];
  const lab = { join: 'Rejoint', leave: 'Quitté', move: 'Déplacé' }[action];
  const e = base(col).setTitle(`${ico}  Vocal — ${lab}`)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: '👤 Membre', value: `<@${member.id}>`, inline: true },
      { name: '🕐 Date', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true },
    );
  if (action === 'join')  e.addFields({ name: '📢 Salon', value: `<#${to}>` });
  if (action === 'leave') e.addFields({ name: '📢 Salon', value: `<#${from}>` });
  if (action === 'move')  e.addFields({ name: '📤 Avant', value: `<#${from}>`, inline: true }, { name: '📥 Après', value: `<#${to}>`, inline: true });
  return e;
}

function logMessage(action, message, oldContent) {
  const col = { edit: C.GOLD, delete: C.RED }[action];
  const ico = { edit: '✏️', delete: '🗑️' }[action];
  const e = base(col).setTitle(`${ico}  Message — ${action === 'edit' ? 'Modifié' : 'Supprimé'}`)
    .setThumbnail(message.author?.displayAvatarURL())
    .addFields(
      { name: '👤 Auteur', value: `<@${message.author?.id}>`, inline: true },
      { name: '📢 Salon', value: `<#${message.channelId}>`, inline: true },
      { name: '🕐 Date', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true },
    );
  if (action === 'edit') e.addFields({ name: '📝 Avant', value: (oldContent||'*Inconnu*').substring(0,1020) }, { name: '📝 Après', value: (message.content||'*Vide*').substring(0,1020) }, { name: '🔗 Lien', value: `[Aller au message](${message.url})` });
  else e.addFields({ name: '📝 Contenu', value: (message.content||'*Aucun contenu*').substring(0,1020) });
  return e;
}

function logMod(action, target, mod, reason) {
  const col = { ban: C.RED, kick: 0xFF6600, mute: C.GOLD, warn: 0xFFAA00, unban: C.GREEN }[action] || C.PINK;
  const ico = { ban: '🔨', kick: '👢', mute: '🔇', warn: '⚠️', unban: '✅' }[action] || '🛡️';
  return base(col).setTitle(`${ico}  Modération — ${action.toUpperCase()}`)
    .addFields(
      { name: '🎯 Cible',      value: `<@${target.id}>`, inline: true },
      { name: '👮 Modérateur', value: `<@${mod.id}>`, inline: true },
      { name: '🕐 Date',       value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true },
      { name: '📝 Raison',     value: reason || '*Aucune raison*' }
    );
}

module.exports = { C, base, success, error, info, warn, welcome, ticketCreated, ticketTaken, ticketClosed, competition, announcement, logVoice, logMessage, logMod };
