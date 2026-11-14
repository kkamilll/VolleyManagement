'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { Lock } from 'lucide-react';
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
  Swords
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
  const [loading, setLoading] = useState(true);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, eventsRes, feesRes, annRes, usersRes, seasonsRes, leagueRes] = await Promise.allSettled([
        fetch('/api/matches').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/events').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/fees').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/announcements').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/users').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/admin/seasons').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/league').then(r => r.ok ? r.json() : null).catch(() => null)
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

  // Find next upcoming event (sparing, tournament, or training)
  const upcomingEvents = events
    .filter(e => new Date(e.date).getTime() >= Date.now() - 3600000 * 24)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextEvent = upcomingEvents[0];

  // Official LALS Schedule and Table data for Angels ZTP
  const officialFinishedMatch = leagueData?.leagueSchedule
    ? [...(leagueData.leagueSchedule || [])]
        .reverse()
        .find((m: any) => (m.homeTeam === 'Angels ZTP' || m.awayTeam === 'Angels ZTP') && m.status === 'FINISHED')
    : null;

  const angelsStanding = leagueData?.leagueTable?.find((t: any) => t.teamName?.includes('Angels')) || null;

  // Find latest finished match (fallback to matches collection)
  const lastMatch = matches.length > 0 ? matches[0] : null;

  // Find user's latest fee payment and unpaid totals
  const currentPayment = userPayments.length > 0 ? userPayments[0] : null;
  const currentFee = currentPayment ? fees.find(f => f.id === currentPayment.feeId) : null;
  const pendingPayments = userPayments.filter(p => p.status === 'OCZEKUJE');
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Find pinned or most important announcement
  const pinnedAnnouncement = announcements.find(a => a.isPinned) || announcements[0];

  // Next event user status
  const myStatusRecord = nextEvent?.attendees.find(a => a.userId === user?.id);
  const needsVoteOnNextEvent = Boolean(nextEvent && (user?.role === 'ZAWODNIK' || user?.isCaptain) && !myStatusRecord);

  // Squad and Attendance Statistics (Exclusively on Dashboard)
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

  const attendanceLeader = playerStats.length > 0 ? playerStats[0] : null;
  const wonMatches = matches.filter(m => m.teamSetsWon > m.opponentSetsWon).length;

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 pb-20 md:pb-16 space-y-6 sm:space-y-8">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Pulpit Drużyny
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Angels ZTP • Bieżące mecze, frekwencja, taktyka i finanse
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {seasonArchives.length > 0 && (
            <a
              href="/admin"
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-800 transition flex items-center gap-1.5 shadow-sm"
              title="Przejdź do archiwum poprzednich sezonów"
            >
              <FolderArchive className="w-3.5 h-3.5 text-purple-600" />
              <span>Archiwum Sezonów ({seasonArchives.length})</span>
            </a>
          )}
          <a
            href="/rozgrywki?tab=liga"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 flex items-center gap-2 text-xs font-bold text-slate-700 shadow-sm transition"
          >
            <img src="/lals_logo.png" alt="LALS" className="w-5 h-5 rounded-full object-contain" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              LALS: {angelsStanding ? `${angelsStanding.rank}. Miejsce (${angelsStanding.points} pkt • Sety ${angelsStanding.setsWon}:${angelsStanding.setsLost})` : '2. Miejsce (7 pkt)'}
            </span>
          </a>
        </div>
      </div>

      {/* 2. Pinned Important Announcement Banner */}
      {pinnedAnnouncement && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
              <Megaphone className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Ważny Komunikat Sztabu
                </span>
                <span className="text-[10px] text-slate-500">
                  • {pinnedAnnouncement.createdByName}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                {pinnedAnnouncement.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {pinnedAnnouncement.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. KLUCZOWE KARTY MECZOWE (Tylko 3 najważniejsze rzeczy: Mecz & Obecność, Wynik, Składka) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KARTA 1: NAJBLIŻSZE WYDARZENIE & SZYBKA DEKLARACJA OBECNOŚCI */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-sky-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Najbliższy Sprawdzian
                </span>
              </div>
              {nextEvent && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200">
                  {nextEvent.type}
                </span>
              )}
            </div>

            {nextEvent ? (
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {nextEvent.title} {nextEvent.opponent ? `vs ${nextEvent.opponent}` : ''}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    {new Date(nextEvent.date).toLocaleString('pl-PL', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {nextEvent.location}
                  </span>
                </div>

                {/* Status obecności i 3 szybkie przyciski */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Twój status:</span>
                    <span className="font-black text-xs">
                      {myStatusRecord ? (
                        myStatusRecord.status === 'BEDE' ? '🟢 Potwierdzono' :
                        myStatusRecord.status === 'NIEPEWNE' ? '🟡 Niepewne' : '🔴 Nieobecny'
                      ) : '⚪ Brak deklaracji'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleQuickAttendance(nextEvent.id, 'BEDE')}
                      disabled={updatingAttendance}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                        myStatusRecord?.status === 'BEDE'
                          ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                          : 'bg-slate-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Będę
                    </button>
                    <button
                      onClick={() => handleQuickAttendance(nextEvent.id, 'NIEPEWNE')}
                      disabled={updatingAttendance}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                        myStatusRecord?.status === 'NIEPEWNE'
                          ? 'bg-amber-500 text-white shadow-amber-500/20'
                          : 'bg-slate-50 hover:bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Może
                    </button>
                    <button
                      onClick={() => handleQuickAttendance(nextEvent.id, 'NIE_BEDE')}
                      disabled={updatingAttendance}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                        myStatusRecord?.status === 'NIE_BEDE'
                          ? 'bg-rose-600 text-white shadow-rose-600/20'
                          : 'bg-slate-50 hover:bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Nie
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                    <span>
                      👥 Skład: <strong className="text-emerald-700 font-bold">{nextEvent.attendees.filter(a => a.status === 'BEDE').length} na tak</strong>
                    </span>
                    <a href="/events" className="text-sky-600 hover:text-sky-800 hover:underline font-bold">
                      Terminarz &rarr;
                    </a>
                  </div>

                  {/* Szybkie przejście do założeń taktycznych */}
                  <a
                    href={`/taktyka?eventId=${nextEvent.id}&type=${nextEvent.type === 'MECZ' ? 'MECZ_LIGOWY' : nextEvent.type}`}
                    className="w-full py-1.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs mt-1"
                  >
                    <Target className="w-3.5 h-3.5 text-sky-600" />
                    <span>Założenia Taktyczne na Mecz 🎯</span>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6">Brak zaplanowanych meczów w najbliższych dniach.</p>
            )}
          </div>

          <a
            href="/events"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 transition"
          >
            <span>Otwórz pełny terminarz</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* KARTA 2: OSTATNI WYNIK & LIGA LALS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Ostatni Mecz
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-300">
                2. Miejsce LALS
              </span>
            </div>

            {officialFinishedMatch ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {officialFinishedMatch.round || 'Kolejka III LALS'}: vs {officialFinishedMatch.homeTeam === 'Angels ZTP' ? officialFinishedMatch.awayTeam : officialFinishedMatch.homeTeam}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {officialFinishedMatch.date}
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600">
                    {officialFinishedMatch.homeTeam === 'Angels ZTP' ? officialFinishedMatch.homeSetsWon : officialFinishedMatch.awaySetsWon}
                  </span>
                  <span className="text-slate-300">:</span>
                  <span className="text-slate-500">
                    {officialFinishedMatch.homeTeam === 'Angels ZTP' ? officialFinishedMatch.awaySetsWon : officialFinishedMatch.homeSetsWon}
                  </span>
                  <span className="text-xs font-sans font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ml-1">
                    Zwycięstwo 3:0 ✓
                  </span>
                </div>

                {/* Sety */}
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-700">
                  {officialFinishedMatch.setScores?.map((set: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg font-bold">
                      Set {idx + 1}: {set}
                    </span>
                  ))}
                </div>

                {officialFinishedMatch.mvp && (
                  <div className="text-xs text-amber-900 font-bold flex items-center gap-1.5 pt-0.5 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>MVP Meczu: <strong>{officialFinishedMatch.mvp}</strong></span>
                  </div>
                )}
              </div>
            ) : lastMatch ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">vs {lastMatch.opponent}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(lastMatch.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-600">{lastMatch.teamSetsWon}</span>
                  <span className="text-slate-300">:</span>
                  <span className="text-slate-500">{lastMatch.opponentSetsWon}</span>
                </div>

                {/* Sety */}
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-700">
                  {lastMatch.sets.slice(0, 4).map(s => (
                    <span key={s.setNumber} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg font-bold">
                      {s.teamScore}:{s.opponentScore}
                    </span>
                  ))}
                </div>

                {lastMatch.mvp && (
                  <div className="text-xs text-amber-800 font-bold flex items-center gap-1.5 pt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>MVP: {lastMatch.mvp}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">Brak rozegranych meczów.</p>
            )}
          </div>

          <a
            href="/rozgrywki?tab=liga"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition"
          >
            <span>Tabela LALS i wyniki</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* KARTA 3: TWOJA SKŁADKA & BLIK */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-sky-300 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-black uppercase tracking-wider text-sky-800">
                  Twoja Składka
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${
                currentPayment?.status === 'OPLACONE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {currentPayment?.status === 'OPLACONE' ? 'Opłacone ✓' : 'Do zapłaty'}
              </span>
            </div>

            {currentPayment ? (
              <div className="space-y-3">
                <div className="text-xs text-slate-700 font-bold line-clamp-1">
                  {currentFee?.title || 'Składka klubowa'}
                </div>

                <div className="text-3xl font-black font-mono text-slate-900">
                  {currentPayment.amount} zł
                </div>

                <div className="text-xs text-slate-500">
                  {currentPayment.status === 'OPLACONE' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Uregulowano pomyślnie
                    </span>
                  ) : (
                    <span>Termin: {currentFee?.dueDate || 'Bieżący miesiąc'}</span>
                  )}
                </div>

                {treasury && treasury.userOverpayments > 0 && (
                  <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-800 font-bold flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-sky-600" />
                    +{treasury.userOverpayments} zł nadpłaty w skarbcu
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">Brak przypisanych składek.</p>
            )}
          </div>

          <a
            href="/fees"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 transition"
          >
            <span>{currentPayment?.status === 'OPLACONE' ? 'Historia wpłat' : 'Opłać składkę (BLIK)'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 4. ZWIĘZŁY PASEK 4 WSKAŹNIKÓW KLUBOWYCH */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Frekwencja</span>
            <div className="text-xl font-black text-emerald-700 font-mono">{teamAverageAttendance}%</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Bilans Ligi</span>
            <div className="text-xl font-black text-slate-900 font-mono">{wonMatches}W - {matches.length - wonMatches}L</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Kadra</span>
            <div className="text-xl font-black text-slate-900 font-mono">{players.length || users.length} graczy</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Skarbiec</span>
            <div className="text-xl font-black text-slate-900 font-mono">{treasury?.balance !== undefined ? `${treasury.balance} zł` : 'Aktywny'}</div>
          </div>
        </div>
      </div>

      {/* 5. SZYBKIE SKRÓTY DRUŻYNY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Centrum Drużyny & Szybkie Skróty
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Bezpośredni dostęp do modułów</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <a
            href="/events"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-sm transition flex flex-col justify-between group space-y-2 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition">Terminarz</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Obecności i zbiórki</p>
            </div>
          </a>

          <a
            href="/rozgrywki?tab=sparingi"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-sm transition flex flex-col justify-between group space-y-2 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-amber-800 transition">Sparingi</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Szóstki i protokoły</p>
            </div>
          </a>

          <a
            href="/rozgrywki?tab=liga"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-sm transition flex flex-col justify-between group space-y-2 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center group-hover:scale-105 transition">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition">Liga LALS</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Tabela i wyniki VolleyStation</p>
            </div>
          </a>

          <a
            href="/taktyka"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-sm transition flex flex-col justify-between group space-y-2 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center group-hover:scale-105 transition">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-purple-800 transition">Taktyka</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Tablica P1-P6 i zrzuty</p>
            </div>
          </a>

          <a
            href="/team"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition flex flex-col justify-between group space-y-2 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-800 transition">Kadra</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Skład i profile zawodników</p>
            </div>
          </a>
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
