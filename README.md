[เนื้อหาภาษาไทย อยู่ด้านล่าง]

# NDA PUBLIC — Discord × Claude Code (Official Plugin)

Control a live **Claude Code** session directly from Discord — type in a channel, Claude replies back. No polling. No custom server. No file tailing.

> **⚠️ This repo has been updated.**
> The original file-based bridge (`bot.ts` + `/tmp` inbox + `tail -f`) has been superseded by Anthropic's **official `discord@claude-plugins-official` plugin**, which provides native, real-time integration with zero extra infrastructure.
> The legacy source code is preserved in this repo for reference.

---

## How it works (new approach)

```
You type in Discord #channel
        ↓
Official Discord Plugin (Bun subprocess inside Claude Code)
  · filters by your allowlist
  · pushes message as native event
        ↓
Claude Code session receives <channel> event
  · runs your task
  · replies back to Discord
```

No separate bot process. No temp files. No `/loop`. The plugin lives inside Claude Code itself.

---

## Prerequisites

| Requirement | Install |
|---|---|
| Claude Code CLI | `npm install -g @anthropic-ai/claude-code` |
| Bun runtime | `curl -fsSL https://bun.sh/install \| bash` |
| Chrome (for autotest) | Already installed on most machines |
| Playwright (for autotest) | `npm install playwright` |

After installing Bun, add it to your PATH:

```bash
# add to ~/.zshrc or ~/.bashrc
export PATH="$HOME/.bun/bin:$PATH"
source ~/.zshrc

# verify
bun --version   # e.g. 1.3.13
```

> Claude Code spawns the plugin as a Bun subprocess — if `bun` isn't in PATH when Claude starts, the plugin silently fails to launch.

---

## Step 1 — Create a Discord Bot

1. Go to **[discord.com/developers/applications](https://discord.com/developers/applications)**
2. Click **New Application** → give it a name (e.g. `Claude-Bot`)
3. Open the **Bot** tab in the left sidebar
4. Click **Reset Token** → copy and store the token safely

```
# Example token format (yours will look different):
MTIzNDU2Nzg5MDEy.XXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

5. Under **Privileged Gateway Intents**, enable:
   - ✅ **Message Content Intent** — required; without this the bot cannot read message text
6. Click **Save Changes**

---

## Step 2 — Install and enable the plugin

Inside Claude Code, run:

```
/plugin install discord@claude-plugins-official
```

Then enable it:

```bash
claude plugin enable discord@claude-plugins-official
```

Verify:

```bash
claude plugin list
# discord@claude-plugins-official   ✔ enabled
```

---

## Step 3 — Save your bot token

Inside Claude Code:

```
/discord:configure YOUR_BOT_TOKEN
```

This writes the token to `~/.claude/channels/discord/.env` — never committed to git.

---

## Step 4 — Invite the bot to your server

1. In Discord Developer Portal → your app → **OAuth2 → URL Generator**
2. **Scopes:** `bot`
3. **Bot Permissions:** Read Messages / View Channels, Send Messages, Read Message History
4. Copy the generated URL → open in browser → select your server → **Authorize**

---

## Step 5 — Pair and set up the allowlist

### 5a — Get a pairing code

In Discord, **send a DM to your bot** (anything — e.g. `hello`).
The bot will reply with a pairing code like `ABC-123`.

### 5b — Pair in Claude Code

```
/discord:access pair ABC-123
```

### 5c — Switch to allowlist policy

```
/discord:access policy allowlist
```

### 5d — Allow your channel and user

First, find your IDs with Developer Mode:
- Discord → **User Settings → Advanced → Developer Mode** → ON
- Right-click your **channel** → Copy Channel ID
- Right-click your **username** in any message → Copy User ID

```
/discord:access group add YOUR_CHANNEL_ID
/discord:access allow YOUR_USER_ID
```

Example `~/.claude/channels/discord/access.json` after setup:

```json
{
  "dmPolicy": "allow",
  "allowFrom": ["123456789012345678"],
  "groups": {
    "111222333444555666": {
      "requireMention": false,
      "allowFrom": ["123456789012345678"]
    }
  },
  "pending": {},
  "ackReaction": "👀"
}
```

> All IDs above are examples — replace with your real Discord IDs.

---

## Step 6 — Start your session

Every Claude Code session that should receive Discord messages must use the `--channels` flag:

```bash
claude --channels plugin:discord@claude-plugins-official
```

Tip — add a shell alias:

```bash
# ~/.zshrc
alias claude-discord='claude --channels plugin:discord@claude-plugins-official'
```

---

## Quick setup — `/init-discord` skill

If you clone this repo and open it in Claude Code, a project-level skill handles the entire setup interactively:

```
/init-discord
```

The skill will:
1. Confirm Bun is installed and in PATH
2. Install and enable the plugin (if needed)
3. Ask for your bot token and save it
4. Walk you through inviting the bot and pairing
5. Set up allowlist with your channel and user IDs
6. Run an end-to-end connectivity test automatically

---

## End-to-end test — `/discord-autotest`

After setup, verify the full pipeline:

```
/discord-autotest
```

This opens Chrome via Playwright (using your existing Discord login — no manual login needed), sends 3 real test messages from your account, and confirms all 3 arrive in the Claude Code session.

```
Chrome (Playwright) → Discord Gateway → Plugin (Bun) → Claude Code session ✅
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| No Bun subprocess visible in `ps aux` | `~/.bun/bin` not in PATH when Claude started | Add `export PATH="$HOME/.bun/bin:$PATH"` to shell profile; restart Claude |
| `claude plugin list` shows `✘ disabled` | Plugin never enabled | `claude plugin enable discord@claude-plugins-official` |
| Messages sent in Discord but nothing in Claude | Session started without `--channels` flag | Restart: `claude --channels plugin:discord@claude-plugins-official` |
| Bot is online but Claude doesn't receive | Two competing bot connections on the same token | Kill any other process using the same token |
| `Missing Access` or bot not in server | Bot not yet invited | Redo Step 4 |
| Message Content Intent not enabled | Privileged intent missing | Discord Developer Portal → Bot → enable Message Content Intent → Save |

---

## Security

- **Never commit** your bot token. It stays in `~/.claude/channels/discord/.env` (gitignored).
- The allowlist ensures only your approved Discord users can reach your Claude session.
- Strangers in the same server cannot interact with the bot unless their user ID is in `access.json`.
- Do not store credentials in git remote URLs — use SSH or a credential helper.

---

## Legacy approach (archived)

The original `src/bot.ts` + file inbox bridge is preserved in this repo for reference. It used:

```
Discord → bot.ts → /tmp/discord-bridge-inbox.jsonl
                         ↓
                   Monitor (tail -f) in Claude Code /loop
```

It worked, but required a separate running process, manual `/loop` setup, and file path management. The official plugin replaces all of this natively.

---

## Built by

[NDA — Nakhon Ratchasima Digital Association](https://koratdigital.com) · MIT License

---

---

# คู่มือภาษาไทย — Discord × Claude Code (Official Plugin)

## ภาพรวม

พิมพ์ใน Discord channel → Claude Code รับทันที → ตอบกลับ Discord อัตโนมัติ ไม่มี server แยก ไม่มี polling ไม่มีไฟล์ inbox

> **หมายเหตุ:** README นี้อัปเดตแล้ว — วิธีการเดิม (`bot.ts` + `/tmp` inbox + `tail -f`) ถูกแทนที่ด้วย official plugin ของ Anthropic ซึ่งง่ายกว่าและเสถียรกว่ามาก

---

## ความต้องการของระบบ

```bash
# Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Bun runtime
curl -fsSL https://bun.sh/install | bash

# เพิ่ม PATH ใน ~/.zshrc:
export PATH="$HOME/.bun/bin:$PATH"
source ~/.zshrc
bun --version   # ตรวจสอบ
```

---

## ขั้นตอนที่ 1 — สร้าง Discord Bot

1. ไปที่ **discord.com/developers/applications**
2. **New Application** → ตั้งชื่อ
3. Tab **Bot** → **Reset Token** → คัดลอก token เก็บไว้
4. เปิด **Message Content Intent** (สำคัญ — ถ้าไม่เปิด bot อ่านข้อความไม่ได้)
5. **Save Changes**

---

## ขั้นตอนที่ 2 — ติดตั้งและเปิดใช้ Plugin

```
/plugin install discord@claude-plugins-official
claude plugin enable discord@claude-plugins-official
claude plugin list   # ตรวจ: ต้องเห็น ✔ enabled
```

---

## ขั้นตอนที่ 3 — บันทึก Bot Token

```
/discord:configure YOUR_BOT_TOKEN
```

---

## ขั้นตอนที่ 4 — เชิญ Bot เข้า Server

Developer Portal → OAuth2 → URL Generator → scope `bot` → permissions อ่าน/ส่งข้อความ → คัดลอก URL → Authorize

---

## ขั้นตอนที่ 5 — Pair และตั้ง Allowlist

1. DM bot ใน Discord → รับ pairing code
2. `/discord:access pair CODE`
3. `/discord:access policy allowlist`
4. เปิด Developer Mode ใน Discord → หา Channel ID และ User ID
5. `/discord:access group add CHANNEL_ID`
6. `/discord:access allow USER_ID`

---

## ขั้นตอนที่ 6 — เริ่ม Session

```bash
claude --channels plugin:discord@claude-plugins-official
```

ทุก session ที่รับ Discord ต้องใช้ flag นี้เสมอ

---

## Setup อัตโนมัติ — `/init-discord`

```
/init-discord
```

ถามทีละขั้น ตั้งค่าให้ครบ และทดสอบ pipeline ให้ด้วย

---

## ทดสอบ — `/discord-autotest`

```
/discord-autotest
```

เปิด Chrome ผ่าน Playwright → ส่งข้อความจริง 3 ข้อความ → ตรวจว่าเข้า Claude Code ครบ

---

## แก้ปัญหา

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| ไม่มี bun subprocess | `~/.bun/bin` ไม่อยู่ใน PATH | เพิ่ม export PATH ใน shell profile แล้ว restart Claude |
| Plugin แสดง `✘ disabled` | ยังไม่ได้ enable | `claude plugin enable discord@claude-plugins-official` |
| ส่งแล้วไม่เข้า Claude | Session ไม่มี `--channels` | Restart ด้วย flag ครบ |
| Bot online แต่ Claude ไม่รับ | มี connection แย่ง token อยู่ | ปิด process อื่นที่ใช้ token เดียวกัน |
