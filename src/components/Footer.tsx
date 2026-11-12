import React from 'react';
import { Volleyball, Sparkles, Trophy, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white/95 backdrop-blur-md border-t border-slate-200 text-slate-600 py-6 mt-auto mb-16 md:mb-0 relative z-20 shadow-sm">
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img src="/logo.jpg" alt="Angels ZTP" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 tracking-wider uppercase font-athletic">
                ANGELS ZTP
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300">
                1. Miejsce LALS
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Oficjalna Platforma Zespołu Siatkarskiego • Sezon 2026/2027
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            Sztab: Łukasz Kremer (Kapitan) • Hubert (Trener)
          </span>
          <span className="text-slate-300 hidden md:inline">•</span>
          <span className="font-mono text-slate-400 hidden md:inline">v2.4 Pro Sports Edition</span>
        </div>
      </div>
    </footer>
  );
}
