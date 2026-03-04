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

async function generateWithRetry(text: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: text,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      return response.text || '...';
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  return '...';
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  // Send initial "thinking" message
  const statusMsg = await bot.sendMessage(chatId, 'Великий МАХ AI думает...');

  try {
    const responseText = await generateWithRetry(text);
    
    // Delete status message and send final response
    await bot.deleteMessage(chatId, statusMsg.message_id);
    await bot.sendMessage(chatId, responseText);
  } catch (error) {
    console.error('API Error Details:', error);
    
    // Attempt to delete status message even on error
    try {
      await bot.deleteMessage(chatId, statusMsg.message_id);
    } catch (e) {
      console.error('Failed to delete status message:', e);
    }
    
    let errorMessage = 'Связь барахлит. Ты откуда вещаешь? IP свой не скрываешь?';
    if (error instanceof Error && error.message.includes('429')) {
      errorMessage = 'Великий МАХ AI сейчас на перерыве (лимит запросов исчерпан). Попробуй позже или настрой оплату API.';
    } else if (error instanceof Error) {
      errorMessage = `Связь барахлит. Ошибка: ${error.message}. Ты откуда вещаешь? IP свой не скрываешь?`;
    }
    
    bot.sendMessage(chatId, errorMessage);
  }
});

console.log('MAX AI Bot is running...');
