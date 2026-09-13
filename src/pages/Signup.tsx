import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Lahore',
    password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(form);
      navigate('/account', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-md glass-panel rounded-3xl p-8 border border-white/40 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2 text-[#2563EB]">
          <UserPlus className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Buy & sell</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Create account</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          One signup for both buying and selling. No separate seller account.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {(
            [
              ['name', 'Full name', 'text'],
              ['email', 'Email', 'email'],
              ['phone', 'Phone', 'tel'],
              ['city', 'City', 'text'],
              ['password', 'Password (min 6)', 'password'],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
              <input
                type={type}
                required={key !== 'phone'}
                minLength={key === 'password' ? 6 : undefined}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? 'Creating...' : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2563EB] font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
