'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  Trophy,
  Award,
  Calendar,
  Users,
  Coins,
  Shield,
  TrendingUp,
  FileText,
  User as UserIcon,
  ClipboardList,
  Target,
  Volleyball,
  CheckCircle2,
  Star,
} from 'lucide-react';

type ReportTab = 'team' | 'player' | 'coach';

function SeasonSummaryReportInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const seasonParam = searchParams.get('id') || 'current';
  const initialTab = (searchParams.get('tab') as ReportTab) || 'team';
  const initialPlayerId = searchParams.get('playerId') || '';

  const [activeTab, setActiveTab] = useState<ReportTab>(
    initialTab === 'player' || initialTab === 'coach' ? initialTab : 'team'
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(initialPlayerId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [viewer, setViewer] = useState<{ id: string; name: string; role: string; isStaff: boolean; isManager: boolean } | null>(null);
  const [includeFinancials, setIncludeFinancials] = useState(true);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'team' || t === 'player' || t === 'coach') {
      setActiveTab(t);
    }
    const pId = searchParams.get('playerId');
    if (pId) {
      setSelectedPlayerId(pId);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/seasons/report?id=${encodeURIComponent(seasonParam)}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Nie udało się pobrać raportu');
        }
        const data = await res.json();
        setReport(data.report);
        setAvailableSeasons(data.availableSeasons || []);
        setViewer(data.viewer || null);

        const stats: any[] = data.report?.playerStats || [];
        setSelectedPlayerId((prev) => {
          if (prev && stats.some((p) => p.id === prev)) return prev;
          if (data.viewer?.id && stats.some((p) => p.id === data.viewer.id)) {
            return data.viewer.id;
          }
          return stats[0]?.id || '';
        });
      } catch (err: any) {
        setError(err.message || 'Wystąpił błąd podczas ładowania raportu');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [seasonParam]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSeasonChange = (newId: string) => {
    const base = pathname.startsWith('/admin') ? '/admin/raport-sezonu' : '/raport-sezonu';
    router.push(`${base}?id=${encodeURIComponent(newId)}&tab=${activeTab}`);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-11 h-11 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
            Generowanie Podsumowania Sezonu...
          </h2>
          <p className="text-xs text-slate-500">
            Ładowanie statystyk drużyny, zawodników i sztabu...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 p-6 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-black">
            ✕
          </div>
          <h2 className="text-lg font-black text-slate-900 uppercase">Nie można wygenerować raportu</h2>
          <p className="text-xs text-slate-600">{error || 'Brak danych dla wybranego sezonu.'}</p>
          <div className="pt-2 flex justify-center">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold transition"
            >
              Powrót na stronę główną
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { club, summary, matches, leagueTable, playerStats, coachSummary, financials } = report;
  const isStaff = Boolean(viewer?.isStaff);
  const selectedPlayer =
    (playerStats || []).find((p: any) => p.id === selectedPlayerId) ||
    (playerStats || []).find((p: any) => p.id === viewer?.id) ||
    (playerStats || [])[0] ||
    null;

  const canSelectAnyPlayer = isStaff;
  const pointSharePercent =
    selectedPlayer && summary.totalTeamPoints > 0
      ? Math.round((selectedPlayer.totalPoints / summary.totalTeamPoints) * 100)
      : 0;

  const generatedDate = new Date().toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const backHref = pathname.startsWith('/admin') ? '/admin' : '/';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:text-black font-sans pb-24 print:pb-0">
      {/* ACTION BAR (HIDDEN IN PRINT / PDF) */}
      <div className="print:hidden sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 text-slate-100 px-3 sm:px-6 py-3 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col gap-2.5">
          {/* Row 1: Back, Mode Tabs, Print PDF */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={backHref}
                className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wróć</span>
              </Link>

              {/* 3 Mode Tabs */}
              <div className="inline-flex items-center gap-1 p-1 bg-slate-800 border border-slate-700 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className={`h-7 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'team'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Drużyna</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('player')}
                  className={`h-7 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'player'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Zawodnik</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('coach')}
                  className={`h-7 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'coach'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Trener</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Drukuj / Zapisz PDF</span>
            </button>
          </div>

          {/* Row 2: Context controls (Season select, Player select, Financials toggle) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Sezon:</span>
                <select
                  value={report.seasonId}
                  onChange={(e) => handleSeasonChange(e.target.value)}
                  className="h-8 px-2.5 rounded-lg bg-slate-800 border border-slate-600 text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
                >
                  {availableSeasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'player' && (playerStats || []).length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Zawodnik:</span>
                  {canSelectAnyPlayer ? (
                    <select
                      value={selectedPlayer?.id || ''}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className="h-8 px-2.5 rounded-lg bg-slate-800 border border-slate-600 text-xs font-bold text-white focus:outline-none cursor-pointer"
                    >
                      {(playerStats || []).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.number ? `#${p.number} ` : ''}{p.name} ({p.position})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-bold">
                      {selectedPlayer?.name || viewer?.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {activeTab === 'team' && isStaff && financials && (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="rounded accent-amber-400 cursor-pointer"
                />
                <span>Dołącz rozliczenie finansowe</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* PRINTABLE A4 SHEET WRAPPER */}
      <div className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-10 print:p-0 print:max-w-none">
        <div className="bg-white rounded-3xl print:rounded-none shadow-xl print:shadow-none border border-slate-200 print:border-none p-5 sm:p-9 lg:p-11 space-y-7">
          {/* DOCUMENT HEADER (SHARED ACROSS ALL 3 MODES) */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xl border-2 border-amber-400 overflow-hidden shrink-0">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                ) : (
                  <Volleyball className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {activeTab === 'team'
                      ? 'Podsumowanie Sezonu Drużyny'
                      : activeTab === 'player'
                      ? 'Indywidualna Karta Sezonu Zawodnika'
                      : 'Podsumowanie Sezonu Trenera i Sztabu'}
                  </span>
                  {report.isArchive && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300">
                      Archiwum
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase font-athletic">
                  {club.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {report.seasonName} {club.city ? `• ${club.city}` : ''}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5 shrink-0">
              <div className="font-bold text-slate-800">Wygenerowano: {generatedDate}</div>
              <div>Trener: <span className="font-semibold text-slate-800">{club.coach?.name || '—'}</span></div>
              <div>Kapitan: <span className="font-semibold text-slate-800">{club.captain?.name || '—'}</span></div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* TAB 1: DRUŻYNA (TEAM SUMMARY)                              */}
          {/* ========================================================== */}
          {activeTab === 'team' && (
            <div className="space-y-7">
              {/* KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 break-inside-avoid">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bilans Meczów</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                    {summary.matchesWon}W – {summary.matchesLost}P
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {summary.matchesPlayed} meczów • {summary.winRate}% zwycięstw
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                    <span>Bilans Setów</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                    {summary.setsWon}:{summary.setsLost}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ratio: {summary.setsRatio} • Miejsce: {summary.leagueStanding}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Frekwencja</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                    {summary.averageAttendance}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {summary.totalEvents} wydarzeń • {summary.totalTrainings} treningów
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Liderzy</span>
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-1.5 truncate" title={summary.topScorer}>
                    Pkt: {summary.topScorer}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={summary.mvpLeader}>
                    MVP: {summary.mvpLeader}
                  </div>
                </div>
              </div>

              {/* Team Insights Row: Form, Home/Away, Scoring Breakdown & Specialist Awards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 break-inside-avoid">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Forma i Bilans Spotkań
                    </h3>
                    {Array.isArray(summary.form) && summary.form.length > 0 && (
                      <div className="flex items-center gap-1">
                        {summary.form.map((res: string, i: number) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded-md font-mono font-black text-[11px] flex items-center justify-center ${
                              res === 'W'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Dom / Wyjazd</div>
                      <div className="font-mono font-black text-slate-900 mt-0.5">
                        {summary.homeRecord?.won ?? 0}-{summary.homeRecord?.lost ?? 0} / {summary.awayRecord?.won ?? 0}-{summary.awayRecord?.lost ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Wygrane 3:0</div>
                      <div className="font-mono font-black text-emerald-700 mt-0.5">{summary.wins30 ?? 0}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Tie-breaki</div>
                      <div className="font-mono font-black text-indigo-700 mt-0.5">
                        {summary.tieBreaksWon ?? 0}/{summary.tieBreaksPlayed ?? 0}
                      </div>
                    </div>
                  </div>
                  {summary.scoringBreakdown && summary.scoringBreakdown.totalPoints > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>Rozkład zdobytych punktów ({summary.scoringBreakdown.totalPoints} pkt)</span>
                        <span className="font-mono">
                          Atak {summary.scoringBreakdown.attackPct}% • Blok {summary.scoringBreakdown.blockPct}% • Asy {summary.scoringBreakdown.servePct}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-200">
                        <div className="bg-sky-500 h-full" style={{ width: `${summary.scoringBreakdown.attackPct}%` }} />
                        <div className="bg-indigo-500 h-full" style={{ width: `${summary.scoringBreakdown.blockPct}%` }} />
                        <div className="bg-emerald-500 h-full" style={{ width: `${summary.scoringBreakdown.servePct}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {summary.specialistAwards && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Wyróżnienia Indywidualne Sezonu</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Najlepszy Atak</div>
                        <div className="font-bold text-slate-900 mt-0.5 truncate">{summary.specialistAwards.bestAttacker}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Najlepszy Blok</div>
                        <div className="font-bold text-slate-900 mt-0.5 truncate">{summary.specialistAwards.bestBlocker}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Najlepsza Zagrywka</div>
                        <div className="font-bold text-slate-900 mt-0.5 truncate">{summary.specialistAwards.bestServer}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Żelazna Frekwencja</div>
                        <div className="font-bold text-slate-900 mt-0.5 truncate">{summary.specialistAwards.bestAttendance}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Matches Table */}
              <div className="space-y-2.5 break-inside-avoid">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Wyniki Meczów ({matches.length})</span>
                </h2>
                {matches.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    Brak zapisanych meczów w tym sezonie.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Przeciwnik</th>
                          <th className="py-2.5 px-3 text-center">Wynik</th>
                          <th className="py-2.5 px-3">Sety</th>
                          <th className="py-2.5 px-3">MVP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matches.map((m: any) => (
                          <tr key={m.id}>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {new Date(m.date).toLocaleDateString('pl-PL')}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">{m.opponent}</td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono font-black text-[11px] ${
                                  m.won ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {m.score}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{m.sets || '—'}</td>
                            <td className="py-2 px-3 text-slate-700 font-semibold">{m.mvp || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Squad Stats Table */}
              <div className="space-y-2.5 break-inside-avoid">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>Statystyki Zawodników ({playerStats.length})</span>
                  </h2>
                  {isStaff && (
                    <span className="print:hidden text-[11px] text-slate-500">
                      Kliknij zawodnika, aby otworzyć jego indywidualną kartę PDF
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Zawodnik</th>
                        <th className="py-2.5 px-3">Pozycja</th>
                        <th className="py-2.5 px-2 text-center">Pkt</th>
                        <th className="py-2.5 px-2 text-center">Atak</th>
                        <th className="py-2.5 px-2 text-center">Blok</th>
                        <th className="py-2.5 px-2 text-center">Asy</th>
                        <th className="py-2.5 px-2 text-center">MVP</th>
                        <th className="py-2.5 px-3 text-right">Frekwencja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {playerStats.map((p: any) => (
                        <tr
                          key={p.id}
                          onClick={() => {
                            if (isStaff || p.id === viewer?.id) {
                              setSelectedPlayerId(p.id);
                              setActiveTab('player');
                            }
                          }}
                          className={
                            isStaff || p.id === viewer?.id
                              ? 'hover:bg-amber-50/60 cursor-pointer transition'
                              : ''
                          }
                        >
                          <td className="py-2 px-3 font-mono font-bold text-slate-500">{p.number ?? '—'}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                          <td className="py-2 px-3 text-slate-600">{p.position}</td>
                          <td className="py-2 px-2 text-center font-mono font-black text-slate-950">{p.totalPoints}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-700">{p.totalAttack}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-700">{p.totalBlock}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-700">{p.totalServe}</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-amber-700">
                            {p.mvpCount > 0 ? `${p.mvpCount}×` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            {p.attendancePercent}% ({p.attendedEvents}/{p.totalEvents})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* League Table (if exists) */}
              {leagueTable && leagueTable.length > 0 && (
                <div className="space-y-2.5 break-inside-avoid">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Tabela Ligowa</span>
                  </h2>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                          <th className="py-2 px-3">Poz.</th>
                          <th className="py-2 px-3">Drużyna</th>
                          <th className="py-2 px-2 text-center">M</th>
                          <th className="py-2 px-2 text-center">Pkt</th>
                          <th className="py-2 px-2 text-center">W-P</th>
                          <th className="py-2 px-2 text-center">Sety</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leagueTable.map((t: any, idx: number) => {
                          const isOwn = t.teamName?.toLowerCase().includes(club.name.toLowerCase());
                          return (
                            <tr key={t.id || idx} className={isOwn ? 'bg-amber-50 font-bold' : ''}>
                              <td className="py-2 px-3 font-mono font-bold">{t.position ?? idx + 1}.</td>
                              <td className="py-2 px-3 text-slate-900">{t.teamName}</td>
                              <td className="py-2 px-2 text-center font-mono">{t.matchesPlayed}</td>
                              <td className="py-2 px-2 text-center font-mono font-black">{t.points}</td>
                              <td className="py-2 px-2 text-center font-mono">
                                {t.matchesWon}-{t.matchesLost}
                              </td>
                              <td className="py-2 px-2 text-center font-mono">
                                {t.setsWon}:{t.setsLost}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financials (Staff only & toggleable) */}
              {includeFinancials && isStaff && financials && (
                <div className="space-y-2.5 break-inside-avoid">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>Podsumowanie Finansowe</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-black uppercase text-emerald-700">Wpływy ze składek</div>
                      <div className="text-xl font-black font-mono text-emerald-900 mt-0.5">
                        {financials.totalCollected} zł
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                      <div className="text-[10px] font-black uppercase text-rose-700">Wydatki klubowe</div>
                      <div className="text-xl font-black font-mono text-rose-900 mt-0.5">
                        {financials.totalSpent} zł
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-black uppercase text-slate-600">Bilans skarbca</div>
                      <div className="text-xl font-black font-mono text-slate-950 mt-0.5">
                        {financials.balance} zł
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: ZAWODNIK (INDIVIDUAL PLAYER SEASON CARD)            */}
          {/* ========================================================== */}
          {activeTab === 'player' && (
            <div className="space-y-6">
              {!selectedPlayer ? (
                <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  Brak zawodników do wyświetlenia w tym klubie.
                </div>
              ) : (
                <>
                  {/* Player Identity Banner (Clean Light Style) */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-50 via-white to-amber-50/70 border border-slate-200 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 break-inside-avoid">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-2xl font-mono overflow-hidden shrink-0">
                        {selectedPlayer.avatar ? (
                          <img
                            src={selectedPlayer.avatar}
                            alt={selectedPlayer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : selectedPlayer.number ? (
                          `#${selectedPlayer.number}`
                        ) : (
                          selectedPlayer.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-slate-950">
                            {selectedPlayer.name}
                          </h2>
                          {selectedPlayer.isCaptain && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                              Kapitan
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          {selectedPlayer.position}
                          {selectedPlayer.number ? ` • Numer #${selectedPlayer.number}` : ''} • Status: {selectedPlayer.status}
                        </p>
                        {Array.isArray(selectedPlayer.badges) && selectedPlayer.badges.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {selectedPlayer.badges.map((b: string) => (
                              <span
                                key={b}
                                className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-900 text-[10px] font-bold"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:text-right">
                      <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Ranking w drużynie</div>
                        <div className="text-xl font-black font-mono text-slate-950">
                          #{selectedPlayer.teamRank} <span className="text-xs font-bold text-slate-400">/ {playerStats.length}</span>
                        </div>
                      </div>
                      {selectedPlayer.mvpCount > 0 && (
                        <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200">
                          <div className="text-[10px] uppercase font-bold text-amber-700">Nagrody MVP</div>
                          <div className="text-xl font-black font-mono text-amber-800">
                            {selectedPlayer.mvpCount}×
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Point Profile Bar (computed reliably from attack/block/serve) */}
                  {(() => {
                    const atk = Number(selectedPlayer.totalAttack) || 0;
                    const blk = Number(selectedPlayer.totalBlock) || 0;
                    const srv = Number(selectedPlayer.totalServe) || 0;
                    const sum = atk + blk + srv;
                    if (sum <= 0) return null;
                    const atkPct = Math.round((atk / sum) * 100);
                    const blkPct = Math.round((blk / sum) * 100);
                    const srvPct = Math.max(0, 100 - atkPct - blkPct);
                    return (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 break-inside-avoid">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                          <span>Profil punktowy zawodnika ({sum} pkt)</span>
                          <span className="font-mono text-[11px]">
                            Atak {atkPct}% ({atk}) • Blok {blkPct}% ({blk}) • Zagrywka {srvPct}% ({srv})
                          </span>
                        </div>
                        <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200">
                          {atkPct > 0 && <div className="bg-sky-500 h-full" style={{ width: `${atkPct}%` }} />}
                          {blkPct > 0 && <div className="bg-indigo-500 h-full" style={{ width: `${blkPct}%` }} />}
                          {srvPct > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${srvPct}%` }} />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Scoring & Match Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 break-inside-avoid">
                    {[
                      { label: 'Punkty razem', value: selectedPlayer.totalPoints, accent: 'text-slate-950' },
                      { label: 'Atak', value: selectedPlayer.totalAttack, accent: 'text-sky-700' },
                      { label: 'Blok', value: selectedPlayer.totalBlock, accent: 'text-indigo-700' },
                      { label: 'Zagrywka / Asy', value: selectedPlayer.totalServe, accent: 'text-emerald-700' },
                      { label: 'Śr. pkt / mecz', value: selectedPlayer.avgPointsPerMatch, accent: 'text-amber-700' },
                      { label: 'Rozegrane mecze', value: selectedPlayer.matchesPlayed, accent: 'text-slate-900' },
                    ].map((card) => (
                      <div key={card.label} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {card.label}
                        </div>
                        <div className={`text-2xl font-black font-mono mt-1 ${card.accent}`}>{card.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Attendance Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 break-inside-avoid">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Frekwencja w Sezonie</span>
                      </h3>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">Ogólna (wszystkie wydarzenia)</span>
                          <span className="font-mono text-slate-950">
                            {selectedPlayer.attendancePercent}% ({selectedPlayer.attendedEvents}/{selectedPlayer.totalEvents})
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, selectedPlayer.attendancePercent)}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">Treningi</span>
                          <span className="font-mono text-slate-950">
                            {selectedPlayer.trainingAttendancePercent}% ({selectedPlayer.attendedTrainings}/{selectedPlayer.totalTrainings})
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{ width: `${Math.min(100, selectedPlayer.trainingAttendancePercent)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Obecność na meczach i sparingach</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedPlayer.attendedMatches} / {selectedPlayer.totalMatchEvents}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span>Wkład w Zespół</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold uppercase text-slate-500">Udział w pkt drużyny</div>
                          <div className="text-lg font-black font-mono text-slate-900 mt-0.5">{pointSharePercent}%</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold uppercase text-slate-500">Średnia frekwencja drużyny</div>
                          <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                            {summary.averageAttendance}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold uppercase text-slate-500">Składki opłacone</div>
                          <div className="text-sm font-black font-mono text-emerald-700 mt-0.5">
                            {selectedPlayer.feesPaid} zł
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] font-bold uppercase text-slate-500">Składki oczekujące</div>
                          <div className="text-sm font-black font-mono text-amber-700 mt-0.5">
                            {selectedPlayer.feesPending} zł
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coach Notes */}
                  <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1.5 break-inside-avoid">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Komentarz / Ocena Trenera</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {selectedPlayer.coachNotes?.trim()
                        ? selectedPlayer.coachNotes
                        : 'Brak dodatkowej notatki trenerskiej dla tego zawodnika (można ją uzupełnić w profilu zawodnika w zakładce Kadra).'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: TRENER (COACH / STAFF SEASON SUMMARY)               */}
          {/* ========================================================== */}
          {activeTab === 'coach' && coachSummary && (
            <div className="space-y-6">
              {/* Coach Identity Card (Clean Light Style) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/60 border border-sky-200/80 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 break-inside-avoid">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center font-black text-2xl shrink-0">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-sky-700">
                      Podsumowanie Pracy Sztabu
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-slate-950">
                      {coachSummary.coach.name}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {coachSummary.coach.position}
                      {coachSummary.coach.email ? ` • ${coachSummary.coach.email}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="px-4 py-2 rounded-2xl bg-white border border-sky-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Skuteczność</div>
                    <div className="text-2xl font-black font-mono text-emerald-700">{coachSummary.winRate}%</div>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Kadra</div>
                    <div className="text-2xl font-black font-mono text-slate-950">{coachSummary.rosterSize}</div>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white border border-amber-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Frekwencja</div>
                    <div className="text-2xl font-black font-mono text-amber-700">{coachSummary.avgTeamAttendance}%</div>
                  </div>
                </div>
              </div>

              {/* Extra Coach Insights: Form, Home/Away, Roster Position Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 break-inside-avoid">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Seria &amp; Statystyki Meczowe
                    </h3>
                    {Array.isArray(coachSummary.form) && coachSummary.form.length > 0 && (
                      <div className="flex items-center gap-1">
                        {coachSummary.form.map((res: string, i: number) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded-md font-mono font-black text-[11px] flex items-center justify-center ${
                              res === 'W'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Dom / Wyjazd</div>
                      <div className="font-mono font-black text-slate-900 mt-0.5">
                        {coachSummary.homeRecord?.won ?? 0}-{coachSummary.homeRecord?.lost ?? 0} / {coachSummary.awayRecord?.won ?? 0}-{coachSummary.awayRecord?.lost ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Wygrane 3:0</div>
                      <div className="font-mono font-black text-emerald-700 mt-0.5">{coachSummary.wins30 ?? 0}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Tie-breaki</div>
                      <div className="font-mono font-black text-indigo-700 mt-0.5">
                        {coachSummary.tieBreaksWon ?? 0}/{coachSummary.tieBreaksPlayed ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Struktura Kadry wg Pozycji
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(coachSummary.positionBreakdown || []).map((item: any) => (
                      <span
                        key={item.position}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                      >
                        {item.position}: <span className="font-mono font-black text-indigo-700">{item.count}</span>
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Średnia frekwencja na treningach: <strong className="text-slate-800 font-mono">{coachSummary.avgTrainingAttendance ?? 0}%</strong> • Ogłoszeń sztabu: <strong className="text-slate-800 font-mono">{coachSummary.announcementsCount}</strong>
                  </div>
                </div>
              </div>

              {/* Coaching Output Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 break-inside-avoid">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Bilans Meczów</div>
                  <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                    {coachSummary.matchesWon}W – {coachSummary.matchesLost}P
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sety {coachSummary.setsWon}:{coachSummary.setsLost} (ratio {coachSummary.setsRatio})
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Treningi &amp; Konspekty</div>
                  <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                    {coachSummary.trainingsCompleted}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {coachSummary.trainingPlansCount} rozpisanych konspektów
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Taktyka &amp; Skauting</div>
                  <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                    {coachSummary.tacticsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {coachSummary.tacticsSharedCount} udostępnionych • {coachSummary.scoutingReportsCount} raportów
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Sparingi &amp; Turnieje</div>
                  <div className="text-2xl font-black font-mono text-slate-950 mt-1">
                    {coachSummary.sparringsCount + coachSummary.tournamentsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {coachSummary.sparringsCount} sparingów • {coachSummary.tournamentsCount} turniejów
                  </div>
                </div>
              </div>

              {/* Top Attendance + Top Scorers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 break-inside-avoid">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Najwyższa Frekwencja (TOP 5)</span>
                  </h3>
                  {(coachSummary.topAttendancePlayers || []).length === 0 ? (
                    <p className="text-xs text-slate-500">Brak danych o frekwencji.</p>
                  ) : (
                    <div className="space-y-2">
                      {coachSummary.topAttendancePlayers.map((p: any, idx: number) => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                          <span className="font-bold text-slate-900">
                            {idx + 1}. {p.number ? `#${p.number} ` : ''}{p.name}
                          </span>
                          <span className="font-mono font-black text-emerald-700">
                            {p.attendancePercent}% ({p.attendedEvents}/{p.totalEvents})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-600" />
                    <span>Najlepiej Punktujący (TOP 5)</span>
                  </h3>
                  {(coachSummary.topScorers || []).length === 0 ? (
                    <p className="text-xs text-slate-500">Brak zapisanych statystyk punktowych.</p>
                  ) : (
                    <div className="space-y-2">
                      {coachSummary.topScorers.map((p: any, idx: number) => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                          <span className="font-bold text-slate-900">
                            {idx + 1}. {p.number ? `#${p.number} ` : ''}{p.name}
                          </span>
                          <span className="font-mono font-black text-slate-900">
                            {p.totalPoints} pkt <span className="text-slate-400 font-normal">({p.totalAttack}/{p.totalBlock}/{p.totalServe})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PRINT FOOTER / SIGNATURE BLOCK */}
          <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500 break-inside-avoid">
            <div>
              <div className="font-bold text-slate-700">{club.name}</div>
              <div className="text-[11px]">{report.seasonName}</div>
            </div>
            <div className="text-right">
              <div className="border-t border-slate-300 pt-1.5 inline-block min-w-[180px] text-center text-[11px]">
                Podpis Trenera / Kierownika
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeasonSummaryReport() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-6 text-slate-600 text-xs font-bold">
          Ładowanie podsumowania sezonu...
        </div>
      }
    >
      <SeasonSummaryReportInner />
    </Suspense>
  );
}
