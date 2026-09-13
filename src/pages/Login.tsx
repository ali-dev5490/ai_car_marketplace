import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      // Admin goes to admin console when coming from /admin/*
      if (from.startsWith('/admin') || email.toLowerCase().includes('admin@')) {
        navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
      } else {
        navigate(from === '/login' ? '/account' : from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-md glass-panel rounded-3xl p-8 border border-white/40 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2 text-[#2563EB]">
          <LogIn className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Account access</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Log in</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          One account to buy and sell cars. Demo: <span className="font-semibold">demo@pakcar.local</span> / demo123
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          New here?{' '}
          <Link to="/signup" className="text-[#2563EB] font-bold hover:underline">
            Create account
          </Link>
        </p>
        <p className="text-xs text-slate-400 mt-3 text-center">
          Admin console:{' '}
          <Link to="/admin/login" className="font-semibold text-slate-600 hover:underline">
            Admin login
          </Link>
          {isAdmin ? ' (you are admin)' : ''}
        </p>
      </div>
    </div>
  );
}
