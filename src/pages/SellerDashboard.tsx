import React, { useState, useEffect } from 'react';
import { Sparkles, BarChart2, MessageSquare, Phone, MapPin, CheckCircle2, ChevronRight, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';
import { Car } from '../types';
import { fetchCars } from '../lib/api';

export default function SellerDashboard() {
  const [sellerCars, setSellerCars] = useState<Car[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all listings
    fetchCars()
      .then((data: Car[]) => {
        if (data && Array.isArray(data)) {
          // Filter out listings belonging to seller Muhammad Usman or similar,
          // or just show the top few and any newly added ones!
          const usrListings = data.filter(c => c.seller_name.includes('Usman') || c.id > 300);
          
          if (usrListings.length === 0) {
            // Pick a few from standard list as mock seller listings so the dashboard is preloaded
            setSellerCars(data.slice(0, 3));
          } else {
            setSellerCars(usrListings);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    // Seed mock buyer leads
    setLeads([
      { id: 1, buyerName: 'Ali Raza', city: 'Lahore', date: 'Today, 2:30 PM', carName: 'Honda Civic Oriel', phone: '0321-4569201', msg: 'Is the price slightly negotiable? Can I visit on Sunday?' },
      { id: 2, buyerName: 'Ayesha Khan', city: 'Islamabad', date: 'Yesterday, 6:15 PM', carName: 'Suzuki Alto VXL', phone: '0333-8201932', msg: 'Interested in buying. Is the token tax cleared?' },
      { id: 3, buyerName: 'Zainab Bibi', city: 'Karachi', date: '2 days ago', carName: 'Toyota Corolla Altis', phone: '0300-5920311', msg: 'What is the suspension status? Original body?' }
    ]);
  }, []);

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this listing from PakCar database?')) return;
    
    try {
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSellerCars(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const aiAlerts = [
    { title: "Price Optimization Alert", text: "Toyota Corolla prices in Lahore are up 4%. Adjust your ask to 41.5 Lakh for higher conversion.", type: "trend" },
    { title: "Weekly Lead Report", text: "Your Suzuki Alto listing has 18 active searches. 3 buyers revealed your phone number.", type: "lead" }
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-transparent text-[#0F172A]">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200/50 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Seller Hub</h1>
            <p className="text-slate-500 mt-1 text-sm">Review active listing performances, buyer leads, and pricing suggestions.</p>
          </div>
          <div className="bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <span>Usman Private Account</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Active listings management */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/40 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#2563EB]" /> Active Vehicle Listings
              </h2>

              {loading ? (
                <div className="space-y-4">
                  {[1,2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>)}
                </div>
              ) : sellerCars.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <p className="text-slate-500 text-sm">You do not have any active vehicle listings on PakCar yet.</p>
                  <button onClick={() => window.location.href = '/ai-posting'} className="bg-[#2563EB] text-white font-bold text-xs px-4 py-2 rounded-xl">
                    Post Your Car Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sellerCars.map((car) => (
                    <div
                      key={car.id}
                      className="border border-slate-200/60 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 hover:bg-white/60 transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <img src={car.images[0]} alt={car.model} referrerPolicy="no-referrer" className="h-16 w-24 object-cover rounded-xl border border-slate-200" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{car.make}</span>
                          <h4 className="font-extrabold text-sm text-[#0F172A] leading-tight">{car.model} <span className="text-slate-500 font-medium text-xs">{car.variant}</span></h4>
                          <span className="text-xs text-[#2563EB] font-extrabold block mt-1">{(car.price / 100000).toFixed(1)} Lakh</span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 w-full sm:w-auto">
                        <button
                          onClick={() => window.location.href = `/cars/${car.id}`}
                          className="flex-1 sm:flex-none text-center bg-white/60 border border-slate-200/60 hover:bg-white text-[#0F172A] font-bold text-xs px-4 py-2 rounded-xl"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteListing(car.id)}
                          className="flex-1 sm:flex-none text-center bg-red-50/60 hover:bg-red-100/80 text-red-600 font-bold text-xs px-4 py-2 rounded-xl border border-red-200/60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leads list */}
            <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/40 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#2563EB]" /> Buyer Interest Leads
              </h2>

              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="border border-slate-200/60 rounded-2xl p-4 space-y-3 bg-white/40 hover:bg-white/60 transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{lead.buyerName}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold block">{lead.city} • {lead.date}</span>
                      </div>
                      <span className="text-xs bg-blue-600/10 text-blue-700 border border-blue-500/20 font-bold px-2.5 py-1 rounded-lg">
                        {lead.carName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-black/5 p-2.5 rounded-xl border border-white/20">
                      &quot;{lead.msg}&quot;
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-emerald-700 font-bold">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{lead.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: AI assistant panels */}
          <div className="space-y-8">
            {/* AI Advisor Alerts */}
            <div className="bg-[#0F172A]/90 text-white border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <h3 className="font-extrabold text-sm uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-blue-400" /> AI Pricing recommendations
              </h3>

              <div className="space-y-4 text-xs">
                {aiAlerts.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-black/25 rounded-xl space-y-1.5 border border-white/10">
                    <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                      {alert.type === 'trend' ? <TrendingUp className="h-4 w-4 text-teal-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
                      <span>{alert.title}</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{alert.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats side block */}
            <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/40 backdrop-blur-xl space-y-4">
              <h3 className="font-extrabold text-[#0F172A] text-sm">Account Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 p-3 rounded-2xl border border-slate-200/50 text-center">
                  <span className="text-2xl font-black text-[#0F172A]">{sellerCars.length}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">Listings</span>
                </div>
                <div className="bg-white/40 p-3 rounded-2xl border border-slate-200/50 text-center">
                  <span className="text-2xl font-black text-[#2563EB]">3</span>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">Active Leads</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
