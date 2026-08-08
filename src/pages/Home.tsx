import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, TrendingUp, ShieldCheck, Milestone, Fuel, Gauge, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Car } from '../types';
import { fetchCars } from '../lib/api';

interface HomeProps {
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

export default function Home({ toggleFavorite, isFavorite }: HomeProps) {
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [latestCars, setLatestCars] = useState<Car[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total_cars: 300, average_price: 4350000 });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch featured and latest cars from server (API or static fallback)
    fetchCars()
      .then((data: Car[]) => {
        if (data && Array.isArray(data)) {
          // Sort or pick specifically for featuring
          const sortedByPrice = [...data].sort((a,b) => b.price - a.price);
          setFeaturedCars(sortedByPrice.slice(25, 29)); // Pick mid-high range for featuring
          setLatestCars(data.slice(0, 4)); // First 4 are newest
          const avg = Math.round(data.reduce((s, c) => s + c.price, 0) / data.length);
          setStats({ total_cars: data.length, average_price: avg || 4350000 });
        }
      })
      .catch(err => console.error(err));

    // Fetch stats
    fetch('/api/analytics/admin')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (data) {
          setStats({
            total_cars: data.total_cars || 300,
            average_price: data.average_price || 4350000
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const handleTraditionalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/browse');
    }
  };

  const trendingQueries = [
    { text: 'Family car under 35 Lakh', path: '/ai-search?q=family car under 35 Lakh' },
    { text: 'White automatic Civic', path: '/ai-search?q=white automatic Civic' },
    { text: 'Best fuel average car', path: '/ai-search?q=best fuel average car' },
    { text: 'SUV for long tours', path: '/ai-search?q=SUV for long tours' }
  ];

  const categories = [
    { label: 'Sedans', icon: '🚗', type: 'Sedan', count: 110, desc: 'Corolla, Civic, City, Alsvin' },
    { label: 'Hatchbacks', icon: '🚙', type: 'Hatchback', count: 95, desc: 'Alto, Cultus, Wagon R, Swift' },
    { label: 'SUVs & Crossovers', icon: '🚐', type: 'SUV', count: 65, desc: 'Sportage, Fortuner, Tucson, HS' },
    { label: 'Luxury Segments', icon: '🏎️', type: 'Luxury', count: 30, desc: 'Mercedes C-Class, BMW 3, Audi A4' }
  ];

  return (
    <div className="min-h-screen text-slate-900 bg-transparent">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#0F172A]/85 backdrop-blur-xl border border-white/10 py-20 px-4 sm:px-6 lg:px-8 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 shadow-2xl">
        {/* Abstract background blobs */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-950"></div>
        <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-[#2563EB]/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-[#EA580C]/20 blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-[#2563EB]/10 border border-[#2563EB]/30 px-3.5 py-1.5 rounded-full text-blue-400 text-xs font-semibold mb-6 shadow-sm"
          >
            <Sparkles className="h-4 w-4 animate-spin-slow" />
            <span>Pakistan&apos;s First AI-Powered Auto Marketplace</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
          >
            Find, Compare & Post Cars <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
              Powered by Advanced AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Experience instant conversational search, automatic specification extraction from photos, transparent inspection grading, and accurate market valuations.
          </motion.p>

          {/* Dual Search Entry */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-2 border border-white/20"
          >
            {/* Traditional search form */}
            <form onSubmit={handleTraditionalSearch} className="w-full flex items-center bg-white/90 rounded-xl px-3 py-1.5 border border-white/30 shadow-inner">
              <Search className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search make, model, variant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-900 text-sm focus:outline-none placeholder-slate-400 py-1 font-medium"
              />
              <button type="submit" className="hidden" />
            </form>

            <div className="flex w-full md:w-auto gap-2 shrink-0">
              <button
                onClick={handleTraditionalSearch}
                className="w-full md:w-auto bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all shadow-md shrink-0"
              >
                Search
              </button>
              
              <Link
                to="/ai-search"
                className="w-full md:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-1.5 transition-all transform active:scale-95 shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                <span>Ask AI</span>
              </Link>
            </div>
          </motion.div>

          {/* Trending searches */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 flex flex-wrap justify-center items-center gap-2 text-xs text-slate-400"
          >
            <span className="font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-400" /> Trending Searches:
            </span>
            {trendingQueries.map((q, idx) => (
              <Link
                key={idx}
                to={q.path}
                className="bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 px-3 py-1.5 rounded-full font-medium transition-colors hover:text-white"
              >
                {q.text}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 2. SUMMARY STATISTICS */}
      <section className="relative -mt-8 z-10 max-w-5xl mx-auto px-4">
        <div className="glass-card rounded-2xl shadow-xl border border-white/40 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center backdrop-blur-xl">
          <div className="flex flex-col items-center border-b sm:border-b-0 sm:border-r border-white/20 pb-6 sm:pb-0">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">{(stats.total_cars).toLocaleString()}+</span>
            <span className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">Verified Listings</span>
          </div>
          <div className="flex flex-col items-center border-b sm:border-b-0 sm:border-r border-white/20 pb-6 sm:pb-0">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">{(stats.average_price / 100000).toFixed(1)} Lakh</span>
            <span className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">Average Car Price</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#2563EB]">100% Secure</span>
            <span className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">AI Verified Valuation</span>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center md:text-left mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Browse by Body Type</h2>
            <p className="text-slate-500 mt-1.5">Locate the right dimension suited to your daily drive and space needs.</p>
          </div>
          <Link to="/browse" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-sm flex items-center gap-1 shrink-0 group">
            <span>Explore all categories</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={`/browse?body_type=${cat.type}`}
              className="glass-card glass-card-hover rounded-2xl p-6 transform"
            >
              <div className="text-4xl mb-4 bg-blue-500/10 w-12 h-12 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform border border-blue-500/20">
                {cat.icon}
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{cat.label}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{cat.count}+ Available Listings</p>
              <p className="text-xs text-slate-500 mt-3 border-t border-slate-200/50 pt-2">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED CARS (High Resale/Low Price deals) */}
      <section className="bg-[#0F172A]/85 backdrop-blur-xl border-y border-white/10 py-16 px-4 sm:px-6 lg:px-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="h-4.5 w-4.5" />
                <span>AI Recommended Hot Picks</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-white">Featured Marketplace Deals</h2>
            </div>
            <Link to="/browse" className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all backdrop-blur-md">
              Browse All Cars
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map((car) => (
              <div
                key={car.id}
                className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full hover:border-blue-500/40 hover:-translate-y-1 transform duration-300"
              >
                {/* Image panel */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={car.images[0]}
                    alt={`${car.make} ${car.model}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = car.images[1] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
                    }}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md shadow-blue-500/20">
                    <Sparkles className="h-3 w-3" />
                    <span>AI Hot Deal</span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(car.id)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center transition-colors shadow-md backdrop-blur-sm"
                  >
                    <Heart className={`h-4 w-4 ${isFavorite(car.id) ? 'fill-red-500 text-red-500' : 'text-slate-200'}`} />
                  </button>
                </div>

                {/* Info body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{car.make}</span>
                      <h3 className="font-bold text-lg text-white leading-tight">
                        <Link to={`/cars/${car.id}`} className="hover:text-blue-400 transition-colors">
                          {car.model} <span className="text-sm font-semibold text-slate-400">{car.variant}</span>
                        </Link>
                      </h3>
                    </div>
                    <span className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10">
                      {car.year}
                    </span>
                  </div>

                  {/* Pricing tag */}
                  <div className="mt-1 mb-4">
                    <span className="text-2xl font-black text-blue-400">{(car.price / 100000).toFixed(1)} Lakh</span>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wide">Estimated PKR Valued</span>
                  </div>

                  {/* Specs footer */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/10 text-[11px] text-slate-400 mb-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-300">{car.engine_cc}cc</span>
                      <span>Engine</span>
                    </div>
                    <div className="flex flex-col border-x border-white/10 px-2">
                      <span className="font-bold text-slate-300 truncate">{car.transmission}</span>
                      <span>Trans</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-300">{car.mileage >= 1000 ? `${(car.mileage / 1000).toFixed(0)}k` : car.mileage} km</span>
                      <span>Mileage</span>
                    </div>
                  </div>

                  {/* Detail link */}
                  <Link
                    to={`/cars/${car.id}`}
                    className="w-full text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 hover:gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <span>View Specifications</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LATEST CARS IN MARKET */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Recently Added Listings</h2>
            <p className="text-slate-500 mt-1">Explore the absolute freshest deals uploaded directly by local sellers today.</p>
          </div>
          <Link to="/browse" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-sm flex items-center gap-1 group">
            <span>View all listings</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestCars.map((car) => (
            <div
              key={car.id}
              className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full"
            >
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={car.images[0]}
                  alt={`${car.make} ${car.model}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#EA580C] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                  NEW LISTING
                </div>
                <button
                  onClick={() => toggleFavorite(car.id)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/40 hover:bg-white/60 text-slate-800 flex items-center justify-center transition-colors shadow-sm backdrop-blur-md border border-white/45"
                >
                  <Heart className={`h-4 w-4 ${isFavorite(car.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{car.make}</span>
                    <h3 className="font-bold text-base text-[#0F172A] truncate max-w-[180px]">
                      <Link to={`/cars/${car.id}`} className="hover:text-[#2563EB] transition-colors">
                        {car.model} <span className="text-xs font-semibold text-slate-500">{car.variant}</span>
                      </Link>
                    </h3>
                  </div>
                  <span className="text-xs bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded font-medium border border-[#2563EB]/15">
                    {car.year}
                  </span>
                </div>

                <div className="mt-1 mb-3">
                  <span className="text-lg font-extrabold text-[#0F172A]">{(car.price / 100000).toFixed(1)} Lakh</span>
                </div>

                <div className="grid grid-cols-3 gap-1 py-2 border-t border-slate-200/50 text-[10px] text-slate-500 mt-auto">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#0F172A]">{car.engine_cc}cc</span>
                    <span>Engine</span>
                  </div>
                  <div className="flex flex-col border-x border-slate-200/50 px-1 truncate">
                    <span className="font-semibold text-[#0F172A]">{car.transmission}</span>
                    <span>Trans</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-[#0F172A]">{car.mileage >= 1000 ? `${(car.mileage/1000).toFixed(0)}k` : car.mileage} km</span>
                    <span>Mileage</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. ADVANCED SYSTEM HIGHLIGHTS */}
      <section className="bg-[#0F172A]/90 backdrop-blur-xl border-t border-white/15 py-16 px-4 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">PakCar Enterprise AI Engine Highlights</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-12">
            Providing custom tools built to simplify buying, selling, and marketing vehicles with unprecedented technical transparency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-white/20 hover:bg-white/10 backdrop-blur-md transition-all">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500 text-white mb-4 shadow-lg shadow-blue-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Natural Search Parser</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Skip checkboxes. Type prompts naturally, and the model auto-translates parameters directly into indexed database search filters.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-white/20 hover:bg-white/10 backdrop-blur-md transition-all">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500 text-white mb-4 shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Automated Spec Scanner</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Post instantly. Upload an image, and AI detects vehicle models, suggested market pricing ranges, engine details, and lists pre-filled forms.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-white/20 hover:bg-white/10 backdrop-blur-md transition-all">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-teal-500 text-white mb-4 shadow-lg shadow-teal-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Pricing suggestions</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Know the value. Compare models head-to-head, and receive a comprehensive price forecast based on verified historical market data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
