import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { Enquiry } from '../types';
import StatusBadge from '../components/StatusBadge';
import { apiEnquiries } from '../lib/authApi';
import { useAuth } from '../context/AuthContext';

export default function Enquiries() {
  const { user } = useAuth();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiEnquiries()
      .then(setItems)
      .catch((err) => setError(err.message || 'Failed to load'));
  }, []);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 border-b border-slate-200/50 pb-5">
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-[#2563EB]" /> Enquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Messages you sent as a buyer, and messages received on your listings.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        {!error && items.length === 0 && (
          <p className="text-sm text-slate-500">
            No enquiries yet. Browse cars and send a visit request from a listing page.
          </p>
        )}

        <div className="space-y-4">
          {items.map((e) => {
            const mine = e.buyer_id === user?.id;
            return (
              <div key={e.id} className="glass-panel rounded-2xl p-5 border border-white/40 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="font-bold text-[#0F172A]">
                    {mine ? 'You → ' : `${e.buyer_name} → `}
                    Listing #{e.listing_id}
                  </p>
                  <StatusBadge value={e.status} />
                </div>
                <p className="text-sm text-slate-600">{e.message}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>{new Date(e.created_at).toLocaleString()}</span>
                  <span>{e.buyer_phone}</span>
                  <Link to={`/cars/${e.listing_id}`} className="text-[#2563EB] font-bold hover:underline">
                    Open listing
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
