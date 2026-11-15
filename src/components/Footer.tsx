'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 text-slate-500 py-4 mt-auto mb-16 md:mb-0 relative z-20">
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
            <img src="/logo.jpg" alt="Angels ZTP" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-slate-900 tracking-wider uppercase font-athletic">
            ANGELS ZTP
          </span>
          <span className="text-slate-300 text-xs hidden sm:inline">•</span>
          <span className="text-slate-500 text-[11px]">
            Lubońska Amatorska Liga Siatkówki • Sezon 2026/2027
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          © {new Date().getFullYear()} Angels ZTP
        </div>
      </div>
    </footer>
  );
}
