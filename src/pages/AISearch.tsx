import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Send, Filter, Check, ArrowRight, Gauge, HelpCircle, Activity, Camera, Image, X, Sliders, ChevronRight, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car } from '../types';

interface SearchTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  filters?: any;
  results?: Car[];
  reasoning?: string;
  confidence?: number;
  suggestedQueries?: string[];
  image?: string; // Base64 thumbnail for visual search feedback
}

export default function AISearch() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<SearchTurn[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "As-salamu alaykum! Welcome to PakCar AI Search. Simply describe what you are looking for in plain words, or upload a photo of any car to find matching listings.\n\nTry searching:\n• 'I need a family car in Lahore under 20 lakhs'\n• 'Show white automatic Suzuki Swift'\n• 'Best fuel average hybrid under 30 lakhs'",
      suggestedQueries: [
        "I need a car under 20 lakhs in Lahore?",
        "Show automatic Suzuki cars in Pakistan",
        "Best fuel-efficient hybrid cars"
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, loading]);

  // Check for home-page preloaded query
  useEffect(() => {
    const preloadedQuery = searchParams.get('q');
    if (preloadedQuery && turns.length === 1) {
      handleSearchSubmit(preloadedQuery);
    }
  }, [searchParams]);

  // Extract the latest assistant results to show in the Desktop Side Hub
  const latestAssistantTurn = [...turns].reverse().find(t => t.sender === 'assistant' && t.results && t.results.length > 0);
  const activeResults = latestAssistantTurn?.results || [];
  const activeFilters = latestAssistantTurn?.filters || null;
  const activeReasoning = latestAssistantTurn?.reasoning || "";

  const handleSearchSubmit = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    // Add User turn
    const userTurn: SearchTurn = {
      id: Math.random().toString(),
      sender: 'user',
      text: queryText
    };

    setTurns(prev => [...prev, userTurn]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryText })
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();

      const assistantTurn: SearchTurn = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.reasoning || "Here are the best matching vehicle listings found.",
        filters: data.filters,
        results: data.results,
        reasoning: data.reasoning,
        confidence: data.confidence,
        suggestedQueries: data.suggestedQueries
      };

      setTurns(prev => [...prev, assistantTurn]);
    } catch (err) {
      console.error(err);
      const errTurn: SearchTurn = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "I experienced an issue parsing your query. What is your budget limit in Lakhs, or what brand do you prefer?"
      };
      setTurns(prev => [...prev, errTurn]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await handleImageSearchSubmit(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset file input so same file can be uploaded again
    if (e.target) e.target.value = '';
  };

  const handleImageSearchSubmit = async (base64: string) => {
    if (loading) return;

    // Add user message with image preview
    const userTurn: SearchTurn = {
      id: Math.random().toString(),
      sender: 'user',
      text: "🔍 [Visual Search] Uploaded vehicle photo to find matches",
      image: base64
    };

    setTurns(prev => [...prev, userTurn]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();

      const assistantTurn: SearchTurn = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.reasoning || "I scanned your uploaded image and fetched the most similar vehicles in our database.",
        filters: data.filters,
        results: data.results,
        reasoning: data.reasoning,
        confidence: data.confidence,
        suggestedQueries: data.suggestedQueries
      };

      setTurns(prev => [...prev, assistantTurn]);
    } catch (err) {
      console.error(err);
      const errTurn: SearchTurn = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "I was unable to analyze this car photo correctly. Could you please specify its make or model name?"
      };
      setTurns(prev => [...prev, errTurn]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-40 bg-[#F8FAFC] flex flex-col overflow-hidden font-sans">
      
      {/* Main Full-Page container splitting chat and sidebar */}
      <div className="flex-1 flex h-full w-full overflow-hidden">
        
        {/* LEFT COLUMN: THE CONVERSATIONAL CHAT SCREEN */}
        <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] border-r border-slate-200/60 relative">
          
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between bg-white shadow-sm shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm text-slate-900 leading-none">PakCar Conversational Agent</h2>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    AI Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Real-time database parser & filter assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setTurns([
                  {
                    id: 'welcome',
                    sender: 'assistant',
                    text: "As-salamu alaykum! Welcome to PakCar AI Search. Simply describe what you are looking for in plain words, or upload a photo of any car to find matching listings.\n\nTry searching:\n• 'I need a family car in Lahore under 20 lakhs'\n• 'Show white automatic Suzuki Swift'\n• 'Best fuel average hybrid under 30 lakhs'",
                    suggestedQueries: [
                      "I need a car under 20 lakhs in Lahore?",
                      "Show automatic Suzuki cars in Pakistan",
                      "Best fuel-efficient hybrid cars"
                    ]
                  }
                ])}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 rounded-lg transition-colors shadow-sm"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset Chat</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-[#F8FAFC]">
            {turns.map((turn) => (
              <div key={turn.id} className="space-y-3">
                <div className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* User turn / Assistant bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm shadow-sm ${
                    turn.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    
                    {/* User uploaded image feedback */}
                    {turn.image && (
                      <div className="mb-3 max-w-xs rounded-lg overflow-hidden border border-white/20 shadow">
                        <img src={turn.image} alt="User search visual" className="w-full h-auto object-cover max-h-48" />
                      </div>
                    )}
                    
                    <p className="whitespace-pre-line leading-relaxed font-medium">{turn.text}</p>
                    
                    {/* Assistant Reasoning detail inside chat */}
                    {turn.sender === 'assistant' && turn.confidence && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-blue-500" />
                          <span>AI Parsing Confidence: {turn.confidence}%</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline matches inside chat (mostly for tablet/mobile views) */}
                {turn.sender === 'assistant' && turn.results && turn.results.length > 0 && (
                  <div className="lg:hidden w-full pl-2 space-y-2 mt-2">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
                      <Sliders className="h-3 w-3 text-blue-500" />
                      <span>Best Matched Vehicles:</span>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin">
                      {turn.results.map((car) => (
                        <div key={car.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shrink-0 w-64 snap-align-start hover:border-blue-500/40 transition-all">
                          <div className="h-32 w-full relative bg-slate-100">
                            <img src={car.images[0]} alt={car.model} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 bg-slate-900/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm">
                              {car.city}
                            </span>
                          </div>
                          <div className="p-3.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{car.make}</span>
                            <h4 className="font-extrabold text-xs text-slate-900 truncate mt-0.5">
                              {car.model} <span className="text-[10px] font-medium text-slate-500">{car.variant}</span>
                            </h4>
                            <p className="text-sm font-black text-blue-600 mt-1">{(car.price / 100000).toFixed(1)} Lakh PKR</p>
                            
                            <div className="flex justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-2.5 mt-3">
                              <span className="font-semibold">{car.year}</span>
                              <span className="font-semibold">{car.transmission}</span>
                              <span className="font-semibold">{car.fuel}</span>
                            </div>
                            
                            <Link to={`/cars/${car.id}`} className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] py-2 rounded-lg transition-colors block mt-3.5 border border-blue-100/40">
                              View Listing Specifications
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Inline follow-up pill buttons below current response */}
                {turn.sender === 'assistant' && turn.suggestedQueries && turn.suggestedQueries.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pl-2 mt-2">
                    {turn.suggestedQueries.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearchSubmit(q)}
                        className="bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-[11px] font-bold px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex items-center space-x-1"
                      >
                        <HelpCircle className="h-3 w-3 text-blue-500" />
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-3">
                <div className="bg-white border border-slate-200/80 px-4 py-3.5 rounded-2xl rounded-bl-none flex items-center space-x-3 shadow-sm">
                  <Activity className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">PakCar AI parsing market databases...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* STICKY BOTTOM INPUT PANEL (FOOTER INPUT) */}
          <div className="p-4 md:p-6 bg-white border-t border-slate-200/60 shrink-0 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)]">
            
            {/* Real-time filters guide to help user visual feedback */}
            {activeFilters && Object.keys(activeFilters).some(k => activeFilters[k]) && (
              <div className="mb-3 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2">
                <div className="flex items-center space-x-2">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Filters Extracted:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeFilters.make && (
                    <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100">
                      Brand: {activeFilters.make}
                    </span>
                  )}
                  {activeFilters.model && (
                    <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100">
                      Model: {activeFilters.model}
                    </span>
                  )}
                  {activeFilters.priceMax && (
                    <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100">
                      Budget &lt; {(activeFilters.priceMax / 100000).toFixed(0)} Lakh
                    </span>
                  )}
                  {activeFilters.city && (
                    <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100">
                      City: {activeFilters.city}
                    </span>
                  )}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit(input);
              }}
              className="flex items-center space-x-3 max-w-4xl mx-auto"
            >
              
              {/* Image Search Camera trigger */}
              <button
                type="button"
                onClick={handleImageUploadClick}
                title="Search via Car Photo"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200/80 transition-colors shadow-sm"
              >
                <Camera className="h-5.5 w-5.5" />
              </button>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden" 
              />

              {/* Text search field */}
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question (e.g. 'i need car for sale in lahore' or 'budget is 20 laks')..."
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none rounded-xl pl-4 pr-10 py-3 text-sm text-slate-800 font-semibold bg-white shadow-inner"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 shadow-md shadow-blue-500/10 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: THE DYNAMIC LIVE RESULTS PANEL (DESKTOP GRID SIDEBAR) */}
        <div className="hidden lg:flex w-[420px] flex-col border-l border-slate-200/60 bg-white h-full relative shrink-0">
          
          {/* Sidebar title */}
          <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center space-x-2">
              <Sliders className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Live Results Panel</h3>
            </div>
            {activeResults.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700">
                {activeResults.length} Matched
              </span>
            )}
          </div>

          {/* Results Grid / Showcase */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {activeResults.length > 0 ? (
              <>
                {/* AI Reasoning overview block */}
                {activeReasoning && (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 mb-2">
                    <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                      <span>AI Verification Report</span>
                    </h4>
                    <p className="text-[11.5px] leading-relaxed text-slate-600 font-medium">{activeReasoning}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {activeResults.map((car) => (
                    <div 
                      key={car.id} 
                      className="bg-white border border-slate-200 hover:border-blue-500/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
                    >
                      <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
                        <img 
                          src={car.images[0]} 
                          alt={car.model} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <span className="absolute bottom-3 left-3 bg-slate-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm shadow-sm">
                          {car.city}
                        </span>
                        
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-100 flex items-center space-x-1 shadow">
                          <span className="text-[10px] font-black text-slate-800">★ {car.condition}</span>
                        </div>
                      </div>

                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{car.make}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{car.year}</span>
                          </div>
                          
                          <h4 className="font-extrabold text-sm text-slate-900 mt-1 leading-tight group-hover:text-blue-600 transition-colors">
                            {car.model} <span className="text-xs font-semibold text-slate-500">{car.variant}</span>
                          </h4>
                          
                          <p className="text-base font-black text-blue-600 mt-1.5">
                            {(car.price / 100000).toFixed(1)} Lakh <span className="text-[11px] font-bold text-slate-400">PKR</span>
                          </p>
                          
                          {/* Key parameters chips */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className="bg-slate-100 text-slate-600 text-[9.5px] font-extrabold px-2 py-1 rounded-lg">
                              {car.transmission}
                            </span>
                            <span className="bg-slate-100 text-slate-600 text-[9.5px] font-extrabold px-2 py-1 rounded-lg">
                              {car.fuel}
                            </span>
                            <span className="bg-slate-100 text-slate-600 text-[9.5px] font-extrabold px-2 py-1 rounded-lg">
                              {car.mileage.toLocaleString()} km
                            </span>
                          </div>
                        </div>

                        <Link 
                          to={`/cars/${car.id}`} 
                          className="w-full text-center bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all block mt-4 shadow-sm"
                        >
                          View Full Details & Contact Seller
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 mt-16">
                <div className="h-14 w-14 bg-slate-200/50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Sliders className="h-6 w-6" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">No Active Listings Loaded</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                  Start searching in the conversational panel to display matches, specifications, and pricing metrics here instantly.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
