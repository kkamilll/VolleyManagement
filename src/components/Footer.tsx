import React from 'react';
import { Volleyball, Sparkles, Trophy, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#030509]/90 backdrop-blur-xl border-t border-sky-500/20 text-slate-400 py-6 mt-auto mb-16 md:mb-0 relative z-20">
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-sky-500/40 shadow-sm shadow-sky-500/20">
            <img src="/logo.jpg" alt="Angels ZTP" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-wider uppercase font-athletic text-gradient-cyan">
                ANGELS ZTP
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                1. Miejsce LALS
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Oficjalna Platforma Zespołu Siatkarskiego • Sezon 2026/2027
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            Sztab: Łukasz Kremer (Kapitan) • Hubert (Trener)
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="font-mono text-slate-500 hidden md:inline">v2.4 Pro Cyber Edition</span>
        </div>
      </div>
    </footer>
  );
}
