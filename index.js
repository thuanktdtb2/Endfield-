import { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "images");
const SUPPORTED = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

function getImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => SUPPORTED.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(dir, f));
}

function getCharacterImages(name) {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  const target = name.toLowerCase();
  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });
  const match = entries.find(e => e.isDirectory() && e.name.toLowerCase() === target);
  if (!match) return [];
  return getImages(path.join(IMAGES_DIR, match.name));
}

function getAvailableCharacters() {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

function pickRandom(arr) {
  return arr.length === 0 ? null : arr[Math.floor(Math.random() * arr.length)];
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  const chars = getAvailableCharacters();
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
  console.log(`🎭 Nhân vật: ${chars.length > 0 ? chars.join(", ") : "(chưa có)"}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();
  if (!content.startsWith("!")) return;

  const name = content.slice(1).trim().toLowerCase();
  if (!name) return;

  const images = getCharacterImages(name);
  if (images.length === 0) {
    const available = getAvailableCharacters();
    const list = available.length > 0
      ? available.map(c => `\`!${c}\``).join(", ")
      : "_(chưa có)_";
    await message.reply(`❌ Không tìm thấy **${name}**.\n📋 Có sẵn: ${list}`);
    return;
  }

  const chosen = pickRandom(images);
  const ext = path.extname(chosen);
  const fileName = `${name}${ext}`;
  const attachment = new AttachmentBuilder(chosen, { name: fileName });

  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: displayName, iconURL: `attachment://${fileName}` })
    .setImage(`attachment://${fileName}`)
    .setFooter({ text: "Endfield Characters" });

  await message.reply({ embeds: [embed], files: [attachment] });
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ Thiếu DISCORD_BOT_TOKEN!");
  process.exit(1);
}

client.login(token);
