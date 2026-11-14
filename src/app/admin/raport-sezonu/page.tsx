'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  Sparkles,
  Download,
  Flame,
  Check
} from 'lucide-react';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const seasonParam = searchParams.get('id') || 'current';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [includeFinancials, setIncludeFinancials] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/seasons/report?id=${encodeURIComponent(seasonParam)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Nie udało się pobrać raportu');
        }
        const data = await res.json();
        setReport(data.report);
        setAvailableSeasons(data.availableSeasons || []);
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
    router.push(`/admin/raport-sezonu?id=${encodeURIComponent(newId)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-black uppercase tracking-wider">Generowanie Oficjalnego Raportu Sezonu...</h2>
          <p className="text-xs text-slate-400">Pobieranie statystyk, meczów i zestawień drużyny Angels ZTP...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-800 border border-rose-500/30 p-6 rounded-3xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-black">
            ✕
          </div>
          <h2 className="text-lg font-black text-rose-300 uppercase">Nie można wygenerować raportu</h2>
          <p className="text-xs text-slate-300">{error || 'Brak danych dla wybranego sezonu.'}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition"
            >
              Powrót do Admina
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { club, summary, matches, leagueTable, playerStats, financials } = report;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:text-black font-sans">
      
      {/* ACTION BAR AT THE TOP (HIDDEN IN PRINT / PDF) */}
      <div className="print:hidden sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 text-slate-100 px-4 py-3 sm:px-8 shadow-xl">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Wróć do Admina</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-400">Wybierz sezon:</span>
              <select
                value={report.seasonId}
                onChange={e => handleSeasonChange(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {availableSeasons.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="hidden md:flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeFinancials}
                onChange={e => setIncludeFinancials(e.target.checked)}
                className="rounded accent-amber-400 cursor-pointer"
              />
              <span>Dołącz rozliczenie finansowe</span>
            </label>

            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Drukuj / Zapisz jako PDF (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT STYLING & PAGE WRAPPER */}
      <div className="max-w-5xl mx-auto p-4 sm:p-8 lg:p-12 print:p-0 print:max-w-none">
        
        {/* REPORT SHEET */}
        <div className="bg-white rounded-3xl print:rounded-none shadow-2xl print:shadow-none border border-slate-200 print:border-none p-6 sm:p-10 lg:p-12 space-y-8">
          
          {/* 1. OFFICIAL HEADER */}
          <div className="border-b-2 border-slate-900 pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-400">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Oficjalny Dokument Klubowy • LALS 2026/2027
                    </span>
                    {report.isArchive && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300">
                        Zarchiwizowane
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-950 tracking-tight">
                    {club.name} – Raport Końcowy Sezonu
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    {club.league} • {club.category} • {club.city}
                  </p>
                </div>
              </div>

              <div className="sm:text-right space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Data Sporządzenia</p>
                <p className="text-sm font-black text-slate-900 font-mono">
                  {new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-[11px] text-slate-600">
                  Sztab: <strong className="text-slate-900">{club.coach.name}</strong> (Trener) &amp; <strong className="text-slate-900">{club.captain.name}</strong> (Kapitan)
                </p>
              </div>
            </div>

            {/* Season title highlight banner */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Podsumowanie Rozgrywek
                </span>
                <h2 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide">
                  {report.seasonName}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-bold">Pozycja Końcowa</span>
                  <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                    🏆 {summary.leagueStanding}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. EXECUTIVE SUMMARY STAT CARDS */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              1. Kluczowe Wskaźniki i Osiągnięcia Zespołu
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Bilans Spotkań</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {summary.matchesWon}W - {summary.matchesLost}L
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Łącznie meczów: <strong>{summary.matchesPlayed}</strong>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Stosunek Setów</span>
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {summary.setsWon}:{summary.setsLost}
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Ratio: <strong>{summary.setsRatio}</strong>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Średnia Frekwencja</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {summary.averageAttendance}%
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Wydarzeń: <strong>{summary.totalEvents}</strong>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Punkty Ligowe</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  {summary.points} pkt
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Małe punkty: <strong>{summary.pointsScored}:{summary.pointsConceded}</strong>
                </span>
              </div>
            </div>

            {/* Individual Honors Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                    Najlepszy Punktujący Zespołu (Złota Armata)
                  </span>
                  <p className="text-sm font-black text-slate-900">
                    {summary.topScorer}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shrink-0">
                  ⭐
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 block">
                    Lider Wyróżnień MVP Spotkań
                  </span>
                  <p className="text-sm font-black text-slate-900">
                    {summary.mvpLeader}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MATCH RESULTS TABLE */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              2. Wyniki i Przebieg Oficjalnych Meczów
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Przeciwnik</th>
                    <th className="py-2.5 px-3 text-center">Gosp. / Wyjazd</th>
                    <th className="py-2.5 px-3 text-center">Wynik (Sety)</th>
                    <th className="py-2.5 px-3">Punkty w Setach</th>
                    <th className="py-2.5 px-3">MVP Meczu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {matches && matches.length > 0 ? (
                    matches.map((m: any, idx: number) => (
                      <tr key={m.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {m.opponent}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${m.isHome ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'}`}>
                            {m.isHome ? 'Dom' : 'Wyjazd'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-black text-sm">
                          <span className={m.won ? 'text-emerald-600' : 'text-rose-600'}>
                            {m.score}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                          {m.sets || '—'}
                        </td>
                        <td className="py-2 px-3 font-bold text-amber-700">
                          {m.mvp ? `⭐ ${m.mvp}` : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        Brak zarejestrowanych meczów w tym sezonie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. LEAGUE TABLE */}
          {leagueTable && leagueTable.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                3. Tabela Końcowa Lubońskiej Amatorskiej Ligi Siatkówki (LALS)
              </h3>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">M.</th>
                      <th className="py-2.5 px-3">Drużyna</th>
                      <th className="py-2.5 px-3 text-center">Mecze</th>
                      <th className="py-2.5 px-3 text-center font-black">Punkty</th>
                      <th className="py-2.5 px-3 text-center">W - P</th>
                      <th className="py-2.5 px-3 text-center">Sety</th>
                      <th className="py-2.5 px-3 text-center">Małe Pkt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {leagueTable.map((t: any, idx: number) => {
                      const isAngels = t.teamName?.toLowerCase().includes('angels');
                      return (
                        <tr key={t.id || idx} className={isAngels ? 'bg-amber-50/70 font-bold' : 'hover:bg-slate-50/50'}>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {t.position || idx + 1}.
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                            {isAngels && <span className="text-amber-500">★</span>}
                            <span>{t.teamName}</span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono">{t.matchesPlayed}</td>
                          <td className="py-2 px-3 text-center font-mono font-black text-sm text-slate-950">{t.points}</td>
                          <td className="py-2 px-3 text-center font-mono">{t.matchesWon}-{t.matchesLost}</td>
                          <td className="py-2 px-3 text-center font-mono">{t.setsWon}:{t.setsLost}</td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">{t.pointsWon}:{t.pointsLost}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. PLAYER STATISTICS & ROSTER */}
          <div className="space-y-3 pt-2 break-inside-avoid">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              4. Kadra Zespołu &amp; Indywidualny Wkład w Sukces Drużyny
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Nr</th>
                    <th className="py-2.5 px-3">Zawodnik</th>
                    <th className="py-2.5 px-3">Pozycja</th>
                    <th className="py-2.5 px-3 text-center font-black">Punkty</th>
                    <th className="py-2.5 px-3 text-center">Atak</th>
                    <th className="py-2.5 px-3 text-center">Blok</th>
                    <th className="py-2.5 px-3 text-center">Serwis</th>
                    <th className="py-2.5 px-3 text-center">Frekwencja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {playerStats && playerStats.length > 0 ? (
                    playerStats.map((p: any, idx: number) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center font-mono font-black text-amber-600">
                          {p.number ? `#${p.number}` : '—'}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {p.name}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {p.position || 'Zawodnik'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-black text-sm text-slate-950">
                          {p.totalPoints || 0}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                          {p.totalAttack || 0}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                          {p.totalBlock || 0}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                          {p.totalServe || 0}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                          {p.attendancePercent}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400">
                        Brak danych o kadrze zawodników.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. FINANCIAL SUMMARY (OPTIONAL / TOGGLEABLE) */}
          {includeFinancials && financials && (
            <div className="space-y-3 pt-2 break-inside-avoid">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                5. Rozliczenie Finansowe &amp; Skarbiec Klubu
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Zebrane Składki</span>
                  <span className="text-xl font-black text-emerald-600 font-mono">
                    +{financials.totalCollected || summary.totalFeesCollected || 0} PLN
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Wpłaty od zawodników na konto klubu</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Wydatki i Koszty</span>
                  <span className="text-xl font-black text-rose-600 font-mono">
                    -{financials.totalSpent || summary.totalExpenses || 0} PLN
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Hala, opłaty ligowe LALS, sprzęt</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Bilans Końcowy Skarbca</span>
                  <span className="text-xl font-black text-indigo-600 font-mono">
                    {financials.balance || summary.treasuryBalance || 0} PLN
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Saldo przenoszone na kolejny sezon</p>
                </div>
              </div>
            </div>
          )}

          {/* 7. OFFICIAL SIGNATURES & STAMPS (PRINT FRIENDLY) */}
          <div className="pt-8 border-t-2 border-slate-900 space-y-6 break-inside-avoid">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Klauzula Zatwierdzenia
                </p>
                <p className="text-xs text-slate-600 max-w-sm mt-0.5">
                  Niniejszy raport stanowi oficjalne, komisyjne podsumowanie wyników sportowych, frekwencyjnych i organizacyjnych drużyny Angels ZTP w rozgrywkach Lubońskiej Amatorskiej Ligi Siatkówki.
                </p>
              </div>

              <div className="flex items-center gap-10">
                <div className="space-y-6 text-center">
                  <div className="w-40 border-b border-dashed border-slate-400 pb-1 h-10 flex items-end justify-center">
                    <span className="font-serif italic text-sm text-slate-700">Hubert Rutkowski</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Trener Zespołu<br />
                    <span className="font-normal text-slate-400">Hubert Rutkowski</span>
                  </p>
                </div>

                <div className="space-y-6 text-center">
                  <div className="w-40 border-b border-dashed border-slate-400 pb-1 h-10 flex items-end justify-center">
                    <span className="font-serif italic text-sm text-slate-700">Łukasz Kremer</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Kapitan Drużyny<br />
                    <span className="font-normal text-slate-400">Łukasz Kremer (#17)</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>System Zarządzania Klubem Siatkarskim Angels ZTP</span>
              <span>Dokument wygenerowany automatycznie • {new Date().toLocaleString('pl-PL')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* GLOBAL PRINT CSS RULES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          nav, header, aside, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function SeasonReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Ładowanie raportu...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
