import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Sparkles, PlusCircle, BarChart3, Heart, GitCompare, MessageSquare } from 'lucide-react';

interface NavbarProps {
  favoritesCount: number;
  compareCount?: number;
}

export default function Navbar({ favoritesCount, compareCount = 0 }: NavbarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Car },
    { path: '/browse', label: 'Browse', icon: Car },
    { path: '/ai-search', label: 'AI Search', icon: Sparkles, badge: 'New' },
    { path: '/ai-posting', label: 'Sell with AI', icon: PlusCircle },
    { path: '/compare', label: 'Compare', icon: GitCompare },
    { path: '/seller', label: 'Seller Panel', icon: BarChart3 },
    { path: '/admin', label: 'Market Analytics', icon: BarChart3 },
  ];

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0F172A]/85 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link id="logo-link" to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-blue-500/20">
            <Car className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold leading-none tracking-tight text-white flex items-center gap-1.5">
              AI Car Market Place
              <span className="text-[10px] bg-[#2563EB]/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/30">AI PRO</span>
            </span>
            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Mr Solution Tech</span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav id="desktop-nav" className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                to={item.path}
                className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1 flex h-4 items-center justify-center rounded-full bg-[#EA580C] px-1 text-[8px] font-extrabold uppercase tracking-wider animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-3">
          <Link
            id="nav-favorites-link"
            to="/browse?favorites=true"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-all"
          >
            <Heart className={`h-5 w-5 ${favoritesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md">
                {favoritesCount}
              </span>
            )}
          </Link>

          {/* Quick Post button */}
          <Link
            id="nav-quick-post"
            to="/ai-posting"
            className="flex items-center space-x-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Post with AI</span>
          </Link>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div id="mobile-nav" className="lg:hidden flex border-t border-white/10 bg-[#0F172A]/90 text-xs text-slate-400 justify-around py-2 px-1 backdrop-blur-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              id={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-md transition-colors ${
                isActive ? 'text-[#2563EB] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label === 'AI Search' ? 'AI Search' : item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
