'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Volleyball,
  Target,
  CreditCard,
  Users,
  Shield,
  Flame,
  Smartphone,
  MoreHorizontal,
  X,
  ChevronRight
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Close more menu when route changes
  useEffect(() => {
    setShowMoreMenu(false);
  }, [pathname]);

  const navItems = [
    {
      label: 'Pulpit',
      href: '/',
      icon: LayoutDashboard,
      isActive: pathname === '/'
    },
    {
      label: 'Terminarz',
      href: '/events',
      icon: Calendar,
      isActive: pathname.startsWith('/events')
    },
    {
      label: 'Rozgrywki',
      href: '/rozgrywki',
      icon: Volleyball,
      isActive: pathname.startsWith('/rozgrywki')
    },
    {
      label: 'Taktyka',
      href: '/taktyka',
      icon: Target,
      isActive: pathname.startsWith('/taktyka') || pathname.startsWith('/coach')
    },
    {
      label: 'Klub',
      href: '#more',
      icon: MoreHorizontal,
      isMore: true,
      isActive: showMoreMenu || pathname === '/fees' || pathname === '/team' || pathname === '/admin'
    }
  ];

  return (
    <>
      {/* Mobile Bottom Sheet Drawer for "Klub / Więcej" */}
      {showMoreMenu && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-[#0b0e14] border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto space-y-3 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))]"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="Angels ZTP" className="w-7 h-7 rounded-lg object-cover border border-slate-700" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-athletic">Angels ZTP</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Wszystkie moduły i narzędzia</p>
                </div>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                aria-label="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Grid Links */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href="/fees"
                onClick={() => setShowMoreMenu(false)}
                className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${pathname === '/fees'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-emerald-500/40'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white">Składki & BLIK</div>
                  <div className="text-[10px] text-slate-400">Skarbiec i opłaty</div>
                </div>
              </a>

              <a
                href="/team"
                onClick={() => setShowMoreMenu(false)}
                className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${pathname === '/team'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-sky-500/40'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-white">Kadra Drużyny</div>
                  <div className="text-[10px] text-slate-400">Skład, pozycje i radar</div>
                </div>
              </a>

              {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.permissions?.isAdmin) && (
                <a
                  href="/admin"
                  onClick={() => setShowMoreMenu(false)}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${pathname === '/admin'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-amber-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-white">Admin Klubowy</div>
                    <div className="text-[10px] text-slate-400">Uprawnienia i finanse</div>
                  </div>
                </a>
              )}

              {user?.role === 'TRENER' && (
                <a
                  href="/coach"
                  onClick={() => setShowMoreMenu(false)}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${pathname === '/coach'
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-sky-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-white">Centrum Trenera</div>
                    <div className="text-[10px] text-slate-400">Zarządzanie meczem</div>
                  </div>
                </a>
              )}
            </div>

            {/* PWA Install Button */}
            <button
              onClick={() => {
                setShowMoreMenu(false);
                window.dispatchEvent(new CustomEvent('open-pwa-install'));
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-black text-white uppercase text-xs">Zainstaluj na telefonie</div>
                  <div className="text-[10px] text-sky-300/80">Dodaj do ekranu głównego (PWA)</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>
      )}

      {/* Main Fixed Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050811]/90 backdrop-blur-2xl border-t border-sky-500/20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] px-2 pt-1.5 pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.25rem))]"
        aria-label="Nawigacja mobilna"
      >
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            if (item.isMore) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition group relative ${active ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <div className={`p-1.5 rounded-xl transition ${active ? 'bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/30' : 'group-hover:bg-slate-800/50'
                    }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'font-black text-white' : 'font-semibold'
                    }`}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute bottom-0 shadow-md shadow-cyan-400" />
                  )}
                </button>
              );
            }

            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition group relative ${active ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition ${active ? 'bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/30' : 'group-hover:bg-slate-800/50'
                  }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'font-black text-white' : 'font-semibold'
                  }`}>
                  {item.label}
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute bottom-0 shadow-md shadow-cyan-400" />
                )}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}

