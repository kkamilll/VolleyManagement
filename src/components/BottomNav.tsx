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
  ChevronRight,
  Camera
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
      label: 'Taktyka & Trening',
      href: '/taktyka',
      icon: Target,
      isActive: pathname.startsWith('/taktyka') || pathname.startsWith('/trening') || pathname.startsWith('/coach')
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
          className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-white border-t border-slate-200 rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto space-y-3 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] text-slate-800"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="Angels ZTP" className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-sm" />
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-athletic">Angels ZTP</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Wszystkie moduły i narzędzia</p>
                </div>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition"
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
                className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                  pathname === '/fees'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-emerald-50/50 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-slate-900">Składki & BLIK</div>
                  <div className="text-[10px] text-slate-500">Skarbiec i opłaty</div>
                </div>
              </a>

              <a
                href="/team"
                onClick={() => setShowMoreMenu(false)}
                className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                  pathname === '/team'
                    ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-sky-50/50 hover:border-sky-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-slate-900">Kadra Drużyny</div>
                  <div className="text-[10px] text-slate-500">Skład, pozycje i radar</div>
                </div>
              </a>

              <a
                href="/galeria"
                onClick={() => setShowMoreMenu(false)}
                className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                  pathname === '/galeria'
                    ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-purple-50/50 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-slate-900">Galeria Zdjęć</div>
                  <div className="text-[10px] text-slate-500">Zdjęcia meczowe i pucharowe</div>
                </div>
              </a>

              {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.permissions?.isAdmin) && (
                <a
                  href="/admin"
                  onClick={() => setShowMoreMenu(false)}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                    pathname === '/admin'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-amber-50/50 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-slate-900">Admin Klubowy</div>
                    <div className="text-[10px] text-slate-500">Uprawnienia i finanse</div>
                  </div>
                </a>
              )}

              {user?.role === 'TRENER' && (
                <a
                  href="/taktyka?tab=trainings"
                  onClick={() => setShowMoreMenu(false)}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                    pathname.startsWith('/taktyka')
                      ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-sky-50/50 hover:border-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-slate-900">Warsztat Trenera</div>
                    <div className="text-[10px] text-slate-500">Taktyka i treningi</div>
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
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 transition text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-900 uppercase text-xs">Zainstaluj na telefonie</div>
                  <div className="text-[10px] text-sky-700">Dodaj do ekranu głównego (PWA)</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-sky-600" />
            </button>
          </div>
        </div>
      )}

      {/* Main Fixed Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] px-2 pt-1.5 pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.25rem))]"
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
                  className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition group relative ${
                    active ? 'text-sky-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition ${
                    active ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm' : 'group-hover:bg-slate-100'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] tracking-tight mt-0.5 ${
                    active ? 'font-black text-sky-700' : 'font-semibold'
                  }`}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute bottom-0" />
                  )}
                </button>
              );
            }

            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition group relative ${
                  active ? 'text-sky-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition ${
                  active ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm' : 'group-hover:bg-slate-100'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${
                  active ? 'font-black text-sky-700' : 'font-semibold'
                }`}>
                  {item.label}
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute bottom-0" />
                )}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}

