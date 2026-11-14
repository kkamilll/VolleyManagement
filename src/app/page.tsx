'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { 
  Volleyball, 
  Calendar, 
  CreditCard, 
  Users, 
  Trophy, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Megaphone, 
  ArrowRight,
  TrendingUp,
  Coins,
  Shield,
  ClipboardList,
  FolderArchive,
  Award,
  Swords,
  ExternalLink,
  UserCheck,
  BarChart3,
  Crown,
  Check,
  Zap
} from 'lucide-react';
import { 
  MatchResult, 
  EventItem, 
  Fee, 
  FeePayment, 
  Announcement, 
  AttendanceStatus,
  User 
} from '@/lib/types';

function DashboardContent() {
  const { user } = useAuth();
  const { isArchiveMode } = useSeasonArchive();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [userPayments, setUserPayments] = useState<FeePayment[]>([]);
  const [treasury, setTreasury] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seasonArchives, setSeasonArchives] = useState<any[]>([]);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [leagueReports, setLeagueReports] = useState<any[]>([]);
  const [leaderboards, setLeaderboards] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, eventsRes, feesRes, annRes, usersRes, seasonsRes, leagueRes, reportsRes] = await Promise.allSettled([
        fetch('/api/matches').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/events').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/fees').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/announcements').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/users').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/admin/seasons').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/league').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/league-reports').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (matchesRes.status === 'fulfilled' && matchesRes.value) {
        setMatches(matchesRes.value.matches || []);
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value) {
        setEvents(eventsRes.value.events || []);
      }
      if (feesRes.status === 'fulfilled' && feesRes.value) {
        setFees(feesRes.value.fees || []);
        setUserPayments(feesRes.value.userPayments || []);
        setTreasury(feesRes.value.treasury);
      }
      if (annRes.status === 'fulfilled' && annRes.value) {
        setAnnouncements(annRes.value.announcements || []);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value) {
        setUsers(usersRes.value.users || []);
      }
      if (seasonsRes.status === 'fulfilled' && seasonsRes.value) {
        setSeasonArchives(seasonsRes.value.seasons || []);
      }
      if (leagueRes.status === 'fulfilled' && leagueRes.value) {
        setLeagueData(leagueRes.value);
      }
      if (reportsRes.status === 'fulfilled' && reportsRes.value) {
        setLeagueReports(reportsRes.value.reports || []);
        setLeaderboards(reportsRes.value.leaderboards || null);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Quick 1-click attendance vote right from the dashboard
  const handleQuickAttendance = async (eventId: string, status: AttendanceStatus) => {
    if (isArchiveMode) {
      alert('W trybie archiwum głosowanie jest zablokowane.');
      return;
    }
    if (!user) {
      alert('Musisz być zalogowany, aby zadeklarować obecność');
      return;
    }
    setUpdatingAttendance(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingAttendance(false);
    }
  };

  // Find next upcoming event (match or training)
  const upcomingEvents = events
    .filter(e => new Date(e.date).getTime() >= Date.now() - 3600000 * 24)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextEvent = upcomingEvents[0];

  // Official LALS Schedule matches for Angels ZTP
  const angelsScheduleMatches = (leagueData?.leagueSchedule || []).filter(
    (m: any) => m.homeTeam === 'Angels ZTP' || m.awayTeam === 'Angels ZTP'
  );

  const officialFinishedMatch = [...angelsScheduleMatches]
    .reverse()
    .find((m: any) => m.isFinished);

  const officialNextMatch = angelsScheduleMatches.find((m: any) => !m.isFinished);
  const upcomingAngelsMatches = angelsScheduleMatches.filter((m: any) => !m.isFinished).slice(0, 3);

  // Angels standing in LALS Table
  const leagueTable: any[] = leagueData?.leagueTable || [];
  const angelsStanding = leagueTable.find((t: any) => t.teamName?.includes('Angels')) || null;

  // Find user's latest fee payment and unpaid totals
  const currentPayment = userPayments.length > 0 ? userPayments[0] : null;
  const currentFee = currentPayment ? fees.find(f => f.id === currentPayment.feeId) : null;
  const unpaidUserPayments = userPayments.filter(p => p.status === 'OCZEKUJE' || p.status === 'ZALEGLE');

  // Next event user status
  const myStatusRecord = nextEvent?.attendees?.find(a => a.userId === user?.id);

  // Squad and attendance
  const players = users.filter(u => u.role === 'ZAWODNIK' || (u.role === 'KIEROWNIK' && Boolean(u.number)));
  const completedEvents = events.filter(e => 
    e.isCompleted || 
    e.status === 'ZAKONCZONY' || 
    new Date(e.date).getTime() < Date.now()
  );

  // Player attendance calculations
  const playerStats = (players.length > 0 ? players : users).map(p => {
    let attended = 0;
    completedEvents.forEach(ev => {
      const isDecl = ev.attendees?.some(a => a.userId === p.id && a.status === 'BEDE');
      if (isDecl) {
        attended++;
      }
    });
    const percent = completedEvents.length > 0 ? Math.round((attended / completedEvents.length) * 100) : 100;
    return { player: p, attended, total: completedEvents.length, percent };
  }).sort((a, b) => b.percent - a.percent);

  const teamAverageAttendance = playerStats.length > 0
    ? Math.round(playerStats.reduce((acc, curr) => acc + curr.percent, 0) / playerStats.length)
    : 100;

  // Top scorers from official VolleyStation match reports
  const topAngelsScorers = leaderboards?.angelsScorers?.slice(0, 5) || [
    { name: 'Łukasz Kremer', number: 17, totalPoints: 26, totalAttack: 24, totalBlock: 1, totalServe: 1 },
    { name: 'Michał Śmigiel', number: 8, totalPoints: 16, totalAttack: 10, totalBlock: 5, totalServe: 1 },
    { name: 'Bartosz Augustynek', number: 97, totalPoints: 11, totalAttack: 8, totalBlock: 3, totalServe: 0 },
    { name: 'Piotr Graczyk', number: 7, totalPoints: 9, totalAttack: 7, totalBlock: 1, totalServe: 1 },
    { name: 'Maciek Noak', number: 47, totalPoints: 8, totalAttack: 5, totalBlock: 2, totalServe: 1 }
  ];

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-4 sm:pt-6 pb-20 md:pb-16 space-y-5 sm:space-y-6">
      
      {/* 1. TOP HEADER & LALS BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Lubońska Amatorska Liga Siatkówki (LALS) • Sezon 2026/2027
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase font-athletic mt-0.5">
            Pulpit Drużyny Angels ZTP
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {seasonArchives.length > 0 && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-800 transition flex items-center gap-1.5 shadow-2xs"
              title="Przejdź do archiwum poprzednich sezonów"
            >
              <FolderArchive className="w-3.5 h-3.5 text-purple-600" />
              <span>Archiwum ({seasonArchives.length})</span>
            </Link>
          )}

          <Link
            href="/rozgrywki?tab=liga"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs transition"
          >
            <img src="/lals_logo.png" alt="LALS" className="w-5 h-5 rounded-full object-contain" />
            <span>
              LALS Faza I: <strong className="text-emerald-700 font-black">{angelsStanding ? `${angelsStanding.position}. Miejsce` : '2. Miejsce'}</strong> ({angelsStanding?.points || 7} pkt • sety {angelsStanding?.setsWon || 8}:{angelsStanding?.setsLost || 3})
            </span>
          </Link>
        </div>
      </div>

      {/* 2. HERO CARD: NAJBLIŻSZY MECZ LIGOWY (MATCH OF THE DAY) */}
      {officialNextMatch && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-5 sm:p-7 shadow-lg border border-sky-800/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Lewa strona: Informacja o meczu i drużyny */}
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm font-sans">
                  <Flame className="w-3.5 h-3.5 fill-slate-950" />
                  Mecz na Szczycie LALS (Runda {officialNextMatch.round})
                </span>
                <span className="text-xs font-mono text-sky-200 font-bold">
                  {officialNextMatch.dateStr} • godz. {officialNextMatch.timeStr}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/10 text-white border border-white/15">
                  Nr {officialNextMatch.matchNumber}
                </span>
              </div>

              {/* Starcie rywali */}
              <div className="flex items-center gap-3 sm:gap-6 flex-wrap sm:flex-nowrap">
                {/* Drużyna 1: Gospodarz */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner">
                    👼
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">Gospodarz (2. Miejsce)</span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-athletic text-white">
                      {officialNextMatch.homeTeam}
                    </h2>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-xs font-black uppercase text-amber-300 tracking-wider font-mono">
                  VS
                </div>

                {/* Drużyna 2: Gość */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner">
                    🥥
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">Rywal (4. Miejsce)</span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-athletic text-white">
                      {officialNextMatch.awayTeam}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Lokalizacja i szczegóły */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-sky-200/90 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  Hala Sportowa OSiR, Luboń
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  Stawka: Utrzymanie strefy awansu do Finałów (Top 3)
                </span>
              </div>
            </div>

            {/* Prawa strona: Szybka deklaracja obecności i akcje */}
            <div className="lg:w-80 p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-200">Twoja obecność:</span>
                <span className="font-black">
                  {myStatusRecord ? (
                    myStatusRecord.status === 'BEDE' ? '🟢 Będę na meczu' :
                    myStatusRecord.status === 'NIEPEWNE' ? '🟡 Niepewne' : '🔴 Nieobecny'
                  ) : '⚪ Brak deklaracji'}
                </span>
              </div>

              {/* 3 przyciski deklaracji */}
              {nextEvent && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'BEDE')}
                    disabled={updatingAttendance}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                      myStatusRecord?.status === 'BEDE'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-emerald-500/30'
                        : 'bg-white/10 hover:bg-emerald-500/30 text-white border border-white/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Będę
                  </button>
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'NIEPEWNE')}
                    disabled={updatingAttendance}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                      myStatusRecord?.status === 'NIEPEWNE'
                        ? 'bg-amber-400 text-slate-950 font-black shadow-amber-400/30'
                        : 'bg-white/10 hover:bg-amber-400/30 text-white border border-white/20'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Może
                  </button>
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'NIE_BEDE')}
                    disabled={updatingAttendance}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                      myStatusRecord?.status === 'NIE_BEDE'
                        ? 'bg-rose-500 text-white font-black shadow-rose-500/30'
                        : 'bg-white/10 hover:bg-rose-500/30 text-white border border-white/20'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Nie
                  </button>
                </div>
              )}

              {/* Licznik obecnych */}
              <div className="text-[11px] text-sky-200/90 pt-1 flex items-center justify-between border-t border-white/10">
                <span>
                  👥 Zadeklarowani: <strong className="text-white font-black">{nextEvent?.attendees?.filter(a => a.status === 'BEDE').length || players.length} zawodników</strong>
                </span>
                <Link href="/events" className="text-sky-300 hover:text-white underline font-bold">
                  Skład &rarr;
                </Link>
              </div>

              {/* Link do taktyki meczowej */}
              <Link
                href={`/taktyka?matchId=mat_lals_1972&eventId=${nextEvent?.id || ''}`}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Target className="w-4 h-4" />
                <span>Założenia Taktyczne vs Coco Jumbo 🎯</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. DWUKOLUMNOWY UKŁAD GŁÓWNY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* LEWA KOLUMNA: TABELA LALS & WYNIKI (7 KOLUMN) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">

          {/* TABELA LALS FAZA I */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-600 mb-0.5">
                  <Trophy className="w-4 h-4 text-sky-600" />
                  Oficjalna Tabela Ligi LALS (Faza I)
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight font-athletic">
                  Grupa Eliminacyjna (7 Drużyn)
                </h3>
              </div>

              <Link
                href="/rozgrywki?tab=liga"
                className="inline-flex items-center gap-1 text-xs font-black text-sky-600 hover:text-sky-800 transition"
              >
                <span>Pełna tabela & mecze</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Informacja o awansie */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-2">
              <span className="font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Top 3 uzyskuje bezpośredni awans do Grupy Finałowej!</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-mono font-black text-emerald-800 text-[10px] shrink-0">
                Angels ZTP: 2. miejsce
              </span>
            </div>

            {/* Tabela skrócona */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3 text-center">#</th>
                    <th className="py-2.5 px-3">Drużyna</th>
                    <th className="py-2.5 px-2 text-center">M</th>
                    <th className="py-2.5 px-2 text-center">Sety</th>
                    <th className="py-2.5 px-2 text-center">Pkt</th>
                    <th className="py-2.5 px-3 text-right">Bilans Małych</th>
                    <th className="py-2.5 px-3 text-center">Forma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leagueTable.map((team, idx) => {
                    const isAngels = team.teamName?.includes('Angels');
                    const isNextOpponent = team.teamName?.includes('Coco');
                    const isAdvancing = (team.position || idx + 1) <= 3;
                    return (
                      <tr 
                        key={team.id || team.teamName} 
                        className={`transition ${
                          isAngels 
                            ? 'bg-sky-50/80 font-black text-slate-900 border-l-4 border-l-sky-600' 
                            : isNextOpponent
                            ? 'bg-amber-50/50 hover:bg-amber-50'
                            : 'hover:bg-slate-50/80 text-slate-700'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-black">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${
                            isAdvancing 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'text-slate-400'
                          }`}>
                            {team.position || idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{team.teamName}</span>
                            {isAngels && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-sky-600 text-white font-sans">
                                MY
                              </span>
                            )}
                            {isNextOpponent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-200 text-amber-900 font-sans">
                                JUTRO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">{team.matchesPlayed}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">{team.setsWon}:{team.setsLost}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-sky-800 text-sm">{team.points}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                          {team.pointsWon}:{team.pointsLost} ({team.pointsWon - team.pointsLost > 0 ? `+${team.pointsWon - team.pointsLost}` : team.pointsWon - team.pointsLost})
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {(team.form || []).map((f: string, i: number) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center font-mono ${
                                  f === 'W'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* OSTATNI WYNIK & KOLEJNE MECZE ANGELS ZTP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Ostatni rozegrany mecz: Volleyboars 0:3 Angels ZTP */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Ostatni Mecz • Zwycięstwo ✓
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    8 lis 2026 (Runda 9)
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 uppercase">Volleyboars vs Angels ZTP</div>
                  <div className="text-3xl font-black font-mono text-slate-900 flex items-center gap-2">
                    <span className="text-slate-400">0</span>
                    <span className="text-slate-300">:</span>
                    <span className="text-emerald-600">3</span>
                    <span className="text-xs font-sans font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ml-1">
                      Angels ZTP wygrywa
                    </span>
                  </div>
                </div>

                {/* Sety */}
                <div className="flex flex-wrap gap-1.5 pt-2 text-[11px] font-mono text-slate-700">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg font-bold">Set 1: 21:25</span>
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg font-bold">Set 2: 19:25</span>
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg font-bold">Set 3: 18:25</span>
                </div>

                {/* MVP */}
                <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>MVP Meczu: <strong>Hubert Obara (#12)</strong></span>
                </div>
              </div>

              <Link
                href="/rozgrywki?tab=liga"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition pt-2 border-t border-slate-100"
              >
                <span>Zobacz oficjalny protokół</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Terminarz kolejnych 3 meczów Angels ZTP */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                    Terminarz Spotkań LALS
                  </span>
                  <Calendar className="w-4 h-4 text-sky-600" />
                </div>

                <h4 className="text-xs font-black uppercase text-slate-800">Najbliższe spotkania Angels ZTP</h4>

                <div className="space-y-2 pt-1">
                  {upcomingAngelsMatches.map((m: any, idx: number) => {
                    const isTomorrow = idx === 0;
                    return (
                      <div 
                        key={m.matchNumber} 
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                          isTomorrow 
                            ? 'bg-amber-50/80 border-amber-300 font-bold' 
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900">
                              vs {m.homeTeam === 'Angels ZTP' ? m.awayTeam : m.homeTeam}
                            </span>
                            {isTomorrow && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950 font-sans">
                                JUTRO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Runda {m.round} • {m.dateStr.split(',')[0]} • {m.timeStr}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                          Nr {m.matchNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition pt-2 border-t border-slate-100"
              >
                <span>Otwórz pełny terminarz ligowy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* PRAWA KOLUMNA: RANKING PUNKTUJĄCYCH, FINANSE & KADRA (5 KOLUMN) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5 sm:space-y-6">

          {/* KARTA 1: LIDERZY PUNKTOWI ANGELS ZTP (OFICJALNE STATYSTYKI LALS) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    Liderzy Punktowi Zespołu
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Oficjalne rankingi VolleyStation</span>
                </div>
              </div>

              <Link
                href="/rozgrywki?tab=liga"
                className="text-[11px] font-bold text-sky-600 hover:text-sky-800"
              >
                Ranking Ligi &rarr;
              </Link>
            </div>

            <div className="space-y-2">
              {topAngelsScorers.map((p: any, idx: number) => (
                <div 
                  key={p.name} 
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 text-xs hover:bg-sky-50/50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow-2xs' :
                      idx === 1 ? 'bg-slate-200 text-slate-800' :
                      idx === 2 ? 'bg-amber-100 text-amber-900' :
                      'text-slate-400 bg-white border border-slate-200'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <span className="truncate">{p.name}</span>
                        {p.number && (
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                            #{p.number}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Atak: {p.totalAttack || 0} • Blok: {p.totalBlock || 0} • Asy: {p.totalServe || 0}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black font-mono text-amber-700">
                      {p.totalPoints} pkt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KARTA 2: TWOJE SKŁADKI & STATUS FINANSOWY */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Twoje Składki Klubowe
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${
                unpaidUserPayments.length === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {unpaidUserPayments.length === 0 ? 'Wszystko OK ✓' : `${unpaidUserPayments.length} do opłaty`}
              </span>
            </div>

            {unpaidUserPayments.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Wszystkie składki są uregulowane!
                </div>
                <p className="text-[11px] text-emerald-700">
                  Brak jakichkolwiek zaległości na Twoim koncie klubowym.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 text-xs text-amber-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{currentFee?.title || 'Składka klubowa'}</span>
                  <span className="text-lg font-black font-mono text-slate-900">{currentPayment?.amount} zł</span>
                </div>
                <Link
                  href="/fees?tab=my_fees"
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition shadow-sm"
                >
                  <span>Opłać teraz (BLIK) &rarr;</span>
                </Link>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Skarbiec drużyny: <strong className="text-slate-800 font-mono font-bold">{treasury?.balance !== undefined ? `${treasury.balance} zł` : '0 zł'}</strong></span>
              <Link href="/fees" className="text-sky-600 hover:text-sky-800 font-bold underline">
                Kasa i składki &rarr;
              </Link>
            </div>
          </div>

          {/* KARTA 3: KADRA ANGELS ZTP (15 ZAWODNIKÓW) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Oficjalna Kadra (15 Siatkarzy)
                </h3>
              </div>
              <Link href="/team" className="text-xs font-bold text-purple-700 hover:text-purple-900">
                Skład &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Rozgrywający</span>
                <span className="font-black text-slate-900">#4 Pujanek • #18 Shetty</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Libero</span>
                <span className="font-black text-slate-900">#5 Tomasz Żądło</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Przyjmujący</span>
                <span className="font-black text-slate-900">#17 Kremer • #12 Obara...</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Atakujący</span>
                <span className="font-black text-slate-900">#97 Augustynek • #91 Król</span>
              </div>
            </div>

            <Link
              href="/team"
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition mt-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Zobacz pełny skład i profile zawodników</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Ładowanie Pulpitu...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
