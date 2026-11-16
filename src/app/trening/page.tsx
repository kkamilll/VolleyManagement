'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { TrainingPlannerContent } from '@/components/TrainingPlanner';
import { Volleyball, Compass, Calendar, Target, Plus, Flame } from 'lucide-react';

function TreningPageInner() {
  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 pb-24 md:pb-16 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
            <Volleyball className="w-6 h-6 drop-shadow-xs" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-slate-900">
                Konspekty & Treningi
              </h1>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                Warsztat Trenera
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Konspekty jednostek treningowych, schematy ćwiczeń z rysunkami boiska, cele i lista obecności z Terminarza.
            </p>
          </div>
        </div>

        {/* Quick Nav shortcuts */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link
            href="/taktyka"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-sky-700 hover:text-sky-800 border border-slate-200 transition shadow-2xs font-bold text-xs flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-sky-600" />
            <span>Tablica Taktyczna</span>
          </Link>
          <Link
            href="/events"
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Terminarz Klubu</span>
          </Link>
        </div>
      </div>

      {/* Main Training Planner Content in TRAININGS mode */}
      <TrainingPlannerContent mode="TRAININGS" hideHeader={true} />
    </div>
  );
}

export default function TreningPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Wczytywanie planów treningowych...</p>
        </div>
      }
    >
      <TreningPageInner />
    </Suspense>
  );
}
