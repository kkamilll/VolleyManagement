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
  Crown, 
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
  Award
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
  const [loading, setLoading] = useState(true);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, eventsRes, feesRes, annRes, usersRes, seasonsRes] = await Promise.allSettled([
        fetch('/api/matches').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/events').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/fees').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/announcements').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/users').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/admin/seasons').then(r => r.ok ? r.json() : null).catch(() => null)
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

  // Find latest finished match
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
      {/* 1. Header & Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono font-black text-xl text-sky-400 shrink-0">
            {user?.number ? `#${user.number}` : '🏐'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Witaj, {user ? user.name.split(' ')[0] : 'Zawodniku'}!
              </h1>
              {user?.isCaptain && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Kapitan & Kierownik
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Angels ZTP • {user?.position || 'Siatkówka'} • {user?.isCaptain ? 'Kapitan & Kierownik (Zarząd drużyny)' : user?.role === 'KIEROWNIK' ? 'Kierownik Klubu' : user?.role === 'TRENER' ? 'Trener' : 'Zawodnik'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {seasonArchives.length > 0 && (
            <a
              href="/admin"
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-bold text-purple-300 transition flex items-center gap-1.5"
              title="Przejdź do archiwum poprzednich sezonów"
            >
              <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
              <span>Archiwum Sezonów ({seasonArchives.length})</span>
            </a>
          )}
          <a
            href="/rozgrywki?tab=liga"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 flex items-center gap-2 text-xs font-bold text-slate-300 transition"
          >
            <img src="/lals_logo.png" alt="LALS" className="w-5 h-5 rounded-full object-contain" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LALS: 1. Miejsce</span>
          </a>
        </div>
      </div>

      {/* SZYBKIE CENTRUM DLA KAŻDEGO: CO CHCESZ ZROBIĆ? */}
      <div className="cyber-card rounded-3xl p-5 sm:p-7 border border-sky-500/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg shadow-md shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-white flex items-center gap-2.5">
                <span className="text-gradient-cyan">Szybkie Zadania & Skróty</span>
                {needsVoteOnNextEvent && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase animate-pulse shadow-md shadow-amber-500/30">
                    Wymaga Twojego Głosu
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Wszystko pod ręką w 1 kliknięcie — obecność na meczu, taktyka, składki i liga
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zalogowano jako: <strong className="text-white">{user?.name}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KARTA 1: GŁOS W ANKIECIE OBECNOŚCI */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
            needsVoteOnNextEvent
              ? 'bg-gradient-to-b from-amber-950/40 to-slate-950/80 border-amber-500/50 shadow-xl shadow-amber-500/15'
              : myStatusRecord?.status === 'BEDE'
              ? 'bg-gradient-to-b from-emerald-950/30 to-slate-950/80 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" /> 1. Obecność
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                  myStatusRecord?.status === 'BEDE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : myStatusRecord?.status === 'NIEPEWNE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : myStatusRecord?.status === 'NIE_BEDE'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {myStatusRecord ? (myStatusRecord.status === 'BEDE' ? 'Będziesz ✓' : myStatusRecord.status === 'NIEPEWNE' ? 'Niepewne' : 'Nieobecny') : 'Brak głosu'}
                </span>
              </div>
              <p className="text-sm font-black text-white line-clamp-1 mb-1">
                {nextEvent ? nextEvent.title : 'Brak nadchodzących meczów'}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {nextEvent ? new Date(nextEvent.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sprawdź terminarz'}
              </p>
            </div>

            {isArchiveMode ? (
              <div className="py-2.5 px-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Archiwum: głosowanie zakończone</span>
              </div>
            ) : nextEvent && (user?.role === 'ZAWODNIK' || user?.isCaptain) ? (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleQuickAttendance(nextEvent.id, 'BEDE')}
                  disabled={updatingAttendance}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                    myStatusRecord?.status === 'BEDE'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-emerald-500/30'
                      : 'bg-slate-800/90 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Będę
                </button>
                <button
                  onClick={() => handleQuickAttendance(nextEvent.id, 'NIEPEWNE')}
                  disabled={updatingAttendance}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                    myStatusRecord?.status === 'NIEPEWNE'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/30'
                      : 'bg-slate-800/90 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/60'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Może
                </button>
                <button
                  onClick={() => handleQuickAttendance(nextEvent.id, 'NIE_BEDE')}
                  disabled={updatingAttendance}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ${
                    myStatusRecord?.status === 'NIE_BEDE'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-rose-600/30'
                      : 'bg-slate-800/90 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/60'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Nie
                </button>
              </div>
            ) : (
              <a
                href="/events"
                className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-black text-center text-slate-200 transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <span>Otwórz Terminarz</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              </a>
            )}
          </div>

          {/* KARTA 2: TAKTYKA & USTAWIENIE BOISKOWE */}
          <div className="p-4 sm:p-5 rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-950/20 to-slate-950/80 hover:border-sky-500/50 transition-all duration-300 flex flex-col justify-between group shadow-lg shadow-sky-950/20">
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-sky-400" /> 2. Taktyka i Skład
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Boisko 3D
                </span>
              </div>
              <p className="text-sm font-black text-white line-clamp-1 mb-1">
                Ustawienie & Wyjściowa 6-tka
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Zobacz rozstawienie, strefy boiska i założenia meczowe trenera
              </p>
            </div>
            <a
              href="/taktyka"
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25"
            >
              <span>Zobacz Taktykę Zespołu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* KARTA 3: SKŁADKI & PŁATNOŚCI BLIK */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
            totalPendingAmount > 0
              ? 'bg-gradient-to-b from-rose-950/30 to-slate-950/80 border-rose-500/40 shadow-xl shadow-rose-500/10'
              : 'bg-gradient-to-b from-emerald-950/20 to-slate-950/80 border-emerald-500/30'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> 3. Składki Klubowe
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                  totalPendingAmount > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                }`}>
                  {totalPendingAmount > 0 ? `${totalPendingAmount} zł do zapłaty` : 'Opłacone ✓'}
                </span>
              </div>
              <p className="text-sm font-black text-white line-clamp-1 mb-1">
                {totalPendingAmount > 0 ? 'Nieopłacona składka' : 'Wszystkie składki opłacone'}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {totalPendingAmount > 0 ? 'Kliknij, aby uregulować szybkim przelewem lub BLIK-iem' : 'Dziękujemy za terminowe regulowanie składek!'}
              </p>
            </div>
            <a
              href="/fees"
              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                totalPendingAmount > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <span>{totalPendingAmount > 0 ? 'Opłać Składkę BLIK' : 'Przejdź do Skarbca'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* KARTA 4: LIGA LALS & STATYSTYKI VOLLEYSTATION */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-950/80 hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between group shadow-lg shadow-amber-950/20">
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" /> 4. Liga LALS & Tabela
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  1. Miejsce
                </span>
              </div>
              <p className="text-sm font-black text-white line-clamp-1 mb-1">
                Angels ZTP na czele tabeli
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Oficjalne raporty VolleyStation, punkty, asy i rankingi zawodników
              </p>
            </div>
            <a
              href="/rozgrywki?tab=liga"
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25"
            >
              <span>Tabela & Statystyki</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Statystyki Sezonu (Klub w Liczbach - Wyłącznie na Pulpicie) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card rounded-3xl p-5 border border-emerald-500/25 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0 glow-emerald">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Średnia Frekwencja
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {teamAverageAttendance}%
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {completedEvents.length} odbytych jednostek
            </span>
          </div>
        </div>

        <div className="cyber-card rounded-3xl p-5 border border-amber-500/25 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 glow-gold">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Liga LALS
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {wonMatches}W - {matches.length - wonMatches}L
            </div>
            <span className="text-[11px] text-amber-400 font-bold">
              1. Miejsce w Lubońskiej Lidze
            </span>
          </div>
        </div>

        <div className="cyber-card rounded-3xl p-5 border border-purple-500/25 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-purple-400" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Lider Frekwencji
            </span>
            <div className="text-base sm:text-lg font-black text-white truncate">
              {attendanceLeader ? attendanceLeader.player.name : 'Brak danych'}
            </div>
            <span className="text-[11px] text-purple-300 font-bold font-mono">
              {attendanceLeader ? `${attendanceLeader.percent}% obecności` : '-'}
            </span>
          </div>
        </div>

        <div className="cyber-card rounded-3xl p-5 border border-sky-500/25 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center shrink-0 glow-cyan">
            <Users className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Kadra & Skarbiec
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {players.length || users.length} zawodników
            </div>
            <span className="text-[11px] text-sky-400 font-bold font-mono">
              {treasury?.balance !== undefined ? `${treasury.balance} zł w skarbcu` : 'Skarbiec aktywny'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid: TYLKO 4 NAJWAŻNIEJSZE RZECZY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* WIDGET 1: NAJBLIŻSZE WYDARZENIE & SZYBKA ANKIETA OBECNOŚCI */}
        <div className="lg:col-span-2 cyber-card rounded-3xl p-6 sm:p-7 border border-sky-500/25 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Najbliższy Sprawdzian
                </span>
              </div>
              {nextEvent && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900 text-slate-300 border border-slate-700">
                  {nextEvent.type}
                </span>
              )}
            </div>

            {nextEvent ? (
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {nextEvent.title} {nextEvent.opponent ? `vs ${nextEvent.opponent}` : ''}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-4 h-4 text-sky-400" />
                    {new Date(nextEvent.date).toLocaleString('pl-PL', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'long', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {nextEvent.location}
                  </span>
                </div>

                {/* Quick Attendance / Coach Management View */}
                {user?.role === 'TRENER' ? (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400">Rola w jednostce:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        <Flame className="w-3.5 h-3.5 text-sky-400" />
                        Sztab Trenerski (Obecność stała)
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-sky-950/20 border border-sky-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-sky-200">
                        Jako Trener nie musisz wypełniać ankiety obecności. Po zajęciach odznacz obecnych zawodników.
                      </p>
                      <a
                        href={`/events?eventId=${nextEvent.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Sprawdź listę
                      </a>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-0.5 flex items-center justify-between">
                      <span>
                        👥 Zawodnicy: <strong className="text-emerald-400">{nextEvent.attendees.filter(a => a.status === 'BEDE' && (a.userRole === 'ZAWODNIK' || a.userNumber)).length} na tak</strong>, {nextEvent.attendees.filter(a => a.status === 'NIEPEWNE' && (a.userRole === 'ZAWODNIK' || a.userNumber)).length} niepewnych
                      </span>
                      <a href="/events" className="text-sky-400 hover:underline font-bold">
                        Otwórz Terminarz &rarr;
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400">Twoja deklaracja obecności:</span>
                      <span className="font-bold text-emerald-400">
                        {myStatusRecord ? (
                          myStatusRecord.status === 'BEDE' ? '🟢 Potwierdzono obecność' :
                          myStatusRecord.status === 'NIEPEWNE' ? '🟡 Niepewny udział' : '🔴 Nieobecny'
                        ) : '⚪ Brak odpowiedzi'}
                      </span>
                    </div>

                    {isArchiveMode ? (
                      <div className="py-2.5 px-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Archiwum: Wydarzenie historyczne (Tylko do odczytu)</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleQuickAttendance(nextEvent.id, 'BEDE')}
                          disabled={updatingAttendance}
                          className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                            myStatusRecord?.status === 'BEDE'
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Będę
                        </button>
                        <button
                          onClick={() => handleQuickAttendance(nextEvent.id, 'NIEPEWNE')}
                          disabled={updatingAttendance}
                          className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                            myStatusRecord?.status === 'NIEPEWNE'
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-900 hover:bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Niepewne
                        </button>
                        <button
                          onClick={() => handleQuickAttendance(nextEvent.id, 'NIE_BEDE')}
                          disabled={updatingAttendance}
                          className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                            myStatusRecord?.status === 'NIE_BEDE'
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                              : 'bg-slate-900 hover:bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Nie będę
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                      <span>
                        👥 Zgłoszeni: <strong className="text-emerald-400">{nextEvent.attendees.filter(a => a.status === 'BEDE' && (a.userRole === 'ZAWODNIK' || a.userNumber)).length} na tak</strong>, {nextEvent.attendees.filter(a => a.status === 'NIEPEWNE' && (a.userRole === 'ZAWODNIK' || a.userNumber)).length} niepewnych
                      </span>
                      <a href="/events" className="text-amber-400 hover:underline font-bold">
                        Terminarz &rarr;
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6">Brak zaplanowanych sparingów i meczów w najbliższych dniach.</p>
            )}
          </div>

          <a
            href="/rozgrywki?tab=sparingi"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <span>Zobacz pełną listę sparingów & weryfikację</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* WIDGET 2: OSTATNI WYNIK & FORMA */}
        <div className="cyber-card rounded-3xl p-6 sm:p-7 border border-emerald-500/30 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Ostatni Wynik
              </span>
            </div>

            {lastMatch ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">vs {lastMatch.opponent}</span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 glow-emerald">
                    Wygrana
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-white flex items-center gap-2">
                  <span className="text-emerald-400">{lastMatch.teamSetsWon}</span>
                  <span className="text-slate-600">:</span>
                  <span className="text-slate-400">{lastMatch.opponentSetsWon}</span>
                </div>

                {/* Sets badges */}
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-300">
                  {lastMatch.sets.slice(0, 4).map(s => (
                    <span key={s.setNumber} className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-300">
                      {s.teamScore}:{s.opponentScore}
                    </span>
                  ))}
                </div>

                {lastMatch.mvp && (
                  <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5 pt-1 line-clamp-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>MVP: {lastMatch.mvp}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">Brak rozegranych meczów w historii.</p>
            )}
          </div>

          <a
            href="/rozgrywki?tab=liga"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
          >
            <span>Tabela i wyniki ligowe</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* WIDGET 3: SKŁADKI & SKARBIEC DRUŻYNY */}
        <div className="cyber-card rounded-3xl p-6 sm:p-7 border border-sky-500/30 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black uppercase tracking-wider text-sky-300">
                Twoje Składki
              </span>
            </div>

            {currentPayment ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 line-clamp-1 font-bold">{currentFee?.title || 'Składka klubowa'}</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${
                    currentPayment.status === 'OPLACONE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {currentPayment.status === 'OPLACONE' ? 'Opłacona' : 'Do zapłaty'}
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-white">
                  {currentPayment.amount} zł
                </div>

                <div className="text-xs text-slate-400">
                  {currentPayment.status === 'OPLACONE' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uregulowano pomyślnie
                    </span>
                  ) : (
                    <span>Termin: {currentFee?.dueDate || 'Bieżący miesiąc'}</span>
                  )}
                </div>

                {treasury && treasury.userOverpayments > 0 && (
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-300 font-bold flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
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
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
          >
            <span>Przejdź do Skarbca</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 3. Pinned Important Announcement Banner */}
      {pinnedAnnouncement && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Ważny Komunikat Sztabu
                </span>
                <span className="text-[10px] text-slate-500">
                  • {pinnedAnnouncement.createdByName}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                {pinnedAnnouncement.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {pinnedAnnouncement.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Szybkie Skróty Modułów (Clean Card Grid) */}
      <div>
        <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 px-1">
          Nawigacja Modułów Drużyny
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <a
            href="/events"
            className="cyber-card rounded-3xl p-5 hover:border-amber-500/60 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition glow-gold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-amber-400 transition">
                Terminarz
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Harmonogram treningów, obecność i statystyki.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-400 gap-1">
              <span>Otwórz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </a>
          <a
            href="/rozgrywki?tab=sparingi"
            className="cyber-card rounded-3xl p-5 hover:border-amber-500/60 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition glow-gold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-amber-400 transition">
                Sparingi
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ankieta, ustalanie składu i wyniki meczów sparingowych.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-400 gap-1">
              <span>Otwórz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </a>

          <a
            href="/rozgrywki?tab=liga"
            className="cyber-card rounded-3xl p-5 hover:border-sky-500/60 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition p-1 glow-cyan">
                <img src="/lals_logo.png" alt="LALS" className="w-full h-full object-contain rounded-full" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-sky-400 transition">
                Liga LALS & Tabela
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lubońska Amatorska Liga Siatkówki, tabela, wyniki meczów i statystyki.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-sky-400 gap-1">
              <span>Otwórz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </a>

          <a
            href="/fees"
            className="cyber-card rounded-3xl p-5 hover:border-emerald-500/60 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition glow-emerald">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-emerald-400 transition">
                Składki & Skarbiec
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Wpłaty, elastyczne nadpłaty i fundusz sprzętowy drużyny.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-400 gap-1">
              <span>Otwórz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </a>

          <a
            href="/team"
            className="cyber-card rounded-3xl p-5 hover:border-purple-500/60 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-purple-400 transition">
                Kadra & Profile
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Profile zawodników, statystyki meczowe, punkty i MVP.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-purple-400 gap-1">
              <span>Otwórz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </a>

          <a
            href="/taktyka"
            className="cyber-card rounded-3xl p-5 hover:border-rose-500/60 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-rose-400 transition">
                Tablica Taktyczna
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Rysowanie strzałek i taktyk, playbook P1-P6 i wytyczne.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-rose-400 gap-1">
              <span>Otwórz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
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
