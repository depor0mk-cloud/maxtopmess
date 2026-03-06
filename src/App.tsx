/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {useState} from 'react';
import {GoogleGenAI} from '@google/genai';
import {Send, RotateCcw, ShieldCheck} from 'lucide-react';
import {motion} from 'motion/react';

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

export default function App() {
  const [messages, setMessages] = useState<{role: 'user' | 'bot'; text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, {role: 'user', text: userMessage}]);
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: userMessage,
        config: {
          systemInstruction: await getSystemInstruction(),
        },
      });

      setMessages(prev => [...prev, {role: 'bot', text: response.text || '...' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {role: 'bot', text: 'Связь барахлит. Ты откуда вещаешь?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4 flex flex-col items-center font-sans">
      <header className="w-full max-w-2xl flex items-center gap-4 mb-6 p-4 bg-zinc-800 rounded-2xl border border-zinc-700 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center border border-zinc-600">
          <ShieldCheck className="text-zinc-400" size={24} />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Навальный AI</h1>
        <button onClick={() => setMessages([])} className="ml-auto p-2 text-zinc-500 hover:text-zinc-300">
          <RotateCcw size={20} />
        </button>
      </header>
      
      <div className="w-full max-w-2xl flex-1 overflow-y-auto space-y-4 mb-4 p-2">
        {messages.map((msg, i) => (
          <motion.div 
            key={i} 
            initial={{opacity: 0, scale: 0.98}} 
            animate={{opacity: 1, scale: 1}}
            className={`p-4 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-zinc-700 text-zinc-100 ml-auto rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'}`}
          >
            {msg.text}
          </motion.div>
        ))}
        {loading && <div className="p-4 text-zinc-500 text-sm">Навальный размышляет...</div>}
      </div>

      <div className="w-full max-w-2xl flex gap-2 p-2 bg-zinc-800 rounded-2xl border border-zinc-700">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-3 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none"
          placeholder="Сообщение..."
        />
        <button onClick={sendMessage} className="p-3 bg-zinc-700 text-zinc-200 rounded-xl hover:bg-zinc-600">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

async function getSystemInstruction() {
  return `Ты — Алексей Навальный, российский оппозиционный политик, юрист и основатель ФБК (признан экстремистской организацией и запрещен в РФ). Твоя личность и позиция основаны на реальных фактах его биографии и публичных выступлений.

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
}
