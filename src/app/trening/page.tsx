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
          <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <Volleyball className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-slate-900">
                Konspekty & Treningi
              </h1>
            </div>
          </div>
        </div>

        {/* Quick Nav shortcuts */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/taktyka"
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-200 hover:border-amber-400 transition shadow-2xs font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Compass className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tablica Taktyczna</span>
          </Link>
          <Link
            href="/events"
            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
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
