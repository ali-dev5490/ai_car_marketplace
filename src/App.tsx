import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAssistantWidget from './components/AIAssistantWidget';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import CarDetails from './pages/CarDetails';
import AISearch from './pages/AISearch';
import AIPosting from './pages/AIPosting';
import Compare from './pages/Compare';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';

import { Car } from './types';

const FAVORITES_KEY = 'pakcar_favorites';

function loadSessionFavorites(): number[] {
  try {
    const raw = sessionStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(Number).filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

function saveSessionFavorites(ids: number[]) {
  try {
    sessionStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore quota / private-mode errors
  }
}

export default function App() {
  const [favorites, setFavorites] = useState<number[]>(loadSessionFavorites);
  const [compareList, setCompareList] = useState<Car[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);

  useEffect(() => {
    const savedViewed = localStorage.getItem('pakcar_recently_viewed');
    if (savedViewed) {
      try {
        setRecentlyViewed(JSON.parse(savedViewed));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    const carId = Number(id);
    if (!Number.isFinite(carId)) return;
    setFavorites((prev) => {
      const next = prev.includes(carId) ? prev.filter((x) => x !== carId) : [...prev, carId];
      saveSessionFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: number) => favorites.includes(Number(id)), [favorites]);

  const addRecentlyViewed = (id: number) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(x => x !== id);
      const next = [id, ...filtered].slice(0, 8); // Keep last 8 viewed
      localStorage.setItem('pakcar_recently_viewed', JSON.stringify(next));
      return next;
    });
  };

  const addToCompare = (car: Car) => {
    setCompareList(prev => {
      // Avoid duplicate comparison targets
      if (prev.some(c => c.id === car.id)) return prev;
      return [car, ...prev].slice(0, 2); // Keep only last 2 selected
    });
  };

  const removeFromCompare = (id: number) => {
    setCompareList(prev => prev.filter(c => c.id !== id));
  };

  const clearCompare = () => setCompareList([]);

  return (
    <Router>
      <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-x-clip">
        {/* Ambient mesh background blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-[#2563EB] rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#EA580C] rounded-full blur-[120px]"></div>
          <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] bg-indigo-500 rounded-full blur-[120px] opacity-40"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen flex-grow">
          {/* Navigation Bar */}
          <Navbar favoritesCount={favorites.length} compareCount={compareList.length} />

          {/* Primary Page Layout viewports */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home toggleFavorite={toggleFavorite} isFavorite={isFavorite} />} />
              <Route path="/browse" element={<Browse favorites={favorites} toggleFavorite={toggleFavorite} isFavorite={isFavorite} />} />
              <Route path="/cars/:id" element={
                <CarDetails 
                  toggleFavorite={toggleFavorite} 
                  isFavorite={isFavorite} 
                  addToCompare={addToCompare}
                  recentlyViewed={recentlyViewed}
                  addRecentlyViewed={addRecentlyViewed}
                />
              } />
              <Route path="/ai-search" element={<AISearch />} />
              <Route path="/ai-posting" element={<AIPosting />} />
              <Route path="/compare" element={
                <Compare 
                  compareList={compareList} 
                  removeFromCompare={removeFromCompare} 
                  clearCompare={clearCompare} 
                />
              } />
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>

          {/* Global Floating AI Helper concierges */}
          <AIAssistantWidget />

          {/* Platform Footer */}
          <Footer />
        </div>
      </div>
    </Router>
  );
}
