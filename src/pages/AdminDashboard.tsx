import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Car,
  CreditCard,
  LayoutDashboard,
  Check,
  ShieldAlert,
} from 'lucide-react';
import type { Car as CarType, PaymentSubmission, PublicUser } from '../types';
import StatusBadge from '../components/StatusBadge';
import {
  apiAdminListings,
  apiAdminModerateListing,
  apiAdminOverview,
  apiAdminUserStatus,
  apiAdminUsers,
  apiPayments,
  apiReviewPayment,
} from '../lib/authApi';
import { useAuth } from '../context/AuthContext';

type Tab = 'overview' | 'users' | 'listings' | 'payments';

type AdminUserRow = PublicUser & { listings_count: number; is_seller: boolean };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [userFilter, setUserFilter] = useState('all');
  const [listings, setListings] = useState<CarType[]>([]);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [error, setError] = useState('');

  const loadOverview = async () => setOverview(await apiAdminOverview());
  const loadUsers = async (filter = userFilter) => setUsers(await apiAdminUsers(filter));
  const loadListings = async () => setListings(await apiAdminListings());
  const loadPayments = async () => setPayments(await apiPayments());

  useEffect(() => {
    loadOverview().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers().catch((err) => setError(err.message));
    if (tab === 'listings') loadListings().catch((err) => setError(err.message));
    if (tab === 'payments') loadPayments().catch((err) => setError(err.message));
    if (tab === 'overview') loadOverview().catch((err) => setError(err.message));
  }, [tab]);

  const moderateListing = async (id: number, action: string) => {
    const reason = window.prompt(`Reason for ${action}?`) || '';
    if (!reason.trim()) return;
    await apiAdminModerateListing(id, action, reason);
    await loadListings();
  };

  const setUserStatus = async (id: number, status: string) => {
    const reason = window.prompt(`Reason to mark user ${status}?`) || '';
    if (!reason.trim()) return;
    await apiAdminUserStatus(id, status, reason);
    await loadUsers();
  };

  const reviewPay = async (id: number, status: 'paid' | 'rejected') => {
    const note = window.prompt(`Note for ${status}?`) || status;
    await apiReviewPayment(id, status, note);
    await loadPayments();
    await loadOverview();
  };

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'listings', label: 'Listings', icon: Car },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
              <Shield className="h-7 w-7 text-teal-600" /> Admin Console
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Signed in as {user?.email} · sellers, buyers, listings, manual payments
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/account" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-white">
              Account
            </Link>
            <button
              onClick={() => logout()}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        {tab === 'overview' && overview && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Users', overview.total_users],
              ['Sellers', overview.sellers_count],
              ['Buyers', overview.buyers_count],
              ['Active listings', overview.active_listings],
              ['All listings', overview.total_listings],
              ['Pending payment ads', overview.pending_payment_listings],
              ['Payment queue', overview.pending_payments],
              ['Listing fee (PKR)', overview.listing_fee_pkr],
            ].map(([label, value]) => (
              <div key={String(label)} className="glass-panel rounded-2xl p-5 border border-white/40 shadow-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
                <span className="text-2xl font-black text-[#0F172A] mt-1 block">{Number(value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl space-y-4">
            <div className="flex flex-wrap gap-2">
              {['all', 'sellers', 'buyers', 'admins'].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setUserFilter(f);
                    loadUsers(f).catch((err) => setError(err.message));
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border ${
                    userFilter === f ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Listings</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3">
                        <p className="font-bold text-[#0F172A]">{u.name}</p>
                        <p className="text-slate-400">{u.email} · {u.phone}</p>
                      </td>
                      <td className="p-3">
                        {u.role}
                        {u.is_seller ? ' · seller' : ''}
                      </td>
                      <td className="p-3 font-semibold">{u.listings_count}</td>
                      <td className="p-3"><StatusBadge value={u.status} /></td>
                      <td className="p-3 space-x-1">
                        {u.role !== 'admin' && (
                          <>
                            <button onClick={() => setUserStatus(u.id, 'suspended')} className="text-amber-700 font-bold hover:underline">Suspend</button>
                            <button onClick={() => setUserStatus(u.id, 'blocked')} className="text-red-700 font-bold hover:underline">Block</button>
                            <button onClick={() => setUserStatus(u.id, 'active')} className="text-emerald-700 font-bold hover:underline">Activate</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'listings' && (
          <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="p-3">ID</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.slice(0, 80).map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 text-slate-400">#{c.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-[#0F172A]">{c.year} {c.make} {c.model}</p>
                      <p className="text-slate-400">{c.city}</p>
                    </td>
                    <td className="p-3">{c.seller_name}{c.owner_user_id ? ` (#${c.owner_user_id})` : ' · catalog'}</td>
                    <td className="p-3 font-extrabold text-[#2563EB]">{(c.price / 100000).toFixed(1)} L</td>
                    <td className="p-3"><StatusBadge value={c.status} /></td>
                    <td className="p-3"><StatusBadge value={c.payment_status} /></td>
                    <td className="p-3 space-x-1">
                      <button onClick={() => moderateListing(c.id, 'approve')} className="inline-flex p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/30" title="Approve">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moderateListing(c.id, 'suspend')} className="inline-flex p-1.5 rounded-lg bg-red-500/10 text-red-700 border border-red-500/30" title="Suspend">
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moderateListing(c.id, 'sold')} className="text-indigo-700 font-bold hover:underline">Sold</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payments' && (
          <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl space-y-3">
            {payments.length === 0 && <p className="text-sm text-slate-500">No payment submissions.</p>}
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="font-bold text-sm text-[#0F172A]">
                    #{p.id} · Listing #{p.listing_id} · {p.amount.toLocaleString()} PKR
                  </p>
                  <p className="text-xs text-slate-500">
                    User #{p.user_id} · {p.method} · {p.receipt_note}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={p.status} />
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => reviewPay(p.id, 'paid')} className="rounded-lg bg-emerald-600 text-white text-xs font-bold px-2.5 py-1.5">
                        Mark paid
                      </button>
                      <button onClick={() => reviewPay(p.id, 'rejected')} className="rounded-lg bg-red-600 text-white text-xs font-bold px-2.5 py-1.5">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
