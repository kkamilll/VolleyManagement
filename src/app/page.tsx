'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Flame, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  CreditCard,
  Pin,
  Clock,
  ArrowRight,
  Volleyball,
  Shield,
  Users,
  Check
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
import { TeamCrestBadge } from '@/lib/team-crests';

function DashboardContent() {
  const { user } = useAuth();
  const { isArchiveMode } = useSeasonArchive();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [userPayments, setUserPayments] = useState<FeePayment[]>([]);
  const [treasury, setTreasury] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, feesRes, annRes, leagueRes] = await Promise.allSettled([
        fetch('/api/events').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/fees').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/announcements').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/league').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

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

  // Quick 1-click attendance vote
  const handleQuickAttendance = async (eventId: string, status: AttendanceStatus) => {
    if (isArchiveMode) {
      alert('W trybie archiwum deklarowanie obecności jest zablokowane.');
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

  // Nadchodzące wydarzenia (mecze, treningi, sparingi)
  const now = Date.now() - 3600000 * 12;
  const upcomingEvents = events
    .filter(e => new Date(e.date).getTime() >= now && !e.isCompleted && e.status !== 'ZAKONCZONY')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextEvent = upcomingEvents[0];
  const followingEvents = upcomingEvents.slice(1, 4);

  // Terminarz ligowy LALS dla Angels ZTP
  const angelsScheduleMatches = (leagueData?.leagueSchedule || []).filter(
    (m: any) => m.homeTeam === 'Angels ZTP' || m.awayTeam === 'Angels ZTP'
  );
  const officialNextMatch = angelsScheduleMatches.find((m: any) => !m.isFinished);

  // Zespoły najbliższego meczu
  const homeTeamName = officialNextMatch?.homeTeam || (nextEvent?.title?.includes('vs') ? nextEvent.title.split('vs')[0].replace(/^.*:\s*/, '').trim() : 'Angels ZTP');
  const awayTeamName = officialNextMatch?.awayTeam || nextEvent?.opponent || (nextEvent?.title?.includes('vs') ? nextEvent.title.split('vs')[1].trim() : 'Rywal');
  const isAngelsHome = homeTeamName.includes('Angels');
  const isAngelsAway = awayTeamName.includes('Angels');

  // Status obecności użytkownika na najbliższym wydarzeniu
  const myStatusRecord = nextEvent?.attendees?.find(a => a.userId === user?.id);
  const attendingAttendees = nextEvent?.attendees?.filter(a => a.status === 'BEDE') || [];
  const attendingCount = attendingAttendees.length;

  // Status składki klubowej użytkownika
  const currentPayment = userPayments.length > 0 ? userPayments[0] : null;
  const currentFee = currentPayment ? fees.find(f => f.id === currentPayment.feeId) : null;
  const unpaidUserPayments = userPayments.filter(p => p.status === 'OCZEKUJE' || p.status === 'ZALEGLE');

  // Najważniejsze / pilne ogłoszenie sztabu
  const urgentAnnouncement = announcements.find(a => a.isPinned || a.priority === 'PILNY' || a.priority === 'WAZNY');

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 sm:pb-12 space-y-5 sm:space-y-6">
      
      {/* 1. NAGŁÓWEK: TYLKO NAJBLIŻSZE SPRAWY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Centrum Drużyny • Angels ZTP
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase font-athletic mt-0.5">
            Najbliższe Sprawy
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/events"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs transition"
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Pełny Terminarz &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 2. NOWOCZESNA KARTA MECZU DNIA (MATCHDAY HERO CENTER) */}
      {(nextEvent || officialNextMatch) ? (
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xl text-slate-900 transition-all">
          {/* Subtelny akcent boiska w tle */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-amber-400 to-sky-600" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

          {/* GÓRNY PASEK: KATEGORIA, RUNDA, DATA I GODZINA */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 pt-4 pb-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-xs font-sans">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                Najbliższy Mecz Ligowy
              </span>
              {officialNextMatch && (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  LALS Runda {officialNextMatch.round} • Mecz #{officialNextMatch.matchNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-xs font-bold shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {officialNextMatch?.dateStr || (nextEvent ? new Date(nextEvent.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) : '')} • godz. {officialNextMatch?.timeStr || (nextEvent ? new Date(nextEvent.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '')}
              </span>
            </div>
          </div>

          {/* GŁÓWNY POJEDYNEK DRUŻYN (SCOREBOARD DUEL) */}
          <div className="relative z-10 px-4 sm:px-8 py-5 sm:py-6">
            <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6">
              
              {/* GOSPODARZ */}
              <div className="md:col-span-3 flex items-center gap-4 sm:gap-5">
                <TeamCrestBadge
                  teamName={homeTeamName}
                  crestsMap={leagueData?.teamCrests}
                  size="xl"
                  rounded="rounded-2xl"
                  className="shadow-md"
                />
                <div className="space-y-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider font-mono ${
                    isAngelsHome ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {isAngelsHome ? 'Gospodarz • Angels ZTP' : 'Gospodarz'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-athletic text-slate-900 truncate">
                    {homeTeamName}
                  </h2>
                </div>
              </div>

              {/* ŚRODEK (VS & HALA) */}
              <div className="md:col-span-1 flex flex-col items-center justify-center text-center space-y-2 py-2 md:py-0">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-black text-slate-700 font-mono shadow-inner">
                  VS
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 max-w-[150px] truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{nextEvent?.location || 'Hala OSiR, Luboń'}</span>
                </div>
              </div>

              {/* GOŚĆ */}
              <div className="md:col-span-3 flex items-center md:flex-row-reverse gap-4 sm:gap-5 md:text-right">
                <TeamCrestBadge
                  teamName={awayTeamName}
                  crestsMap={leagueData?.teamCrests}
                  size="xl"
                  rounded="rounded-2xl"
                  className="shadow-md"
                />
                <div className="space-y-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider font-mono ${
                    isAngelsAway ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {isAngelsAway ? 'Gość • Angels ZTP' : 'Gość'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-athletic text-slate-900 truncate">
                    {awayTeamName}
                  </h2>
                </div>
              </div>

            </div>
          </div>

          {/* DOLNY PASEK: OBECNOŚĆ, SKŁAD & TAKTYKA */}
          <div className="relative z-10 px-4 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-200/90 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            
            {/* Twoja deklaracja obecności */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 shrink-0">
                Twoja obecność:
              </span>
              {nextEvent && (
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-2xs w-full sm:w-auto">
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'BEDE')}
                    disabled={updatingAttendance}
                    className={`py-2 sm:py-1.5 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      myStatusRecord?.status === 'BEDE'
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Będę</span>
                  </button>
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'NIEPEWNE')}
                    disabled={updatingAttendance}
                    className={`py-2 sm:py-1.5 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      myStatusRecord?.status === 'NIEPEWNE'
                        ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400/40'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span>Może</span>
                  </button>
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'NIE_BEDE')}
                    disabled={updatingAttendance}
                    className={`py-2 sm:py-1.5 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      myStatusRecord?.status === 'NIE_BEDE'
                        ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-200 shrink-0" />
                    <span>Nieobecny</span>
                  </button>
                </div>
              )}
            </div>

            {/* Skład & Przejście do Taktyki */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-auto">
              <Link 
                href={nextEvent?.id ? `/events?eventId=${nextEvent.id}` : '/events'}
                className="text-xs text-slate-700 hover:text-sky-700 transition flex items-center justify-center gap-1.5 font-bold py-2.5 sm:py-2 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs"
              >
                <Users className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Skład: <strong className="text-slate-900">{attendingCount === 1 ? '1 obecny' : `${attendingCount} obecnych`}</strong> &rarr;</span>
              </Link>

              <Link
                href={nextEvent?.id ? `/taktyka?eventId=${nextEvent.id}` : '/taktyka'}
                className="py-2.5 sm:py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm hover:shadow cursor-pointer active:scale-95"
              >
                <Target className="w-4 h-4 text-sky-200 shrink-0" />
                <span>Założenia Taktyczne &rarr;</span>
              </Link>
            </div>

          </div>

        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Brak zaplanowanych meczów w najbliższych dniach</h3>
          <p className="text-xs text-slate-500">Sztab szkoleniowy wkrótce doda kolejne terminy w terminarzu.</p>
        </div>
      )}

      {/* 3. DWIE GŁÓWNE SEKCJIE: KOLEJNE NAJBLIŻSZE TERMINY ORAZ TWOJE SPRAWY DO ZAŁATWIENIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEWA KOLUMNA: NAJBLIŻSZE KOLEJNE TERMINY (KALENDARZ NA DNI) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight font-athletic">
                  Kolejne Terminy
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Oficjalny kalendarz zespołu</span>
              </div>
            </div>
            <Link href="/events" className="text-xs font-bold text-sky-600 hover:text-sky-800 transition flex items-center gap-1">
              <span>Wszystkie ({events.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {followingEvents.length > 0 ? (
              followingEvents.map((ev) => {
                const evDate = new Date(ev.date);
                const isMatch = ev.type === 'MECZ';
                const myEvStatus = ev.attendees?.find(a => a.userId === user?.id);
                return (
                  <Link
                    key={ev.id}
                    href={`/events?eventId=${ev.id}`}
                    className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-sky-300 transition-all flex items-center justify-between gap-3 text-xs group hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Date block on the left */}
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:border-sky-300 transition">
                        <span className="text-[9px] font-black uppercase text-sky-600 font-mono">
                          {evDate.toLocaleDateString('pl-PL', { month: 'short' })}
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono leading-none">
                          {evDate.getDate()}
                        </span>
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono ${
                            isMatch ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {ev.type}
                          </span>
                          <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition truncate">{ev.title}</h4>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 truncate">
                          <span>{evDate.toLocaleDateString('pl-PL', { weekday: 'short' })}</span>
                          <span>•</span>
                          <span>godz. {evDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                          {ev.location && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px] text-slate-400">{ev.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                        myEvStatus?.status === 'BEDE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                        myEvStatus?.status === 'NIEPEWNE' ? 'bg-amber-50 text-amber-800 border border-amber-300' :
                        myEvStatus?.status === 'NIE_BEDE' ? 'bg-rose-50 text-rose-800 border border-rose-300' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {myEvStatus?.status === 'BEDE' ? 'Będziesz ✓' :
                         myEvStatus?.status === 'NIEPEWNE' ? 'Może ?' :
                         myEvStatus?.status === 'NIE_BEDE' ? 'Nieobecny' : 'Brak głosu'}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Brak dalszych terminów w kalendarzu.</p>
            )}
          </div>

          <Link
            href="/events"
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>Otwórz pełny terminarz meczów i treningów</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* PRAWA KOLUMNA: TWOJE BIEŻĄCE SPRAWY (SKŁADKA & PILNE OGŁOSZENIE) */}
        <div className="space-y-6">

          {/* TWOJE SKŁADKI KLUBOWE */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 font-athletic">
                    Twoje Składki Klubowe
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Finanse i rozliczenia BLIK</span>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border font-mono ${
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
                  Wszystkie Twoje składki są w pełni uregulowane!
                </div>
                <p className="text-[11px] text-emerald-700">
                  Brak jakichkolwiek zaległości na Twoim koncie zawodnika.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 text-xs text-amber-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{currentFee?.title || 'Składka klubowa'}</span>
                  <span className="text-xl font-black font-mono text-slate-900">{currentPayment?.amount} zł</span>
                </div>
                <Link
                  href="/fees?tab=my_fees"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <span>Opłać teraz kodem BLIK &rarr;</span>
                </Link>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span>Stan skarbca:</span>
                <strong className="text-slate-900 font-mono font-bold">{treasury?.balance !== undefined ? `${treasury.balance} zł` : '0 zł'}</strong>
              </span>
              <Link href="/fees" className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 transition">
                <span>Szczegóły kasy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* WAŻNY KOMUNIKAT PRZEDMECZOWY (JEŚLI JEST) */}
          {urgentAnnouncement && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Ważny Komunikat Sztabu
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                  {urgentAnnouncement.priority}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900">{urgentAnnouncement.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{urgentAnnouncement.content}</p>
              </div>

              <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Autor: {urgentAnnouncement.createdByName}</span>
                <span>{new Date(urgentAnnouncement.createdAt).toLocaleDateString('pl-PL')}</span>
              </div>
            </div>
          )}

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
