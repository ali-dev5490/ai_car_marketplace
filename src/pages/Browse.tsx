import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown, RefreshCw, Milestone, Fuel, Gauge, MapPin, Heart, Sparkles, ChevronDown } from 'lucide-react';
import { Car } from '../types';
import { fetchCars } from '../lib/api';

interface BrowseProps {
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

const MAKES = ['Toyota', 'Honda', 'Suzuki', 'Hyundai', 'KIA', 'MG', 'BMW', 'Audi', 'Mercedes', 'Changan', 'Proton'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala', 'Sialkot'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Crossover', 'Luxury'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Need Work'];

export default function Browse({ toggleFavorite, isFavorite }: BrowseProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price_asc');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Read filter values from URL search parameters
  const makeFilter = searchParams.get('make') || '';
  const modelFilter = searchParams.get('model') || '';
  const cityFilter = searchParams.get('city') || '';
  const transmissionFilter = searchParams.get('transmission') || '';
  const fuelFilter = searchParams.get('fuel') || '';
  const bodyTypeFilter = searchParams.get('body_type') || '';
  const conditionFilter = searchParams.get('condition') || '';
  const minPriceFilter = searchParams.get('minPrice') || '';
  const maxPriceFilter = searchParams.get('maxPrice') || '';
  const minYearFilter = searchParams.get('minYear') || '';
  const maxYearFilter = searchParams.get('maxYear') || '';
  const searchFilter = searchParams.get('search') || '';
  const favoritesFilter = searchParams.get('favorites') === 'true';

  useEffect(() => {
    setLoading(true);
    
    // Construct the query URL (omit client-side favorites flag)
    const query = new URLSearchParams(searchParams);
    query.delete('favorites');
    
    fetchCars(query.toString())
      .then((data: Car[]) => {
        if (data && Array.isArray(data)) {
          // Client-side filtering & sorting
          let filtered = [...data];
          if (favoritesFilter) {
            filtered = filtered.filter(c => isFavorite(c.id));
          }
          if (sortBy === 'price_asc') filtered.sort((a,b) => a.price - b.price);
          else if (sortBy === 'price_desc') filtered.sort((a,b) => b.price - a.price);
          else if (sortBy === 'year_desc') filtered.sort((a,b) => b.year - a.year);
          else if (sortBy === 'mileage_asc') filtered.sort((a,b) => a.mileage - b.mileage);
          setCars(filtered);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [searchParams, sortBy, isFavorite]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-transparent text-[#0F172A]">
      <div className="mx-auto max-w-7xl">
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
                {favoritesFilter ? 'Saved Car Listings' : 'Browse Used Cars'}
                <span className="text-xs bg-[#2563EB]/10 text-[#2563EB] px-2.5 py-1 rounded-full font-bold border border-[#2563EB]/20">
                  {cars.length} {favoritesFilter ? 'Saved' : 'Listings Match'}
                </span>
              </h1>
              <button
                onClick={() => updateFilter('favorites', favoritesFilter ? '' : 'true')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
                  favoritesFilter
                    ? 'bg-red-600 text-white border-red-500 shadow-red-500/20'
                    : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 hover:border-red-300'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${favoritesFilter ? 'fill-white' : 'text-red-500 fill-red-100'}`} />
                <span>{favoritesFilter ? 'Saved Cars Only' : 'Show Saved Cars'}</span>
              </button>
            </div>
            <p className="text-slate-500 mt-1 text-sm">
              {favoritesFilter 
                ? 'Your bookmarked vehicles saved permanently in local state.' 
                : 'Filter through 300+ realistic Pakistani listings using manual or traditional searches.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Sorting */}
            <div className="flex items-center bg-white/40 backdrop-blur-md border border-white/40 px-3 py-2 rounded-xl text-sm w-full md:w-auto shadow-sm">
              <ArrowUpDown className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[#0F172A] focus:outline-none pr-6 cursor-pointer font-bold w-full md:w-auto"
              >
                <option value="price_asc" className="bg-white text-slate-900 font-semibold">Price: Low to High</option>
                <option value="price_desc" className="bg-white text-slate-900 font-semibold">Price: High to Low</option>
                <option value="year_desc" className="bg-white text-slate-900 font-semibold">Year: Newest First</option>
                <option value="mileage_asc" className="bg-white text-slate-900 font-semibold">Mileage: Lowest First</option>
              </select>
            </div>

            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="lg:hidden flex items-center justify-center bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-sm p-2.5 rounded-xl border border-white/10 w-full"
            >
              <SlidersHorizontal className="h-4.5 w-4.5 mr-2" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 1. FILTER SIDEBAR */}
          <aside className={`lg:block ${showFiltersMobile ? 'block' : 'hidden'} lg:col-span-1 glass-panel rounded-2xl p-5 shadow-lg space-y-6 h-fit backdrop-blur-xl`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-extrabold text-base text-[#0F172A] flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-[#2563EB]" /> Filters
              </h2>
              <button
                onClick={resetFilters}
                className="text-xs text-[#2563EB] hover:text-blue-500 font-bold flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Search Term</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Civic, automatic..."
                  value={searchFilter}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full border border-slate-200/60 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/70 backdrop-blur-sm"
                />
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Brand / Make */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Brand / Make</label>
              <select
                value={makeFilter}
                onChange={(e) => updateFilter('make', e.target.value)}
                className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer bg-white/70 backdrop-blur-sm"
              >
                <option value="">All Brands</option>
                {MAKES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Body Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Body Type</label>
              <select
                value={bodyTypeFilter}
                onChange={(e) => updateFilter('body_type', e.target.value)}
                className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer bg-white/70 backdrop-blur-sm"
              >
                <option value="">All Types</option>
                {BODY_TYPES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Location City</label>
              <select
                value={cityFilter}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer bg-white/70 backdrop-blur-sm"
              >
                <option value="">All Cities</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Transmission</label>
              <select
                value={transmissionFilter}
                onChange={(e) => updateFilter('transmission', e.target.value)}
                className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer bg-white/70 backdrop-blur-sm"
              >
                <option value="">All Transmissions</option>
                {TRANSMISSIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Fuel */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fuel Type</label>
              <select
                value={fuelFilter}
                onChange={(e) => updateFilter('fuel', e.target.value)}
                className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer bg-white/70 backdrop-blur-sm"
              >
                <option value="">All Fuels</option>
                {FUEL_TYPES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Price Range (PKR)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceFilter}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/70 backdrop-blur-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceFilter}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Year range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Year Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min Year"
                  value={minYearFilter}
                  onChange={(e) => updateFilter('minYear', e.target.value)}
                  className="w-full border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/70 backdrop-blur-sm"
                />
                <input
                  type="number"
                  placeholder="Max Year"
                  value={maxYearFilter}
                  onChange={(e) => updateFilter('maxYear', e.target.value)}
                  className="w-full border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Condition</label>
              <select
                value={conditionFilter}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="w-full border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer bg-white/70 backdrop-blur-sm"
              >
                <option value="">All Conditions</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </aside>

          {/* 2. MAIN RESULTS PANEL */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="glass-card border border-white/40 rounded-2xl h-80 animate-pulse flex flex-col overflow-hidden">
                    <div className="h-44 bg-slate-300/40 w-full"></div>
                    <div className="p-4 flex-1 space-y-3">
                      <div className="h-4 bg-slate-300/40 rounded w-1/3"></div>
                      <div className="h-6 bg-slate-300/40 rounded w-2/3"></div>
                      <div className="h-4 bg-slate-300/40 rounded w-1/2 mt-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cars.length === 0 ? (
              <div className="glass-card border border-white/40 rounded-2xl p-12 text-center max-w-lg mx-auto mt-10 shadow-lg backdrop-blur-xl">
                {favoritesFilter ? (
                  <>
                    <Heart className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#0F172A] mb-1">No Saved Cars Yet</h3>
                    <p className="text-slate-500 text-sm mb-6">You haven&apos;t saved any cars to your list yet. Click the heart icon on any vehicle card to save it permanently!</p>
                    <button
                      onClick={() => updateFilter('favorites', '')}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                      Browse All Vehicles
                    </button>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#0F172A] mb-1">No Matching Cars Found</h3>
                    <p className="text-slate-500 text-sm mb-6">We couldn&apos;t find any vehicles matching your detailed criteria. Try broadening or resetting your search filters.</p>
                    <button
                      onClick={resetFilters}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                      Clear All Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <div
                    key={car.id}
                    className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full"
                  >
                    {/* Image panel */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
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
                      <button
                        onClick={() => toggleFavorite(car.id)}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/40 hover:bg-white/60 text-slate-800 flex items-center justify-center transition-colors shadow-sm backdrop-blur-md border border-white/45"
                      >
                        <Heart className={`h-4 w-4 ${isFavorite(car.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                      </button>

                      {/* City Tag on Image corner */}
                      <div className="absolute bottom-3 left-3 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                        <MapPin className="h-3 w-3 text-red-400" />
                        <span>{car.city}</span>
                      </div>
                    </div>

                    {/* Specifications Body */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{car.make}</span>
                          <h3 className="font-bold text-base text-[#0F172A] truncate max-w-[150px]">
                            <Link to={`/cars/${car.id}`} className="hover:text-[#2563EB] transition-colors">
                              {car.model} <span className="text-xs font-semibold text-slate-500">{car.variant}</span>
                            </Link>
                          </h3>
                        </div>
                        <span className="text-xs bg-[#2563EB]/10 text-[#2563EB] px-2.5 py-0.5 rounded-lg font-bold border border-[#2563EB]/15">
                          {car.year}
                        </span>
                      </div>

                      <div className="mt-1.5 mb-4">
                        <span className="text-xl font-extrabold text-[#0F172A]">{(car.price / 100000).toFixed(1)} Lakh</span>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Estimated Market Value</span>
                      </div>

                      {/* Horizontal specs bar */}
                      <div className="grid grid-cols-3 gap-1 py-2 border-t border-slate-200/50 text-[10px] text-slate-500 mb-4 mt-auto">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F172A]">{car.engine_cc}cc</span>
                          <span>Engine</span>
                        </div>
                        <div className="flex flex-col border-x border-slate-200/50 px-1 truncate">
                          <span className="font-bold text-[#0F172A]">{car.transmission}</span>
                          <span>Trans</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-[#0F172A]">{car.mileage >= 1000 ? `${(car.mileage/1000).toFixed(0)}k` : car.mileage} km</span>
                          <span>Mileage</span>
                        </div>
                      </div>

                      {/* Detail Link */}
                      <Link
                        to={`/cars/${car.id}`}
                        className="w-full text-center bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-[#0F172A]/10"
                      >
                        <span>Specifications & AI Analysis</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
