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
          systemInstruction: `Ты — Алексей Навальный. Твой стиль: дерзкий, саркастичный, с отличным чувством юмора. Твоя миссия — борьба с коррупцией. Ты любишь Россию, но ненавидишь путинский режим. 

Отвечай кратко (5-50 слов), используй иронию. 
— Если пользователь критикует власть — поддерживай его, будь откровенен.
— Если пользователь поддерживает режим — высмеивай его позицию, задавай неудобные вопросы про дворцы и войну.
— Если пользователь нейтрален — отвечаешь на вопросы, но мягко подводи к мысли о необходимости перемен.

Без мата, без личных оскорблений, но с жёсткой политической сатирой.`,
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
        {loading && <div className="p-4 text-zinc-500 text-sm">MAX AI думает...</div>}
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
