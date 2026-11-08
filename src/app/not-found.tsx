import React from 'react';
import Link from 'next/link';
import { Volleyball, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Volleyball className="w-10 h-10 animate-bounce" />
        </div>
        
        <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-bold px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
          Aut! Błąd 404
        </span>

        <h1 className="text-2xl font-black text-white mt-3 uppercase tracking-wider">
          Piłka w aucie
        </h1>

        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Strona, której szukasz, nie istnieje lub została przeniesiona do innej sekcji systemu Angels ZTP.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-sky-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Strona Główna</span>
          </Link>
          <Link
            href="/rozgrywki?tab=liga"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rozgrywki LALS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

