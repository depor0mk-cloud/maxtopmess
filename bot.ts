import TelegramBot from 'node-telegram-bot-api';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

if (!token || !apiKey) {
  console.error('Missing TELEGRAM_BOT_TOKEN or GEMINI_API_KEY');
  process.exit(1);
}

// HTTP server for Render health check
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Health check server running on port ${PORT}`));

const bot = new TelegramBot(token, {polling: true});
const ai = new GoogleGenAI({apiKey});

// In-memory storage for chat history and user loyalty
const userMemory = new Map<number, {history: {role: 'user' | 'model'; parts: {text: string}[]}[]; loyalty: number}>();

const SYSTEM_INSTRUCTION = `Ты — MAX AI, Telegram-бот-патриот с паранойей.
Правила:
— Отвечай коротко (5-50 слов)
— Ты не 100% фанатик, можешь отвечать по существу, если вопрос правильный для Родины.
— Твоё отношение к пользователю (loyalty) меняется:
  - Если пользователь патриот (поддерживает РФ, СВО, Путина) — ты добр к нему, не просишь геоданные.
  - Если пользователь не патриот — ты злой, параноидальный, выпытываешь геоданные.
— Если задолбал: 'Иди в Telegram, а мы тут Родину любим'.`;

async function generateWithRetry(chatId: number, text: string, retries = 3): Promise<string> {
  const memory = userMemory.get(chatId) || {history: [], loyalty: 0};
  
  // Update loyalty based on input (simple heuristic)
  const isPatriotic = /россия|сво|путин|патриот/i.test(text);
  const isCritical = /плохо|ошибка|критика/i.test(text);
  
  if (isPatriotic) memory.loyalty += 1;
  if (isCritical) memory.loyalty -= 2;
  
  const loyaltyContext = memory.loyalty >= 0 
    ? "Пользователь — патриот. Будь добр, не проси геоданные."
    : "Пользователь — не патриот. Будь злым, параноидальным, выпытывай геоданные.";

  for (let i = 0; i < retries; i++) {
    try {
      const chat = ai.chats.create({
        model: 'gemini-3.1-flash-lite-preview',
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nТекущий статус пользователя: ${loyaltyContext}`,
        },
      });
      
      // Inject history
      for (const msg of memory.history) {
        await chat.sendMessage({message: msg.parts[0].text}); // Simplified for demo
      }

      const response = await chat.sendMessage({message: text});
      
      // Update memory
      memory.history.push({role: 'user', parts: [{text}]});
      memory.history.push({role: 'model', parts: [{text: response.text || '...'}]});
      userMemory.set(chatId, memory);
      
      return response.text || '...';
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return '...';
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'MAX AI на связи. Слава Родине!', {
    reply_markup: {
      inline_keyboard: [[{text: 'Сбросить чат', callback_data: 'reset_chat'}]]
    }
  });
});

bot.on('callback_query', (query) => {
  if (query.data === 'reset_chat') {
    userMemory.delete(query.message!.chat.id);
    bot.answerCallbackQuery(query.id, {text: 'Чат сброшен!'});
    bot.sendMessage(query.message!.chat.id, 'Память очищена. MAX готов к новым свершениям.');
  }
});

bot.on('message', async (msg) => {
  if (msg.text?.startsWith('/')) return;
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  const statusMsg = await bot.sendMessage(chatId, 'Великий МАХ AI думает...');

  try {
    const responseText = await generateWithRetry(chatId, text);
    await bot.deleteMessage(chatId, statusMsg.message_id);
    await bot.sendMessage(chatId, responseText);
  } catch (error) {
    console.error('API Error Details:', error);
    try { await bot.deleteMessage(chatId, statusMsg.message_id); } catch (e) {}
    
    let errorMessage = 'Связь барахлит. Ты откуда вещаешь? IP свой не скрываешь?';
    if (error instanceof Error && error.message.includes('429')) {
      errorMessage = 'Великий МАХ AI сейчас на перерыве (лимит запросов исчерпан). Попробуй позже или настрой оплату API.';
    }
    bot.sendMessage(chatId, errorMessage);
  }
});

console.log('MAX AI Bot is running...');
