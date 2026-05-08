/**
 * Interactive setup wizard for Discord ↔ Claude Code Bridge.
 * Run once: node --experimental-strip-types src/init.ts
 * Creates a .env file with your configuration.
 */

import { writeFileSync, existsSync } from "fs";
import { createInterface } from "readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> =>
  new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

console.log("\n╔══════════════════════════════════════════════╗");
console.log("║  Discord ↔ Claude Code Bridge — Setup Wizard ║");
console.log("╚══════════════════════════════════════════════╝\n");

if (existsSync(".env")) {
  const overwrite = await ask(".env already exists. Overwrite? (y/N): ");
  if (overwrite.toLowerCase() !== "y") {
    console.log("Aborted.");
    process.exit(0);
  }
}

console.log("You'll need:\n  • A Discord bot token (discord.com/developers/applications)\n  • Message Content Intent enabled on the bot\n");

const token     = await ask("1. Discord Bot Token: ");
const guildId   = await ask("2. Discord Guild (Server) ID: ");
const channelId = await ask("3. Channel ID to watch: ");
const roleId    = await ask("4. Allowed Role ID (leave blank = anyone): ");
const inbox     = await ask("5. Inbox file path [/tmp/discord-bridge-inbox.jsonl]: ");

const env = [
  `DISCORD_BOT_TOKEN=${token}`,
  `DISCORD_GUILD_ID=${guildId}`,
  `DISCORD_CHANNEL_ID=${channelId}`,
  roleId   ? `ALLOWED_ROLE_ID=${roleId}` : `# ALLOWED_ROLE_ID=`,
  `INBOX_FILE=${inbox || "/tmp/discord-bridge-inbox.jsonl"}`,
].join("\n") + "\n";

writeFileSync(".env", env, "utf8");
rl.close();

console.log("\n✓ .env written.");
console.log("\nNext steps:");
console.log("  1. npm install");
console.log("  2. Start bot:   npm run bot");
console.log("  3. In your Claude Code session, run /loop with this prompt:\n");
console.log(`─────────────────────────────────────────────────────────────
/loop Watch ${inbox || "/tmp/discord-bridge-inbox.jsonl"} for new Discord messages.
When a message arrives, show it as [Discord] @author: content,
respond helpfully, send the reply back to Discord channel ${channelId}
using Bot token from env, and mark the message ID as processed.
─────────────────────────────────────────────────────────────\n`);
