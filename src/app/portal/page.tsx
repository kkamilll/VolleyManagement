'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useClub } from '@/context/ClubContext';
import {
  Volleyball,
  Calendar,
  Target,
  CreditCard,
  Users,
  ArrowRight,
  LogIn,
  Crown,
  Trophy,
} from 'lucide-react';

export default function PortalLandingPage() {
  const { user } = useAuth();
  const { isSuperAdmin } = useClub();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center justify-center py-10 sm:py-16">
      <section className="w-full relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-white text-slate-900 border border-slate-200 shadow-xl shadow-slate-900/5 text-center">
        {/* Top Club Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-amber-500 to-emerald-500" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_55%)]" />

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 sm:px-14 sm:py-16 space-y-6">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-athletic leading-[1.06] text-slate-900">
            Portal drużyn{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-500">
              siatkarskich
            </span>
          </h1>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {user ? (
              isSuperAdmin ? (
                <Link
                  href="/superadmin"
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95"
                >
                  <Crown className="w-4 h-4" />
                  <span>Panel SuperAdmina</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95"
                >
                  <span>Przejdź do mojego klubu</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Zaloguj się</span>
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition"
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Dołącz kodem</span>
                </Link>
              </>
            )}
          </div>

          {/* Minimal Module Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            {[
              { icon: Calendar, label: 'Terminarz' },
              { icon: Target, label: 'Taktyka' },
              { icon: Trophy, label: 'Rozgrywki' },
              { icon: CreditCard, label: 'Składki' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <span
                  key={m.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{m.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
