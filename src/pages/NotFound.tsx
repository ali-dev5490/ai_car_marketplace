import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-[#2563EB]">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A]">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">
        That address is not part of the marketplace. Go back to listings or describe the car you want in AI search.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
          Home
        </Link>
        <Link to="/browse" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0F172A]">
          Browse cars
        </Link>
        <Link to="/ai-search" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0F172A]">
          AI search
        </Link>
      </div>
    </div>
  );
}
