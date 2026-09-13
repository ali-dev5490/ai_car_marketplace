import React from 'react';

const TONES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  paid: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  pending_payment: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  pending_review: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  unpaid: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/30',
  suspended: 'bg-red-500/10 text-red-700 border-red-500/30',
  blocked: 'bg-red-500/10 text-red-700 border-red-500/30',
  paused: 'bg-slate-500/10 text-slate-600 border-slate-400/40',
  draft: 'bg-slate-500/10 text-slate-600 border-slate-400/40',
  sold: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
  open: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  closed: 'bg-slate-500/10 text-slate-600 border-slate-400/40',
};

export default function StatusBadge({ value }: { value?: string | null }) {
  const key = (value || 'unknown').toLowerCase();
  const tone = TONES[key] || 'bg-slate-500/10 text-slate-600 border-slate-400/40';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {(value || 'unknown').replace(/_/g, ' ')}
    </span>
  );
}
