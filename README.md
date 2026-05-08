# NDA PUBLIC — Discord ↔ Claude Code Bridge

Route Discord messages directly into a live **Claude Code session** — push-based via `tail -f`, zero polling.

```
Discord #channel  ──→  bot.ts  ──→  /tmp/inbox.jsonl
                                           │
                              Monitor (tail -f) in Claude Code
                                           │
                              Claude reads, responds, replies to Discord
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js ≥ 22 | Uses `--experimental-strip-types` to run TypeScript directly |
| [Claude Code CLI](https://claude.ai/code) | Must be installed and authenticated |
| Discord Bot | Created at discord.com/developers/applications |
| **Message Content Intent** | Must be enabled in the bot's settings |

---

## Setup (Step-by-Step)

### Step 1 — Clone & install

```bash
git clone https://github.com/tlejay/NDA-PUBLIC-Discord-Claude-Bridge.git
cd NDA-PUBLIC-Discord-Claude-Bridge
npm install
```

### Step 2 — Create your Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → give it a name
3. Go to **Bot** → click **Reset Token** → copy the token
4. Scroll down to **Privileged Gateway Intents** → enable **Message Content Intent** → Save
5. Go to **OAuth2 → URL Generator** → select `bot` scope → permissions: `Send Messages`, `Read Message History` → copy the URL → invite the bot to your server

### Step 3 — Run the setup wizard

```bash
npm run init
```

The wizard asks for:
1. **Bot Token** — from Step 2
2. **Guild (Server) ID** — right-click your server icon → Copy Server ID
3. **Channel ID** — right-click the channel → Copy Channel ID
4. **Allowed Role ID** — (optional) only this role can send commands; leave blank for anyone
5. **Inbox file path** — where messages are queued (default: `/tmp/discord-bridge-inbox.jsonl`)

This writes a `.env` file. **Never commit `.env`.**

### Step 4 — Start the bot

```bash
npm run bot
```

You should see:
```
[bridge] Bot online: YourBot#1234
[bridge] Watching channel: 123456789
[bridge] Inbox: /tmp/discord-bridge-inbox.jsonl
```

### Step 5 — Connect Claude Code session

Open a Claude Code session and paste this `/loop` prompt (replace paths/IDs with your values):

```
/loop Watch /tmp/discord-bridge-inbox.jsonl for new Discord messages using Monitor (tail -f).
When a message arrives via task-notification:
1. Show it as [Discord] @author: content
2. Respond to the message in the context of this project
3. Send the reply to Discord channel <CHANNEL_ID> using Bot token <BOT_TOKEN>
4. Append the message ID to /tmp/discord-processed.txt
```

Claude Code will arm a `Monitor` on the inbox file — no polling, push-only.

---

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  1. User types in Discord #channel                          │
│  2. bot.ts checks role (if ALLOWED_ROLE_ID is set)         │
│  3. bot.ts appends JSON line to inbox file + acks Discord  │
│  4. Monitor (tail -f) fires immediately in Claude Code     │
│  5. Claude reads message, responds, sends reply to Discord  │
└─────────────────────────────────────────────────────────────┘
```

**Why file-based?** Claude Code sessions are local processes — there's no HTTP endpoint to POST to. A shared file + `tail -f` gives real-time push without any server infrastructure.

---

## Configuration

All config lives in `.env` (created by `npm run init`):

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_CHANNEL_ID=your_channel_id_here
ALLOWED_ROLE_ID=your_role_id_here   # optional
INBOX_FILE=/tmp/discord-bridge-inbox.jsonl
```

---

## Role restriction

If `ALLOWED_ROLE_ID` is set, users without that role get:

```
> Access denied.
> This channel is restricted to authorized operators only.
```

Leave `ALLOWED_ROLE_ID` blank (or comment it out) to allow anyone in the channel.

---

## Keep the bot running persistently

Use `pm2` to keep the bot alive across restarts:

```bash
npm install -g pm2
pm2 start "npm run bot" --name discord-bridge
pm2 save
pm2 startup
```

---

## Project structure

```
├── src/
│   ├── bot.ts      ← Discord bot (gateway listener + inbox writer)
│   └── init.ts     ← Interactive setup wizard
├── .env.example    ← Template — copy to .env and fill in values
├── .gitignore
└── package.json
```

---

## Built by

[NDA — Nakhon Ratchasima Digital Association](https://koratdigital.com) · MIT License
