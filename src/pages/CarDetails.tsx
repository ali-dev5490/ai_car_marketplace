import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Phone, Heart, Share2, MapPin, CheckCircle2, AlertTriangle, ArrowLeft, BarChart2, Star, ShieldCheck, HelpCircle, Activity } from 'lucide-react';
import { Car } from '../types';
import { fetchCarById, fetchCars } from '../lib/api';

interface CarDetailsProps {
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  addToCompare: (car: Car) => void;
  recentlyViewed: number[];
  addRecentlyViewed: (id: number) => void;
}

export default function CarDetails({ 
  toggleFavorite, isFavorite, addToCompare, recentlyViewed, addRecentlyViewed 
}: CarDetailsProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [betterValueCars, setBetterValueCars] = useState<Car[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPhoneRevealed(false);

    // Fetch primary car details (API or static fallback)
    fetchCarById(id)
      .then((data: Car) => {
        setCar(data);
        setActiveImage(data.images[0]);
        addRecentlyViewed(data.id);

        // Fetch AI recommendations (best-effort; fall back to local similar cars)
        fetch('/api/ai/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carId: data.id })
        })
          .then(res => res.ok ? res.json() : Promise.reject())
          .then(recData => {
            setSimilarCars(recData.similar || []);
            setBetterValueCars(recData.betterValue || []);
          })
          .catch(() => {
            fetchCars()
              .then(all => {
                setSimilarCars(
                  all
                    .filter(c => c.id !== data.id && (c.body_type === data.body_type || c.make === data.make))
                    .sort((a, b) => Math.abs(a.price - data.price) - Math.abs(b.price - data.price))
                    .slice(0, 4)
                );
                setBetterValueCars(
                  all
                    .filter(c => c.id !== data.id && c.body_type === data.body_type && c.price < data.price && c.year >= data.year)
                    .slice(0, 3)
                );
              })
              .catch(() => undefined);
          });

        // Fetch AI inspection report
        fetch('/api/ai/inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ car: data })
        })
          .then(res => (res.ok ? res.json() : Promise.reject()))
          .then(report => setAiReport(report))
          .catch(err => console.error(err));
      })
      .catch(err => {
        console.error(err);
        navigate('/browse');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleRevealPhone = () => {
    setPhoneRevealed(true);
    // Trigger simulated lead registration inside the seller dashboard
    console.log(`Buyer registered interest in car ID: ${car?.id}`);
  };

  if (loading || !car) {
    return (
      <div className="flex justify-center items-center h-96 bg-transparent text-[#0F172A]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
          <p className="text-sm font-semibold text-slate-500">Loading comprehensive technical spec sheet & AI grading...</p>
        </div>
      </div>
    );
  }

  // Create mechanical inspection bars mapping
  const inspectionItems = aiReport ? [
    { label: 'Engine & Transmission', value: aiReport.engine, color: 'bg-emerald-500' },
    { label: 'Body Paint & Exterior Structure', value: aiReport.body, color: 'bg-blue-500' },
    { label: 'Interior Comfort & Accessories', value: aiReport.interior, color: 'bg-indigo-500' },
    { label: 'Suspension, Chasis & Tyres', value: aiReport.tyres, color: 'bg-teal-500' }
  ] : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-transparent text-[#0F172A]">
      <div className="mx-auto max-w-7xl">
        {/* Back Link */}
        <Link to="/browse" className="inline-flex items-center space-x-1 text-sm font-semibold text-slate-500 hover:text-[#0F172A] mb-6 group">
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Browse Listings</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT/MID MAIN BODY: Images, Specs, Features, AI Summary */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Gallery Panel */}
            <div className="glass-card rounded-3xl p-4 shadow-xl backdrop-blur-xl border border-white/40 space-y-4">
              <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-slate-950 border border-white/10">
                <img
                  src={activeImage}
                  alt={`${car.make} ${car.model}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = car.images[1] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
                  }}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => toggleFavorite(car.id)}
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/40 text-slate-800 flex items-center justify-center shadow-md backdrop-blur-sm border border-white/45 hover:scale-105 active:scale-95 transition-all"
                >
                  <Heart className={`h-5 w-5 ${isFavorite(car.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                </button>
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-1">
                {car.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`h-20 w-32 rounded-xl overflow-hidden border-2 shrink-0 ${activeImage === img ? 'border-[#2563EB] shadow-md shadow-[#2563EB]/15' : 'border-white/20 hover:border-white/40'}`}
                  >
                    <img
                      src={img}
                      alt="car thumbnail"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
                      }}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Core Inspection / Summary */}
            <div className="bg-[#0F172A]/90 text-white border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="h-9 w-9 bg-[#2563EB] rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">PakCar Mechanical AI Grading</h2>
                  <p className="text-xs text-slate-400">Automated structural inspection diagnostics based on verified market inputs.</p>
                </div>
              </div>

              {aiReport ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Overall score circle */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center bg-black/20 border border-white/10 rounded-2xl p-5 text-center">
                    <div className="relative flex items-center justify-center">
                      {/* Circle SVG */}
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="48" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                        <circle cx="56" cy="56" r="48" className="stroke-emerald-500" strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 48} 
                          strokeDashoffset={2 * Math.PI * 48 * (1 - aiReport.overallScore / 100)} 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-white">{aiReport.overallScore}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Score / 100</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 mt-4 uppercase tracking-wider">{aiReport.grade}</span>
                  </div>

                  {/* Score breakdown bars */}
                  <div className="md:col-span-3 space-y-4">
                    {inspectionItems.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{item.label}</span>
                          <span className="text-white font-bold">{item.value}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Grading not compiled yet.</p>
              )}

              {/* Pros & Cons list */}
              <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Recommended Pros
                  </h3>
                  <ul className="space-y-1.5 text-slate-300 text-xs leading-relaxed">
                    <li>• Solid, high-liquidity resale brand value across Pakistan.</li>
                    <li>• Suspension structured perfectly for localized bumpy street terrains.</li>
                    <li>• Complete documentation, file history, and token taxes cleared.</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                    <AlertTriangle className="h-4 w-4" /> Inspection Checkpoints
                  </h3>
                  <ul className="space-y-1.5 text-slate-300 text-xs leading-relaxed">
                    <li>• Price sits slightly on the premium boundary for this specific year bracket.</li>
                    <li>• Slight cosmetic scuffs noted near bottom bumper lines (exterior paint).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Technical Specifications Spec Sheet */}
            <div className="glass-panel rounded-3xl p-6 shadow-lg backdrop-blur-xl border border-white/40">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Technical Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engine Capacity</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.engine_cc} CC</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transmission</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.transmission}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuel System</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.fuel}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Driven</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.mileage.toLocaleString()} KM</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered City</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.registered_city}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Body Profile</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.body_type}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Grading</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.condition}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listing Color</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.color}</p>
                </div>
              </div>
            </div>

            {/* Features Tags */}
            <div className="glass-panel rounded-3xl p-6 shadow-lg backdrop-blur-xl border border-white/40">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Assigned Comfort Features</h2>
              <div className="flex flex-wrap gap-2.5">
                {car.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Car Description text */}
            <div className="glass-panel rounded-3xl p-6 shadow-lg backdrop-blur-xl border border-white/40">
              <h2 className="text-xl font-bold text-[#0F172A] mb-4">Seller Description</h2>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{car.description}</p>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Primary Price, Phone Reveal, Compare & Recommendations */}
          <div className="space-y-8">
            {/* Primary Pricing Card */}
            <div className="glass-panel rounded-3xl p-6 shadow-xl backdrop-blur-xl border border-white/40 space-y-6">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Listing Asking Price</span>
                <span className="text-3xl sm:text-4xl font-black text-[#0F172A]">{(car.price / 100000).toFixed(1)} Lakh</span>
                <span className="text-xs text-slate-500 block mt-1">Roughly equivalent to PKR {car.price.toLocaleString()}</span>
              </div>

              {/* Quick specs pill */}
              <div className="bg-white/50 border border-white/20 p-4 rounded-2xl flex items-center gap-3">
                <MapPin className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle Location</span>
                  <p className="text-sm font-bold text-[#0F172A]">{car.city}, Pakistan</p>
                </div>
              </div>

              {/* Compare Button */}
              <button
                onClick={() => {
                  addToCompare(car);
                  navigate('/compare');
                }}
                className="w-full text-center bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95 transform shadow-md shadow-[#0F172A]/10"
              >
                Add to Head-to-Head Compare
              </button>
            </div>

            {/* Seller Details Reveal Box */}
            <div className="glass-panel rounded-3xl p-6 shadow-xl backdrop-blur-xl border border-white/40 space-y-4">
              <h3 className="font-bold text-[#0F172A] text-base">Verified Seller Profile</h3>
              
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-200/50">
                <div className="h-10 w-10 rounded-full bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/10 flex items-center justify-center font-bold text-base">
                  {car.seller_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#0F172A] leading-tight">{car.seller_name}</p>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Private Local Seller</span>
                </div>
              </div>

              {phoneRevealed ? (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl text-center space-y-2 animate-fade-in text-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Verified Phone Contact</span>
                  <a href={`tel:${car.phone}`} className="text-xl font-extrabold text-emerald-800 block">
                    {car.phone}
                  </a>
                  <p className="text-[10px] text-emerald-600 font-semibold">Mention PakCar when calling to request deals!</p>
                </div>
              ) : (
                <button
                  onClick={handleRevealPhone}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-emerald-400 shadow-md shadow-emerald-600/10 transition-all active:scale-95 transform"
                >
                  <Phone className="h-4.5 w-4.5" />
                  <span>Reveal Seller Phone Number</span>
                </button>
              )}
            </div>

            {/* PakCar Value Checker (AI Value Indicator) */}
            <div className="bg-[#0F172A]/90 text-white border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-xl">
              <h3 className="font-bold text-sm uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-blue-400 animate-pulse" /> PakCar Value Checker
              </h3>
              
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Our system analyzed identical listing models in {car.city} to check market alignment.
                </p>
                <div className="bg-black/20 rounded-xl p-3 space-y-1 border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Valuation Status</span>
                    <span className="text-emerald-400 font-bold">Fair Value Deal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Resale Liquidity</span>
                    <span className="text-blue-400 font-bold">Very High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Recommended Alternatives */}
        <div className="mt-16 border-t border-slate-200/50 pt-12 space-y-12">
          {/* Similar Cars */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Similar Listing Alternatives</h2>
              <p className="text-sm text-slate-500">Other {car.body_type}s sitting in a comparable budget bracket.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarCars.map(c => (
                <div key={c.id} className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full">
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                    <img src={c.images[0]} alt={c.model} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{c.make}</span>
                    <h4 className="font-bold text-sm text-[#0F172A] truncate">
                      <Link to={`/cars/${c.id}`}>{c.model} <span className="text-slate-500 font-medium">{c.variant}</span></Link>
                    </h4>
                    <span className="text-base font-extrabold text-[#0F172A] mt-1">{(c.price / 100000).toFixed(1)} Lakh</span>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200/50 pt-2 mt-auto">
                      <span>{c.year}</span>
                      <span>{c.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Better Value Alternatives */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Better Value Alternatives</h2>
              <p className="text-sm text-slate-500">Selected options matching this body style with lower pricing or newer years.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {betterValueCars.map(c => (
                <div key={c.id} className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full">
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                    <img src={c.images[0]} alt={c.model} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">
                      Value Option
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{c.make}</span>
                    <h4 className="font-bold text-sm text-[#0F172A] truncate">
                      <Link to={`/cars/${c.id}`}>{c.model} <span className="text-slate-500 font-medium">{c.variant}</span></Link>
                    </h4>
                    <span className="text-base font-extrabold text-[#0F172A] mt-1">{(c.price / 100000).toFixed(1)} Lakh</span>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200/50 pt-2 mt-auto">
                      <span>{c.year}</span>
                      <span className="text-[#2563EB] font-semibold">{c.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
