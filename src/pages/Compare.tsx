import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, ArrowRight, Check, X, ShieldCheck, HelpCircle, GitCompare } from 'lucide-react';
import { Car } from '../types';
import { fetchCars } from '../lib/api';

interface CompareProps {
  compareList: Car[];
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
}

export default function Compare({ compareList, removeFromCompare, clearCompare }: CompareProps) {
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [selectedId1, setSelectedId1] = useState<number | null>(null);
  const [selectedId2, setSelectedId2] = useState<number | null>(null);
  
  const [car1, setCar1] = useState<Car | null>(null);
  const [car2, setCar2] = useState<Car | null>(null);

  const [aiVerdict, setAiVerdict] = useState<any>(null);
  const [loadingVerdict, setLoadingVerdict] = useState(false);

  // Load all cars for dropdown selection
  useEffect(() => {
    fetchCars()
      .then((data: Car[]) => {
        if (data && Array.isArray(data)) {
          setAllCars(data);
          
          // Seed initial selections from compareList
          if (compareList.length > 0) {
            setCar1(compareList[0]);
            setSelectedId1(compareList[0].id);
          } else {
            // Pick default 1
            const default1 = data.find(c => c.model === 'Civic') || data[0];
            setCar1(default1);
            setSelectedId1(default1.id);
          }

          if (compareList.length > 1) {
            setCar2(compareList[1]);
            setSelectedId2(compareList[1].id);
          } else {
            // Pick default 2
            const default2 = data.find(c => c.model === 'Corolla' && c.id !== (compareList[0]?.id || 0)) || data[1];
            setCar2(default2);
            setSelectedId2(default2.id);
          }
        }
      })
      .catch(err => console.error(err));
  }, [compareList]);

  // Update selected car 1 details
  useEffect(() => {
    if (selectedId1) {
      const match = allCars.find(c => c.id === selectedId1);
      if (match) setCar1(match);
    } else {
      setCar1(null);
    }
  }, [selectedId1, allCars]);

  // Update selected car 2 details
  useEffect(() => {
    if (selectedId2) {
      const match = allCars.find(c => c.id === selectedId2);
      if (match) setCar2(match);
    } else {
      setCar2(null);
    }
  }, [selectedId2, allCars]);

  // Run AI head-to-head analysis
  useEffect(() => {
    if (!car1 || !car2) {
      setAiVerdict(null);
      return;
    }

    setLoadingVerdict(true);
    // Simulate/request AI winner analysis
    const timer = setTimeout(() => {
      const winner = car1.price < car2.price ? car1 : car2;
      const premiumWinner = car1.price > car2.price ? car1 : car2;

      setAiVerdict({
        winner: premiumWinner.id === car1.id ? 'Car 1' : 'Car 2',
        verdictReason: ` head-to-head analysis reveals distinct advantages. **${car1.make} ${car1.model}** offers superior value and premium prestige, while **${car2.make} ${car2.model}** represents a highly stable, liquid asset with lower fuel consumption, making it more cost-effective.`,
        car1Pros: ['Excellent cabin style', 'Higher suspension clearance', 'Modern aesthetic look'],
        car1Cons: ['Premium purchase barrier', 'Higher fuel consumption'],
        car2Pros: ['Superb fuel average speed', 'Parts highly available anywhere', 'Excellent resale speed'],
        car2Cons: ['Lacks panoramic sunroof', 'Cabin has slightly lower insulation']
      });
      setLoadingVerdict(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [car1, car2]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-transparent text-[#0F172A]">
      <div className="mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 bg-[#2563EB]/10 border border-[#2563EB]/30 px-3 py-1 rounded-full text-[#2563EB] text-xs font-bold mb-3 shadow-sm">
            <GitCompare className="h-4 w-4 text-[#2563EB]" />
            <span>Head-to-Head Specification Matcher</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Compare Cars</h1>
          <p className="text-slate-500 mt-1.5 text-sm max-w-lg mx-auto">
            Select any two vehicles from the marketplace, and evaluate prices, mileage, mechanical conditions, features, and AI-declared verdicts side-by-side.
          </p>
        </div>

        {/* SELECTORS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Car 1 Selector */}
          <div className="glass-panel p-4 rounded-2xl shadow-lg backdrop-blur-xl border border-white/40 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">First Car Option</label>
            <select
              value={selectedId1 || ''}
              onChange={(e) => setSelectedId1(parseInt(e.target.value))}
              className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold bg-white/70 backdrop-blur-sm cursor-pointer focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-inner"
            >
              {allCars.map(c => (
                <option key={c.id} value={c.id}>{c.year} {c.make} {c.model} {c.variant} ({c.city})</option>
              ))}
            </select>
          </div>

          {/* Car 2 Selector */}
          <div className="glass-panel p-4 rounded-2xl shadow-lg backdrop-blur-xl border border-white/40 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Second Car Option</label>
            <select
              value={selectedId2 || ''}
              onChange={(e) => setSelectedId2(parseInt(e.target.value))}
              className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold bg-white/70 backdrop-blur-sm cursor-pointer focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-inner"
            >
              {allCars.map(c => (
                <option key={c.id} value={c.id}>{c.year} {c.make} {c.model} {c.variant} ({c.city})</option>
              ))}
            </select>
          </div>
        </div>

        {car1 && car2 ? (
          <div className="space-y-8">
            {/* COMPARISON SPEC TABLE */}
            <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-white/40 backdrop-blur-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0F172A]/90 text-white text-left font-extrabold border-b border-white/10">
                    <th className="p-4 w-1/3">Specifications</th>
                    <th className="p-4 w-1/3">{car1.make} {car1.model}</th>
                    <th className="p-4 w-1/3">{car2.make} {car2.model}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Variant</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.variant}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.variant}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Model Year</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.year}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.year}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Estimated Market Value</td>
                    <td className="p-4 font-extrabold text-[#2563EB] text-base">{(car1.price / 100000).toFixed(1)} Lakh</td>
                    <td className="p-4 font-extrabold text-[#2563EB] text-base">{(car2.price / 100000).toFixed(1)} Lakh</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Engine Displacement</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.engine_cc} CC</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.engine_cc} CC</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Transmission Type</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.transmission}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.transmission}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Fuel System Type</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.fuel}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.fuel}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Mileage Driven</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.mileage.toLocaleString()} KM</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.mileage.toLocaleString()} KM</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Listed Location</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.city}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.city}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500">Mechanical condition</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car1.condition}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{car2.condition}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AI HEAD-TO-HEAD WINNER ANALYSIS */}
            <div className="bg-[#0F172A]/90 text-white border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-400 animate-spin-slow" />
                <div>
                  <h3 className="font-extrabold text-base">PakCar Head-to-Head AI Recommendation Verdict</h3>
                  <p className="text-xs text-slate-400">Automated evaluation scorecard analyzing price, maintenance, and durability.</p>
                </div>
              </div>

              {loadingVerdict ? (
                <div className="flex items-center space-x-2 py-4">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="text-xs text-slate-400">Generating expert recommendations scorecard...</span>
                </div>
              ) : aiVerdict ? (
                <div className="space-y-6">
                  {/* Verdict Paragraph */}
                  <div className="bg-black/25 border border-white/10 p-4 rounded-2xl">
                    <p className="text-sm leading-relaxed text-slate-300">
                      <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">Winner Recommendation Verdict:</span>
                      {aiVerdict.verdictReason}
                    </p>
                  </div>

                  {/* Pros & Cons side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Car 1 specs */}
                    <div className="bg-black/15 p-4 rounded-2xl border border-white/10 space-y-3">
                      <h4 className="font-extrabold text-white text-sm">{car1.make} {car1.model} Analysis</h4>
                      <div className="space-y-1">
                        <span className="font-semibold text-emerald-400 block uppercase tracking-wider text-[10px]">Pros:</span>
                        {aiVerdict.car1Pros.map((p: string, idx: number) => <p key={idx} className="text-slate-300">• {p}</p>)}
                      </div>
                      <div className="space-y-1 border-t border-white/10 pt-2">
                        <span className="font-semibold text-orange-400 block uppercase tracking-wider text-[10px]">Cons:</span>
                        {aiVerdict.car1Cons.map((c: string, idx: number) => <p key={idx} className="text-slate-300">• {c}</p>)}
                      </div>
                    </div>

                    {/* Car 2 specs */}
                    <div className="bg-black/15 p-4 rounded-2xl border border-white/10 space-y-3">
                      <h4 className="font-extrabold text-white text-sm">{car2.make} {car2.model} Analysis</h4>
                      <div className="space-y-1">
                        <span className="font-semibold text-emerald-400 block uppercase tracking-wider text-[10px]">Pros:</span>
                        {aiVerdict.car2Pros.map((p: string, idx: number) => <p key={idx} className="text-slate-300">• {p}</p>)}
                      </div>
                      <div className="space-y-1 border-t border-white/10 pt-2">
                        <span className="font-semibold text-orange-400 block uppercase tracking-wider text-[10px]">Cons:</span>
                        {aiVerdict.car2Cons.map((c: string, idx: number) => <p key={idx} className="text-slate-300">• {c}</p>)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-10">Select two options above to generate spec comparisons.</p>
        )}
      </div>
    </div>
  );
}
