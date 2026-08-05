import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, HelpCircle, ArrowRight, DollarSign, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "As-salamu alaykum! I am your PakCar AI Assistant. I can help you find cars, compare specifications, calculate estimated car finance loans, suggest insurance, and provide expert buying advice. What are you looking for today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        "Find a reliable car under 25 Lakh",
        "Compare Honda Civic vs Toyota Corolla",
        "Explain Car Loan / Lease options",
        "What is the best fuel average hatchback?"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate/call AI response
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      });
      
      const data = await response.json();
      let aiText = '';
      let suggestedPrompts: string[] = [];

      const query = textToSend.toLowerCase();
      if (query.includes('compare') || query.includes('vs')) {
        aiText = `Comparison recommendation:\n\nBased on Pakistani market values, **Toyota Corolla** offers unmatched suspension durability and highest resale liquidity in rural/urban areas. However, **Honda Civic** provides superior high-speed handling, modern cosmetic styling, and higher engine performance.\n\nLet me know if you would like to compare specific variants on our Compare tab!`;
        suggestedPrompts = ["Compare Suzuki Alto vs Cultus", "Show cars under 45 Lakh"];
      } else if (query.includes('loan') || query.includes('lease') || query.includes('finance') || query.includes('interest')) {
        aiText = `For Pakistani car financing (as of 2026):\n\n- **KIBOR Rates**: Typically 15% - 21% depending on the commercial bank (Meezan, HBL, Bank Alfalah).\n- **Down Payment**: Minimum 30% required for local assembled vehicles.\n- **Tenure**: Maximum 5 years for engines under 1000cc, and 3 years for vehicles above 1000cc.\n- **Estimated Monthly Installment (EMI)**: For a 25 Lakh car with 30% down payment (7.5 Lakh) over 3 years, expected monthly payment is roughly **55,000 - 65,000 PKR**.\n\nWould you like me to find cars matching a specific budget?`;
        suggestedPrompts = ["Show cars under 25 Lakh", "Best hybrid cars in Pakistan"];
      } else if (query.includes('insurance')) {
        aiText = `Car Insurance in Pakistan typically costs **1.5% to 2.5%** of the vehicle market value annually. Key providers include TPL Insurance, Jubilee, and EFU.\n\nFor a **30 Lakh PKR Suzuki Cultus**, yearly premium would range between **45,000 and 60,000 PKR**, offering comprehensive theft, third-party damage, and accidental coverage.`;
        suggestedPrompts = ["Find cars under 30 Lakh", "Toyota Yaris options"];
      } else {
        // Direct search result conversion from AI search
        const carCount = data.results?.length || 0;
        aiText = `${data.reasoning}\n\nI found **${carCount} matching vehicles** in our database right now. You can check them on the main Browse listings page!`;
        
        if (data.results && data.results.length > 0) {
          aiText += `\n\nTop Matches:\n` + data.results.slice(0, 3).map((c: any) => `• **${c.year} ${c.make} ${c.model} ${c.variant}** - ${c.price.toLocaleString()} PKR (${c.city})`).join('\n');
        }
        suggestedPrompts = ["Show white automatic Civic", "Under 15 Lakh hatchbacks"];
      }

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "I experienced a connection issue, but here is a tip: In Pakistan, fuel efficiency is key! Small 660cc cars like the Suzuki Alto can yield up to 18-22 km/L in city traffic.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="floating-ai-widget-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[8px] font-black items-center justify-center text-white">AI</span>
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-widget-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none flex items-center gap-1.5">
                    PakCar AI Concierge
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-medium">● Online Agent</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Render suggested prompts if available and last message */}
                  {msg.sender === 'assistant' && msg.suggestedPrompts && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.suggestedPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(prompt)}
                          className="text-left text-[11px] font-medium bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 px-2.5 py-1.5 rounded-full transition-all flex items-center gap-1 shadow-sm"
                        >
                          <HelpCircle className="h-3 w-3" />
                          <span>{prompt}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none flex items-center space-x-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Footer Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about price, lease, compare models..."
                className="flex-1 min-w-0 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
