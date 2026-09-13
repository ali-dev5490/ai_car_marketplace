import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pakcar.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (user && isAdmin) navigate('/admin', { replace: true });
  }, [user, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-md glass-panel rounded-3xl p-8 border border-white/40 shadow-xl">
        <div className="flex items-center gap-2 mb-2 text-teal-600">
          <Shield className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Admin portal</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">Admin login</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Seeded admin: <span className="font-semibold">admin@pakcar.local</span> / admin123
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-slate-900 text-white font-bold py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? 'Signing in...' : 'Enter admin console'}
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4 text-center">
          <Link to="/login" className="hover:underline">User login</Link>
        </p>
      </div>
    </div>
  );
}
