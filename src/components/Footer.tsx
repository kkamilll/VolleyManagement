'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useClub } from '@/context/ClubContext';
import { Volleyball } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const { club, isSuperAdmin } = useClub();

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const isPortalView = pathname === '/portal' || pathname === '/superadmin' || isSuperAdmin;

  return (
    <footer className="print:hidden bg-white/80 backdrop-blur-md border-t border-slate-200/80 text-slate-500 py-4 mt-auto mb-16 md:mb-0 relative z-20">
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          {!isPortalView && club?.logoUrl ? (
            <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
              <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shadow-2xs">
              <Volleyball className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="font-black text-slate-900 tracking-wider uppercase font-athletic">
            {isPortalView ? 'PORTAL DRUŻYN' : club?.shortName || 'ANGELS ZTP'}
          </span>
          <span className="text-slate-300 text-xs hidden sm:inline">•</span>
          <span className="text-slate-500 text-[11px]">
            {isPortalView ? 'System Zarządzania Drużynami Siatkarskimi' : club?.leagueName || 'System Klubowy'}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          © {new Date().getFullYear()} {isPortalView ? 'Portal Drużyn' : club?.name || 'Angels ZTP'}
        </div>
      </div>
    </footer>
  );
}
