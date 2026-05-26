# 🌸 Vylox Esport Bot

Bot Discord complet avec tes GIFs Canva animés.

## 🚀 Installation

```bash
npm install
cp .env.example .env
# Remplis .env avec ton TOKEN, CLIENT_ID, GUILD_ID
npm run deploy   # Enregistre les slash commands
npm start        # Lance le bot
```

## ⚙️ Permissions requises
Active dans le Developer Portal : **Server Members Intent** + **Message Content Intent**
Invite le bot avec la permission **Administrator**.

## 📋 Configuration initiale

```
/welcome setup #salon-bienvenue @role-membre
/ticket setup #salon-tickets
/ticket add          → ajoute tes catégories
/ticket ping @staff
/logs vocal #logs-vocal
/logs message #logs-messages
/logs tickets #logs-tickets
/logs moderation #logs-moderation
/twitch config https://twitch.tv/...
/website config https://...
/pub config
```

## 🎮 Commandes

### Admin
| Commande | Description |
|---|---|
| `/welcome setup` | Configurer le welcome |
| `/welcome test` | Tester le welcome |
| `/ticket setup` | Créer le panel |
| `/ticket add/edit/del` | Gérer les catégories |
| `/ticket ping @role` | Rôle pingué |
| `/ticket charge` | Prendre en charge (dans le ticket) |
| `/ticket close` | Fermer (dans le ticket) |
| `/say send #salon` | Envoyer un message bot |
| `/say edit <id>` | Modifier un message bot |
| `/bypass add/sup/list` | Liste blanche admin |
| `/match home/away <team> <logo>` | Annoncer un match |
| `/showmatch home/away <team> <logo>` | Annoncer un showmatch |
| `/cup home/away <team> <logo> <prize>` | Annoncer une cup |
| `/announcements` | Publier une annonce |
| `/logs vocal/message/tickets/moderation` | Configurer les logs |

### Membres (tout le monde)
| Commande | Description |
|---|---|
| `/twitch show` | Lien Twitch |
| `/website show` | Site web |
| `/pub show` | Publicité |

## 🖼️ GIFs utilisés (tes créations Canva)
- `Welcome.gif` → Bienvenue automatique
- `Match_Domicile.gif` / `Match_Visiteur.gif`
- `ShowMatch_Domicile.gif` / `ShowMatch_Visiteur.gif`
- `Cup_50/100/150/200/250/300_Domicile.gif` / `Visiteur.gif` → Sélectionné automatiquement selon le prize pool
- `Tickets.gif` → Panel tickets

## 💡 Logo adverse (/match, /showmatch, /cup)
- **URL directe** : `https://...`
- **ID de message** : Poste l'image dans un salon Discord, clic droit → Copier l'ID du message
