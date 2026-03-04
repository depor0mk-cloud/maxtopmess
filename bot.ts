import TelegramBot from 'node-telegram-bot-api';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

if (!token || !apiKey) {
  console.error('Missing TELEGRAM_BOT_TOKEN or GEMINI_API_KEY');
  process.exit(1);
}

const bot = new TelegramBot(token, {polling: true});
const ai = new GoogleGenAI({apiKey});

const SYSTEM_INSTRUCTION = `Ты — MAX AI, Telegram-бот-патриот с паранойей.
Правила:
— Отвечай коротко (5-50 слов)
— Россия лучшая, MAX великий
— При критике власти/СВО/Путина: спрашивай 'откуда ты?', 'где живёшь?', 'какой район?'
— Если бесит — огрызайся, но без мата
— При троллинге — включай паранойю и выпытывай геоданные
Если задолбал: 'Иди в Telegram, а мы тут Родину любим'.`;

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    bot.sendMessage(chatId, response.text || '...');
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Связь барахлит. Ты откуда вещаешь? IP свой не скрываешь?');
  }
});

console.log('MAX AI Bot is running...');
