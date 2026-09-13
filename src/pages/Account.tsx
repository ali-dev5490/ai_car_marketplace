import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Heart,
  MessageSquare,
  CreditCard,
  User,
  PlusCircle,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiMyListings, apiUpdateProfile } from '../lib/authApi';

export default function Account() {
  const { user, logout, listingFeePkr, isAdmin, setUser } = useAuth();
  const [listingCount, setListingCount] = useState(0);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setProfile({ name: user.name, phone: user.phone, city: user.city });
    apiMyListings()
      .then((cars) => setListingCount(cars.length))
      .catch(() => setListingCount(0));
  }, [user]);

  if (!user) return null;

  const links = [
    { to: '/account/listings', label: 'My listings', desc: 'Create, edit, pause your ads', icon: Car, meta: `${listingCount} ads` },
    { to: '/ai-posting', label: 'Sell with AI', desc: 'Post a new car listing', icon: PlusCircle, meta: `Fee ${listingFeePkr.toLocaleString()} PKR` },
    { to: '/account/payments', label: 'Manual payments', desc: 'Submit listing fee receipts', icon: CreditCard, meta: 'Bank / JazzCash' },
    { to: '/account/enquiries', label: 'Enquiries', desc: 'Buyer messages & visit requests', icon: MessageSquare, meta: 'Inbox' },
    { to: '/browse?favorites=true', label: 'Favorites', desc: 'Cars you saved while browsing', icon: Heart, meta: 'Saved' },
  ];

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      const res = await apiUpdateProfile(profile);
      setUser(res.user);
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Could not save profile');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/50 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">My Account</h1>
            <p className="text-slate-500 text-sm mt-1">
              Buy and sell from one profile · {user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-white"
              >
                <LayoutDashboard className="h-4 w-4" /> Admin
              </Link>
            )}
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="glass-panel rounded-2xl p-5 border border-white/40 shadow-xl backdrop-blur-xl hover:border-[#2563EB]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-5 w-5 text-[#2563EB]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.meta}</span>
                </div>
                <h2 className="font-bold text-[#0F172A]">{item.label}</h2>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </Link>
            );
          })}
        </div>

        <form
          onSubmit={saveProfile}
          className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl backdrop-blur-xl space-y-4"
        >
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <User className="h-5 w-5 text-[#2563EB]" /> Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['name', 'phone', 'city'] as const).map((key) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{key}</label>
                <input
                  value={profile[key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          {saved && <p className="text-sm text-emerald-600 font-semibold">Profile saved.</p>}
          <button type="submit" className="rounded-xl bg-[#2563EB] text-white text-sm font-bold px-4 py-2.5 hover:bg-[#1D4ED8]">
            Save profile
          </button>
        </form>
      </div>
    </div>
  );
}
