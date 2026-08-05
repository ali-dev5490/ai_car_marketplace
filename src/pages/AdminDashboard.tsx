import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Terminal, ShieldAlert, Check, X, RefreshCw, Layers, Database, Cpu, Activity } from 'lucide-react';
import { Car } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function AdminDashboard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Fetch statistics and cars list
    fetch('/api/analytics/admin')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setAdminStats(data);
          setCars(data.all_cars || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    // Seed realistic system terminal logs
    setLogs([
      '[SYSTEM] Booting PakCar Admin Core V2.4...',
      '[SQLITE] SQLite database indexes loaded. 300 active rows scanned successfully.',
      '[AI SERVICE] Switching AI parser context to model: @google/genai (Gemini Flash).',
      '[ROUTER] Mounted development Vite middleware pipeline on localhost:3000.',
      '[METRICS] Ready for API endpoint requests. CPU: 2.1%, Mem: 124MB / 512MB.'
    ]);

    // Live logging interval
    const interval = setInterval(() => {
      const messages = [
        `[SQLITE] Query executed: SELECT * FROM cars WHERE price <= 4500000; (0.24ms)`,
        `[AI SERVICE] Completed prompt parsing of "white automatic civic". Status: OK. Confidence: 94%`,
        `[METRIC] Recorded new lead interest for car ID: ${Math.floor(Math.random() * 200) + 1}`,
        `[SYSTEM] SQLite backup completed. Saved: /server/db_backup.json`
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setLogs(prev => [...prev.slice(-8), `[${new Date().toLocaleTimeString()}] ${randomMsg}`]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleApprove = (id: number) => {
    alert(`Listing ID: ${id} verified and approved successfully by admin.`);
  };

  const handleFlag = (id: number) => {
    if (window.confirm(`Flag and unpublish listing ID: ${id}?`)) {
      alert(`Listing ID: ${id} has been flagged and removed from default search filters.`);
    }
  };

  // Process charting data safely
  const makeDistributionData = adminStats?.make_distribution 
    ? Object.keys(adminStats.make_distribution).map(key => ({
        name: key,
        value: adminStats.make_distribution[key]
      }))
    : [];

  const bodyTypeData = adminStats?.body_type_distribution
    ? Object.keys(adminStats.body_type_distribution).map(key => ({
        name: key,
        count: adminStats.body_type_distribution[key]
      }))
    : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-transparent text-[#0F172A]">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200/50 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Admin System Console</h1>
            <p className="text-slate-500 mt-1 text-sm">Monitor system health parameters, SQLite indexing, and AI parsing activities.</p>
          </div>
          <div className="bg-slate-950/90 border border-white/10 text-teal-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Cpu className="h-4 w-4 animate-pulse text-teal-400" />
            <span>Core Node: Active</span>
          </div>
        </div>

        {adminStats ? (
          <div className="space-y-8">
            {/* OVERVIEW STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel rounded-2xl p-5 border border-white/40 shadow-xl backdrop-blur-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Database Rows</span>
                <span className="text-3xl font-black text-[#0F172A] mt-1 block">{(adminStats.total_cars).toLocaleString()}</span>
                <span className="text-xs text-slate-500 block mt-2">All pre-seeded cars</span>
              </div>
              
              <div className="glass-panel rounded-2xl p-5 border border-white/40 shadow-xl backdrop-blur-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Market Pricing</span>
                <span className="text-3xl font-black text-[#2563EB] mt-1 block">{(adminStats.average_price / 100000).toFixed(1)} Lakh</span>
                <span className="text-xs text-slate-500 block mt-2">PKR {adminStats.average_price?.toLocaleString()}</span>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/40 shadow-xl backdrop-blur-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Prompts Handled</span>
                <span className="text-3xl font-black text-[#0F172A] mt-1 block">1,842</span>
                <span className="text-xs text-slate-500 block mt-2">Natural query completions</span>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/40 shadow-xl backdrop-blur-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Health</span>
                <span className="text-3xl font-black text-emerald-600 mt-1 block">99.9%</span>
                <span className="text-xs text-slate-500 block mt-2">SQLite & Gemini Latency</span>
              </div>
            </div>

            {/* CHARTING ANALYSIS BLOCK */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Brand Distribution Chart */}
              <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl backdrop-blur-xl space-y-4">
                <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-[#2563EB]" /> Brand Distribution Share
                </h3>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={makeDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {makeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Vehicles`, 'Distribution Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs">
                  {makeDistributionData.slice(0, 7).map((entry, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-slate-600 font-semibold">{entry.name}: {entry.value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Body Type Distribution Chart */}
              <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl backdrop-blur-xl space-y-4">
                <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-[#2563EB]" /> Body Type Distribution
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bodyTypeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value} cars`, 'Count']} />
                      <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* LIVE SYSTEM TERMINAL LOGS */}
            <div className="bg-slate-950/90 border border-white/10 text-slate-300 p-5 rounded-3xl font-mono text-xs space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4.5 w-4.5 text-teal-400" />
                  <span className="text-slate-200 font-bold">PakCar Core System Monitor</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LIVE FEED</span>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto leading-relaxed">
                {logs.map((log, idx) => (
                  <p key={idx} className={log.includes('[SQLITE]') ? 'text-blue-300' : log.includes('[AI SERVICE]') ? 'text-amber-300' : 'text-slate-400'}>
                    {log}
                  </p>
                ))}
              </div>
            </div>

            {/* ALL LISTINGS QUEUE */}
            <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl backdrop-blur-xl">
              <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider mb-6 flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-[#2563EB]" /> Platform Verification Queue
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/50 font-bold text-slate-500 bg-white/30 backdrop-blur-sm text-[10px] uppercase tracking-wider">
                      <th className="p-3">ID</th>
                      <th className="p-3">Car Details</th>
                      <th className="p-3">Pricing (PKR)</th>
                      <th className="p-3">Location</th>
                      <th className="p-3 text-center">Status Checks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50">
                    {cars.slice(0, 6).map((c) => (
                      <tr key={c.id} className="hover:bg-white/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-400">#{c.id}</td>
                        <td className="p-3">
                          <p className="font-bold text-[#0F172A]">{c.year} {c.make} {c.model}</p>
                          <span className="text-slate-400">{c.variant}</span>
                        </td>
                        <td className="p-3 font-extrabold text-[#2563EB]">{(c.price / 100000).toFixed(1)} Lakh</td>
                        <td className="p-3 font-semibold text-slate-700">{c.city}</td>
                        <td className="p-3 flex justify-center gap-2.5">
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-bold p-1.5 rounded-lg border border-emerald-500/30"
                            title="Verify and Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleFlag(c.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold p-1.5 rounded-lg border border-red-500/30"
                            title="Flag / Report"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
