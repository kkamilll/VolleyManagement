'use client';

import React from 'react';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { FolderArchive, X, AlertCircle, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ArchiveModeBanner() {
  const { isArchiveMode, activeSeason, seasons, enterArchiveMode, exitArchiveMode } = useSeasonArchive();

  if (!isArchiveMode) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-purple-950/95 via-amber-950/90 to-purple-950/95 border-b-2 border-amber-500/60 shadow-2xl backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Indicator & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-sm animate-pulse">
            <FolderArchive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                TRYB ARCHIWUM
              </span>
              <h2 className="text-sm font-black text-white truncate font-athletic tracking-wide">
                {activeSeason?.name || 'Zarchiwizowany Sezon'}
              </h2>
              {activeSeason?.archivedAt && (
                <span className="text-[11px] text-amber-200/80 hidden md:inline">
                  (zarchiwizowano: {new Date(activeSeason.archivedAt).toLocaleDateString('pl-PL')})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300/90 truncate flex items-center gap-1.5 mt-0.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Przeglądasz zamrożone dane historyczne całego serwisu (Tylko do odczytu). Bieżący sezon 2026/2027 jest w 100% bezpieczny.</span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Change archive dropdown */}
          {seasons.length > 1 && (
            <select
              value={activeSeason?.id || ''}
              onChange={e => {
                if (e.target.value === 'current') {
                  exitArchiveMode();
                } else if (e.target.value) {
                  enterArchiveMode(e.target.value);
                }
              }}
              className="bg-slate-950/80 border border-amber-500/40 rounded-xl px-2.5 py-1 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="current">← Wróć do bieżącego sezonu</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <Link
            href="/admin?tab=seasons"
            className="px-2.5 py-1 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 text-xs font-bold transition hidden lg:inline-flex items-center gap-1"
          >
            <span>Centrum Archiwum</span>
          </Link>

          {/* Big Exit Button */}
          <button
            onClick={exitArchiveMode}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer font-athletic"
            title="Wyłącz tryb archiwum i wróć do bieżącego sezonu 2026/2027"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span>Wróć do obecnego sezonu</span>
          </button>
        </div>

      </div>
    </div>
  );
}

