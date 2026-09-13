import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import type { Car, PaymentSubmission } from '../types';
import StatusBadge from '../components/StatusBadge';
import {
  apiMyListings,
  apiPaymentFee,
  apiPayments,
  apiSubmitPayment,
} from '../lib/authApi';
import { useAuth } from '../context/AuthContext';

export default function Payments() {
  const { listingFeePkr } = useAuth();
  const [params] = useSearchParams();
  const preselect = params.get('listing');
  const [listings, setListings] = useState<Car[]>([]);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [fee, setFee] = useState(listingFeePkr);
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [listingId, setListingId] = useState(preselect || '');
  const [method, setMethod] = useState('Bank Transfer');
  const [receiptNote, setReceiptNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const payable = useMemo(
    () =>
      listings.filter(
        (c) =>
          c.payment_status === 'unpaid' ||
          c.payment_status === 'rejected' ||
          c.payment_status === 'pending' ||
          c.status === 'pending_payment'
      ),
    [listings]
  );

  const reload = async () => {
    const [cars, pays, feeInfo] = await Promise.all([apiMyListings(), apiPayments(), apiPaymentFee()]);
    setListings(cars);
    setPayments(pays);
    setFee(feeInfo.listing_fee_pkr);
    setInstructions(feeInfo.instructions || {});
    if (!listingId && cars[0]) setListingId(String(cars[0].id));
  };

  useEffect(() => {
    reload().catch((err) => setError(err.message || 'Failed to load payments'));
  }, []);

  useEffect(() => {
    if (preselect) setListingId(preselect);
  }, [preselect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiSubmitPayment({
        listing_id: Number(listingId),
        method,
        receipt_note: receiptNote,
      });
      setReceiptNote('');
      setMessage('Receipt submitted. Waiting for admin confirmation.');
      await reload();
    } catch (err: any) {
      setError(err.message || 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="border-b border-slate-200/50 pb-5">
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-[#2563EB]" /> Manual Payments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pay listing fee offline, submit receipt details, admin marks paid.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl space-y-3">
          <p className="text-sm font-bold text-[#0F172A]">
            Listing fee: <span className="text-[#2563EB]">{fee.toLocaleString()} PKR</span>
          </p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Bank: {instructions.bank_name} · {instructions.account_title} · {instructions.account_number}</li>
            <li>JazzCash: {instructions.jazzcash}</li>
            <li>EasyPaisa: {instructions.easypaisa}</li>
            <li className="text-xs text-slate-400">{instructions.note}</li>
          </ul>
        </div>

        <form onSubmit={submit} className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl space-y-4">
          <h2 className="font-bold text-[#0F172A]">Submit payment receipt</h2>
          {payable.length === 0 ? (
            <p className="text-sm text-slate-500">
              No listings need payment.{' '}
              <Link to="/ai-posting" className="text-[#2563EB] font-bold hover:underline">
                Create a listing
              </Link>
            </p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Listing</label>
                <select
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm"
                  required
                >
                  {payable.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} · {c.year} {c.make} {c.model} ({c.payment_status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm"
                >
                  <option>Bank Transfer</option>
                  <option>JazzCash</option>
                  <option>EasyPaisa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Receipt / transaction reference</label>
                <textarea
                  required
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm"
                  placeholder="e.g. HBL txn #99821 paid today 6pm"
                />
              </div>
              {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
              {message && <p className="text-sm text-emerald-600 font-semibold">{message}</p>}
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[#2563EB] text-white text-sm font-bold px-4 py-2.5 hover:bg-[#1D4ED8] disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Submit for admin review'}
              </button>
            </>
          )}
        </form>

        <div className="glass-panel rounded-3xl p-6 border border-white/40 shadow-xl">
          <h2 className="font-bold text-[#0F172A] mb-4">Your payment history</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-sm">
                  <div>
                    <p className="font-semibold text-[#0F172A]">Listing #{p.listing_id} · {p.amount.toLocaleString()} PKR</p>
                    <p className="text-xs text-slate-500">{p.method} · {p.receipt_note}</p>
                  </div>
                  <StatusBadge value={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
