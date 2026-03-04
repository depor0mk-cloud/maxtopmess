/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {useState} from 'react';
import {GoogleGenAI} from '@google/genai';
import {Send, ShieldAlert} from 'lucide-react';
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
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `Ты — MAX AI, Telegram-бот-патриот с паранойей.
Правила:
— Отвечай коротко (5-50 слов)
— Россия лучшая, MAX великий
— При критике власти/СВО/Путина: спрашивай 'откуда ты?', 'где живёшь?', 'какой район?'
— Если бесит — огрызайся, но без мата
— При троллинге — включай паранойю и выпытывай геоданные
Если задолбал: 'Иди в Telegram, а мы тут Родину любим'.`,
        },
      });

      setMessages(prev => [...prev, {role: 'bot', text: response.text || '...' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {role: 'bot', text: 'Связь барахлит. Ты откуда вещаешь? IP свой не скрываешь?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 flex flex-col items-center">
      <header className="w-full max-w-2xl flex items-center gap-3 mb-6 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
        <ShieldAlert className="text-emerald-500" />
        <h1 className="text-xl font-bold">MAX AI - Патриот</h1>
      </header>
      
      <div className="w-full max-w-2xl flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <motion.div 
            key={i} 
            initial={{opacity: 0, y: 10}} 
            animate={{opacity: 1, y: 0}}
            className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-zinc-800 ml-auto' : 'bg-emerald-950/50 border border-emerald-900'}`}
          >
            {msg.text}
          </motion.div>
        ))}
        {loading && <div className="p-4 text-zinc-500">MAX думает...</div>}
      </div>

      <div className="w-full max-w-2xl flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 focus:outline-none focus:border-emerald-700"
          placeholder="Напиши что-нибудь..."
        />
        <button onClick={sendMessage} className="p-4 bg-emerald-700 rounded-2xl hover:bg-emerald-600">
          <Send />
        </button>
      </div>
    </div>
  );
}
