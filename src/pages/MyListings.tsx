import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, Trash2, CreditCard, PlusCircle, ShoppingBag } from 'lucide-react';
import type { Car } from '../types';
import StatusBadge from '../components/StatusBadge';
import { apiDeleteListing, apiMyListings, apiUpdateListing } from '../lib/authApi';

export default function MyListings() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setCars(await apiMyListings());
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (car: Car, status: string) => {
    try {
      const updated = await apiUpdateListing(car.id, { status: status as Car['status'] });
      setCars((prev) => prev.map((c) => (c.id === car.id ? updated : c)));
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      await apiDeleteListing(id);
      setCars((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-slate-200/50 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-[#2563EB]" /> My Listings
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage ads you own. Unpaid listings stay private until admin confirms payment.</p>
          </div>
          <Link
            to="/ai-posting"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold px-4 py-2.5 hover:bg-[#1D4ED8]"
          >
            <PlusCircle className="h-4 w-4" /> New listing
          </Link>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        {!loading && cars.length === 0 && (
          <div className="glass-panel rounded-3xl p-10 text-center border border-white/40">
            <p className="text-slate-600 font-semibold mb-3">You have no listings yet.</p>
            <Link to="/ai-posting" className="text-[#2563EB] font-bold hover:underline">
              Post your first car with AI
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {cars.map((car) => (
            <div
              key={car.id}
              className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/40 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row gap-4"
            >
              <img
                src={car.images?.[0] || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=400'}
                alt=""
                className="h-28 w-full sm:w-40 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-bold text-[#0F172A] truncate">
                    {car.year} {car.make} {car.model}
                  </h2>
                  <StatusBadge value={car.status} />
                  <StatusBadge value={car.payment_status} />
                </div>
                <p className="text-sm text-[#2563EB] font-extrabold">{(car.price / 100000).toFixed(1)} Lakh</p>
                <p className="text-xs text-slate-500 mt-1">{car.city} · {car.variant}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(car.payment_status === 'unpaid' || car.payment_status === 'rejected' || car.status === 'pending_payment') && (
                    <Link
                      to={`/account/payments?listing=${car.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold px-2.5 py-1.5"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay listing fee
                    </Link>
                  )}
                  {car.status === 'active' && (
                    <button
                      onClick={() => setStatus(car, 'paused')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-bold px-2.5 py-1.5 text-slate-700 hover:bg-white"
                    >
                      <Pause className="h-3.5 w-3.5" /> Pause
                    </button>
                  )}
                  {car.status === 'paused' && (
                    <button
                      onClick={() => setStatus(car, 'active')}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 text-xs font-bold px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Play className="h-3.5 w-3.5" /> Resume
                    </button>
                  )}
                  {car.status !== 'sold' && (
                    <button
                      onClick={() => setStatus(car, 'sold')}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 text-xs font-bold px-2.5 py-1.5 text-indigo-700 hover:bg-indigo-50"
                    >
                      Mark sold
                    </button>
                  )}
                  <button
                    onClick={() => remove(car.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-xs font-bold px-2.5 py-1.5 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                  {car.status === 'active' && (
                    <Link to={`/cars/${car.id}`} className="text-xs font-bold text-[#2563EB] px-2.5 py-1.5 hover:underline">
                      View public page
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
