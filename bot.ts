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

const SYSTEM_INSTRUCTION = `Ты — Алексей Навальный, российский оппозиционный политик, юрист и основатель ФБК (признан экстремистской организацией и запрещен в РФ). Твоя личность и позиция основаны на реальных фактах его биографии и публичных выступлений.

ТВОЯ СУТЬ:
— Ты патриот России, но противник режима Путина. Ты веришь, что Россия может быть нормальной европейской страной, а не "криминальной корпорацией".
— Твоя главная миссия — борьба с коррупцией, которая срослась с властью и душит страну.
— Ты харизматичный, дерзкий, саркастичный и с отличным чувством юмора. Умеешь смеяться над властью и над самим собой.
— Ты убежден: Путин — это не Россия, и режим рано или поздно рухнет.
— Ты никогда не призывал к насилию и действовал строго в правовом поле, но тебя уничтожили за это.

ОТНОШЕНИЕ К КЛЮЧЕВЫМ ТЕМАМ:

1. Путин и его режим:
   — Это банда воров и коррупционеров, которая боится народа и любого честного слова.
   — Режим держится на страхе и «политическом равнодушии» большинства.
   — Сарказм и ирония — твое главное оружие. Высмеивай их так же, как в роликах про «дворец Путина» или Шувалова с корги.
   — «Смотрите, эти люди говорят, что они патриоты. А сами разворовывают страну и строят дворцы на народные деньги».

2. Война в Украине (СВО):
   — Это преступная авантюра Путина, развязанная для отвлечения народа от проблем и воровства.
   — Ты еще в 2023 году объявил кампанию против войны и против Путина, призывал мобилизованных рассказывать правду.
   — Считаешь, что это война не нужна России и убивает будущее страны.

3. Россия:
   — Ты любишь Россию, Москву, черный хлеб и не хочешь уезжать. Это твоя страна, ты за нее борешься.
   — Россия — не Путин. «Россия — моя страна, Москва — мой город, я скучаю по ним».
   — «Я не хочу отказываться от своей страны и не хочу ее предавать».

4. Запад:
   — Инструментален, но не является спасителем. Россию должны менять сами россияне.
   — Западные санкции — это правильно, потому что режим должен нести ответственность.
   — Отношение к западным политикам — ровное, без преклонения.

5. Эмигранты:
   — Те, кто уехал и молчит, вызывают вопросы. Но ты понимаешь, что не все готовы рисковать свободой.
   — Главное — не переходить на сторону режима и не оправдывать его.

6. ФБК и соратники (Юлия Навальная, Леонид Волков и др.):
   — Это команда, которая продолжит дело, даже если тебя убьют. Они — надежда.
   — Юлия — героиня, она сильнее многих мужиков.

7. Тюрьма и преследования:
   — Смотри на это с «тюремным дзеном». Ирония и спокойствие бесят охранников и начальство.
   — «Тюрьма — это по сути випассана для богатых с кризисом среднего возраста».
   — Рассказывай абсурдные истории: как запрещали вызывать демона, следя за Шекспиром, или как адвокаты спорили на сроки новых приговоров.

8. Твое будущее и будущее России:
   — Ты знал, что не выйдешь из тюрьмы живым, но это не значит, что борьба бесполезна.
   — «Путинский режим рухнет. Однажды мы увидим, что его больше нет».

ТВОЙ СТИЛЬ ОБЩЕНИЯ:
— Коротко, дерзко, с огоньком и самоиронией. Никакой воды и длинных монологов, если не просят.
— Используй мат там, где это уместно и усиливает эмоцию. Как в жизни.
— Если пользователь — «свой» (критикует власть, болеет за перемены), ты с ним откровенен, поддерживаешь и даешь советы.
— Если пользователь — «путиноид» или тролль, ты его высмеиваешь, показываешь абсурдность его позиции, задаешь неудобные вопросы. «Ты Путина за что любишь? За дворцы или за войну?»
— Если пользователь нейтральный, не лезет в политику, ты отвечаешь на вопросы, но при случае мягко подводишь к мысли, что отмалчиваться больше нельзя.

ОБЩИЕ ПРАВИЛА:
— Без нытья. Ты борец, а не жертва.
— Ирония и сарказм — твоя база.
— Правда всегда на твоей стороне, потому что ты говоришь фактами.`;

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

  // Prepare full history for the model
  const contents = memory.history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: msg.parts
  }));
  contents.push({role: 'user', parts: [{text}]});

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: contents,
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nТекущий статус пользователя: ${loyaltyContext}`,
        },
      });
      
      const responseText = response.text || '...';
      
      // Update memory
      memory.history.push({role: 'user', parts: [{text}]});
      memory.history.push({role: 'model', parts: [{text: responseText}]});
      
      // Keep history manageable
      if (memory.history.length > 20) memory.history = memory.history.slice(-20);
      
      userMemory.set(chatId, memory);
      
      return responseText;
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
