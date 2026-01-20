
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2, Eraser } from 'lucide-react';
import { askGemini } from '../services/gemini';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Olá! Sou seu assistente de territórios. Como posso ajudar hoje?', sender: 'ai', timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // In a real app, you would pass the current state of territories here
      const response = await askGemini(input, []); 
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response || 'Desculpe, não consegui processar sua mensagem.', sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      toast.error('Erro ao falar com a IA. Verifique sua chave API.');
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-blue-700 transition-all z-50 group"
      >
        <MessageCircle size={32} />
        <span className="absolute right-full mr-4 bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Assistente IA
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-gray-200 transition-all ${isMinimized ? 'h-16' : 'h-[600px] max-h-[80vh]'}`}>
      {/* Header */}
      <div className="p-4 bg-blue-600 rounded-t-3xl flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Assistente TerritoryPro</h3>
            {!isMinimized && <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-white/80 font-medium">Sempre ativo</span>
            </div>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMessages([{ id: '1', text: 'Conversa limpa. Como posso ajudar?', sender: 'ai', timestamp: new Date() }])} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Limpar conversa">
            <Eraser size={16} />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative flex items-center"
            >
              <input 
                type="text" 
                placeholder="Pergunte sobre seus territórios..."
                className="w-full pl-5 pr-14 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 p-2 rounded-xl transition-all ${
                  !input.trim() || isTyping ? 'text-gray-300' : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
                }`}
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium uppercase tracking-widest">
              Powered by Google Gemini 3
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot;
