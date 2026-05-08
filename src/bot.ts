import { Client, GatewayIntentBits, Message, TextChannel } from "discord.js";
import { appendFileSync } from "fs";

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;
const ALLOWED_ROLE_ID = process.env.ALLOWED_ROLE_ID!;
const INBOX_FILE = process.env.INBOX_FILE ?? "/tmp/discord-bridge-inbox.jsonl";

if (!TOKEN || !CHANNEL_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID in environment.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`[bridge] Bot online: ${client.user?.tag}`);
  console.log(`[bridge] Watching channel: ${CHANNEL_ID}`);
  console.log(`[bridge] Inbox: ${INBOX_FILE}`);
});

client.on("messageCreate", async (message: Message) => {
  if (message.channelId !== CHANNEL_ID) return;
  if (message.author.bot) return;
  if (!message.content.trim()) return;

  // Role gate — skip if ALLOWED_ROLE_ID is set and user doesn't have it
  if (ALLOWED_ROLE_ID && !message.member?.roles.cache.has(ALLOWED_ROLE_ID)) {
    await (message.channel as TextChannel).send(
      "> Access denied.\n> This channel is restricted to authorized operators only."
    );
    return;
  }

  // Push message into inbox file — Claude Code session picks this up via Monitor
  const entry = JSON.stringify({
    id: message.id,
    author: message.author.username,
    content: message.content.trim(),
    ts: message.createdAt.toISOString(),
  });
  appendFileSync(INBOX_FILE, entry + "\n", "utf8");
  console.log(`[bridge] Queued: ${message.id} from ${message.author.username}`);

  await (message.channel as TextChannel).send(
    `> ${message.content}\n*Received — processing in Claude Code...*`
  );
});

client.login(TOKEN);
