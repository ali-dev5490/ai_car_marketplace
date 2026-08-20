import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, HelpCircle, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, Car } from '../types';

const CHAT_STORAGE_KEY = 'pakcar_ai_concierge_chat';

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function welcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    sender: 'assistant',
    text: "As-salamu alaykum! I am your PakCar AI Assistant. I can help you find cars, compare specifications, calculate estimated car finance loans, suggest insurance, and provide expert buying advice. What are you looking for today?",
    timestamp: nowTime(),
    suggestedPrompts: [
      "Find a reliable car under 25 Lakh",
      "Compare Honda Civic vs Toyota Corolla",
      "Explain Car Loan / Lease options",
      "What is the best fuel average hatchback?"
    ]
  };
}

function loadSessionChat(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [welcomeMessage()];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore broken storage
  }
  return [welcomeMessage()];
}

function saveSessionChat(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // ignore quota errors
  }
}

function carPageHref(id: number) {
  return `/cars/${id}`;
}

function stripListingDump(text: string) {
  return text
    .replace(/\n*(?:Top Matches|Live listings|Recommended live listings)[:\s]*[\s\S]*$/i, '')
    .trim();
}

function renderMessageText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function localConciergeReply(prompt: string): { reply: string; suggestedPrompts: string[] } {
  const p = prompt.toLowerCase();
  if (p.includes('compare') || /\bvs\b/.test(p) || p.includes('versus')) {
    return {
      reply: `In the Pakistani market, **Toyota Corolla** is usually the safer long-term pick: softer suspension, cheap parts, and the strongest resale. **Honda Civic** feels sharper at speed, looks more modern, and has stronger engine performance, but parts and insurance cost more.\n\nIf you tell me your budget and city, I can point you to specific variants worth inspecting.`,
      suggestedPrompts: ['Find a reliable car under 25 Lakh', 'Compare Suzuki Alto vs Cultus', 'Explain Car Loan / Lease options']
    };
  }
  if (/\b(loan|lease|finance|interest|emi|installment)\b/.test(p)) {
    return {
      reply: `Typical Pakistani car finance in 2026:\n\n• Banks usually price around KIBOR, so effective rates often land near **15%–21%** (Meezan, HBL, Bank Alfalah, etc.).\n• Down payment is commonly **30%** for locally assembled cars.\n• Tenure is often up to **5 years** for engines under 1000cc, and about **3 years** above that.\n• Example: a 25 Lakh car with 30% down (7.5 Lakh) over 3 years is roughly **55,000–65,000 PKR** per month.\n\nShare your budget and down payment and I can estimate a tighter EMI.`,
      suggestedPrompts: ['Find a reliable car under 25 Lakh', 'Best fuel-efficient hatchbacks']
    };
  }
  if (p.includes('insurance')) {
    return {
      reply: `Comprehensive car insurance in Pakistan is typically about **1.5%–2.5%** of market value per year. Common providers include TPL, Jubilee, and EFU.\n\nExample: a 30 Lakh Cultus often costs **45,000–60,000 PKR** a year for theft, accident, and third-party cover. Tracker installation is usually required.`,
      suggestedPrompts: ['Find cars under 30 Lakh', 'Explain Car Loan / Lease options']
    };
  }
  if (/\b(fuel|average|mileage|hybrid|hatch)\b/.test(p)) {
    return {
      reply: `For city fuel average in Pakistan, small hatchbacks still win. **Suzuki Alto** and **Cultus** are the usual daily-drive picks (often 16–22 km/L depending on traffic). A used **Toyota Aqua/Prius** hybrid beats them on mixed driving if your budget stretches.\n\nTell me your budget in Lakh and city and I will shortlist live listings.`,
      suggestedPrompts: ['Find a reliable car under 25 Lakh', 'Show automatic cars under 35 Lakh']
    };
  }
  return {
    reply: `I can help with that. Tell me your **budget in Lakh**, preferred **city**, and whether you want a hatchback, sedan, or SUV — I will recommend options from the marketplace.`,
    suggestedPrompts: ['Find a reliable car under 25 Lakh', 'Compare Honda Civic vs Toyota Corolla', 'Explain Car Loan / Lease options']
  };
}

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadSessionChat);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasRealHistory = messages.some(m => m.id !== 'welcome');

  useEffect(() => {
    saveSessionChat(messages);
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !messagesEndRef.current) return;
    if (messages.length === 1 && messages[0]?.id === 'welcome') return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleClearChat = () => {
    const next = [welcomeMessage()];
    setMessages(next);
    saveSessionChat(next);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: nowTime()
    };

    const history = messages
      .filter(m => m.id !== 'welcome')
      .slice(-8)
      .map(m => ({ role: m.sender, text: m.text }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend, history })
      });

      if (!response.ok) throw new Error('Chat API failed');
      const data = await response.json();
      const listings: Car[] = Array.isArray(data.results) ? data.results.slice(0, 3) : [];
      const rawReply = typeof data.reply === 'string' && data.reply.trim()
        ? data.reply.trim()
        : 'I could not build a full answer just now. Tell me your budget in Lakh and preferred city, and I will recommend cars.';

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: listings.length > 0 ? stripListingDump(rawReply) || rawReply : rawReply,
        timestamp: nowTime(),
        suggestedPrompts: Array.isArray(data.suggestedPrompts) ? data.suggestedPrompts.slice(0, 4) : [],
        results: listings
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const fallback = localConciergeReply(textToSend);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: fallback.reply,
        timestamp: nowTime(),
        suggestedPrompts: fallback.suggestedPrompts
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-widget-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden"
          >
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
              <div className="flex items-center gap-1">
                {hasRealHistory && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="Clear chat"
                    className="text-slate-400 hover:text-white transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, index) => (
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
                    <p className="whitespace-pre-line">{renderMessageText(msg.text)}</p>
                    <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'assistant' && msg.results && msg.results.length > 0 && (
                    <div className="mt-2 w-full max-w-[90%] space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 px-0.5">Top matches</p>
                      {msg.results.map((car) => (
                        <a
                          key={car.id}
                          href={carPageHref(car.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-3 py-2 text-left shadow-sm transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-900 truncate">
                              {car.year} {car.make} {car.model} {car.variant}
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold">
                              {(car.price / 100000).toFixed(1)} Lakh PKR
                              <span className="text-slate-400 font-medium"> · {car.city}</span>
                            </p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        </a>
                      ))}
                    </div>
                  )}

                  {msg.sender === 'assistant' && msg.suggestedPrompts && index === messages.length - 1 && !isLoading && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.suggestedPrompts.map((prompt, promptIndex) => (
                        <button
                          key={promptIndex}
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
