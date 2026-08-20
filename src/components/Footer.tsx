import React from 'react';
import { Car, Mail, Phone, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="app-footer" className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white flex items-center gap-1">
                PakCar <span className="text-xs bg-[#2563EB]/25 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Showcasing the future of automotive marketplaces with enterprise-grade AI automation, pricing models, and conversational search.
            </p>
            <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 p-2 rounded-lg text-blue-400 w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>Prototype by Mr Solution Tech</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Home Marketplace</Link></li>
              <li><Link to="/browse" className="hover:text-blue-500 transition-colors">Browse Used Cars</Link></li>
              <li><Link to="/ai-search" className="hover:text-blue-500 transition-colors">Conversational AI Search</Link></li>
              <li><Link to="/ai-posting" className="hover:text-blue-500 transition-colors">AI Listing Scanner</Link></li>
            </ul>
          </div>

          {/* Market Segments */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Popular Brands</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/browse?make=Toyota" className="hover:text-blue-500 transition-colors">Toyota Corolla & Yaris</Link></li>
              <li><Link to="/browse?make=Honda" className="hover:text-blue-500 transition-colors">Honda Civic & City</Link></li>
              <li><Link to="/browse?make=Suzuki" className="hover:text-blue-500 transition-colors">Suzuki Alto & Cultus</Link></li>
              <li><Link to="/browse?make=KIA" className="hover:text-blue-500 transition-colors">KIA Sportage & Picanto</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Solution Tech Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>Lahore, Pakistan</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>+923036938555</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span>contact@mrsolutiontech.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex justify-end items-center text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-orange-500" /> Developed by Mr Solution Tech
          </span>
        </div>
      </div>
    </footer>
  );
}
