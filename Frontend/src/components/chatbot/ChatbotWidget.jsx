import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import api from '../../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi there! I'm the ShopSphere Assistant. How can I help you today? Try asking about 'shipping', 'track order', 'refunds', or 'payment methods'.", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/chatbot/', { message: userMsg });
      setMessages(prev => [...prev, { text: data.bot_response || data.reply, isBot: true }]);
    } catch {
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now. Please try again later.", isBot: true, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#F97316] neo-border neo-shadow-sm flex items-center justify-center text-white hover:-translate-y-1 hover:neo-shadow transition-all z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open AI Assistant"
      >
        <MessageSquare size={22} fill="currentColor" />
      </button>

      <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[550px] max-h-[82vh] flex flex-col bg-white neo-card transition-all z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none origin-bottom-right'}`}>
        {/* Header */}
        <div className="bg-[#0A0A0A] text-white p-4 flex items-center justify-between border-b-2 border-[#0A0A0A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F97316] flex items-center justify-center border border-white/20">
              <Bot size={18} />
            </div>
            <div>
               <div className="font-black text-sm leading-tight">ShopSphere AI</div>
               <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> Online
               </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:text-[#F97316] hover:bg-white/10 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center neo-border 
                  ${msg.isBot ? 'bg-[#F97316] text-white' : 'bg-white text-[#0A0A0A]'}`}>
                  {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`p-3 text-sm font-medium neo-border ${
                  msg.isBot 
                    ? msg.isError ? 'bg-red-50 text-red-900 border-red-500' : 'bg-white text-gray-800 chatbot-markdown' 
                    : 'bg-[#0A0A0A] text-white'
                }`}>
                  {msg.isBot && !msg.isError ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="flex gap-2 max-w-[85%]">
                 <div className="flex-shrink-0 w-8 h-8 bg-[#F97316] text-white flex items-center justify-center neo-border"><Bot size={16} /></div>
                 <div className="bg-white p-3 neo-border flex gap-1 items-center">
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
                 </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t-2 border-[#0A0A0A] flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Type your message..." 
            className="flex-1 neo-input px-3 py-2 text-sm font-medium"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-[#F97316] text-white flex items-center justify-center neo-btn p-0 flex-shrink-0 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
