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
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
      
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

      {/* 2. ELEGANCKA, PROFESJONALNA KARTA MECZU NA SZCZYCIE (HERO MATCH CARD) */}
      {(nextEvent || officialNextMatch) ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white p-5 sm:p-7 shadow-xl border border-sky-800/40 space-y-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* GÓRNY PASEK: KATEGORIA, RUNDA, DATA I GODZINA */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-sm font-sans">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                Najbliższy Mecz Ligowy
              </span>
              {officialNextMatch && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white/10 text-slate-200 border border-white/15">
                  LALS Runda {officialNextMatch.round} • Nr {officialNextMatch.matchNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sky-200 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {officialNextMatch?.dateStr || (nextEvent ? new Date(nextEvent.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) : '')} • godz. {officialNextMatch?.timeStr || (nextEvent ? new Date(nextEvent.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '')}
              </span>
            </div>
          </div>

          {/* ŚRODKOWY SCOREBOARD: POJEDYNEK DRUŻYN */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-7 items-center gap-6 py-2">
            
            {/* GOSPODARZ (ANGELS ZTP) */}
            <div className="md:col-span-3 flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 p-0.5 shadow-lg shadow-sky-500/25 shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white">
                  <Volleyball className="w-8 h-8 sm:w-10 sm:h-10 text-sky-300" />
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 block font-mono">
                  Gospodarz • 2. Miejsce
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-athletic text-white truncate">
                  {officialNextMatch?.homeTeam || 'Angels ZTP'}
                </h2>
                <span className="text-xs text-slate-300 font-medium block">
                  Luboń, Poznań
                </span>
              </div>
            </div>

            {/* ŚRODEK (VS & LOKALIZACJA) */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center space-y-1 py-2 md:py-0 border-y md:border-y-0 md:border-x border-white/10">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black uppercase text-amber-300 tracking-wider font-mono shadow-inner">
                VS
              </div>
              <div className="text-[11px] text-sky-200/90 font-medium flex items-center gap-1 justify-center pt-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate max-w-[140px]">{nextEvent?.location || 'Hala OSiR, Luboń'}</span>
              </div>
            </div>

            {/* RYWAL (COCO JUMBO) */}
            <div className="md:col-span-3 flex items-center md:flex-row-reverse gap-4 md:text-right">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 shadow-lg shadow-amber-500/25 shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block font-mono">
                  Rywal • 4. Miejsce
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-athletic text-white truncate">
                  {officialNextMatch?.awayTeam || nextEvent?.opponent || 'Coco Jumbo'}
                </h2>
                <span className="text-xs text-slate-300 font-medium block">
                  Stawka: Top 3 Ligi
                </span>
              </div>
            </div>

          </div>

          {/* ZINTEGROWANY DOLNY PASEK: DEKLARACJA OBECNOŚCI & TAKTYKA */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Lewa strona: Twoja deklaracja obecności */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <span className="text-xs font-bold text-sky-200 shrink-0">Twoja obecność:</span>
              {nextEvent && (
                <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/15">
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'BEDE')}
                    disabled={updatingAttendance}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      myStatusRecord?.status === 'BEDE'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Będę</span>
                  </button>
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'NIEPEWNE')}
                    disabled={updatingAttendance}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      myStatusRecord?.status === 'NIEPEWNE'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Może</span>
                  </button>
                  <button
                    onClick={() => handleQuickAttendance(nextEvent.id, 'NIE_BEDE')}
                    disabled={updatingAttendance}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      myStatusRecord?.status === 'NIE_BEDE'
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Nieobecny</span>
                  </button>
                </div>
              )}
            </div>

            {/* Prawa strona: Zadeklarowany skład oraz Przycisk do taktyki */}
            <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto">
              <Link 
                href={`/events?eventId=${nextEvent?.id || 'evt_lals_1972'}`}
                className="text-xs text-sky-200/90 hover:text-white transition flex items-center gap-1.5 font-medium"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>Zadeklarowani: <strong className="text-white font-black">{attendingCount === 1 ? '1 obecny' : `${attendingCount} obecnych`}</strong></span>
              </Link>

              <Link
                href={`/taktyka?eventId=${nextEvent?.id || 'evt_lals_1972'}`}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
              >
                <Target className="w-4 h-4" />
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
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                Kolejne Najbliższe Terminy
              </h3>
            </div>
            <Link href="/events" className="text-xs font-bold text-sky-600 hover:text-sky-800">
              Wszystkie ({events.length}) &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {followingEvents.length > 0 ? (
              followingEvents.map((ev) => {
                const evDate = new Date(ev.date);
                const isMatch = ev.type === 'MECZ';
                const myEvStatus = ev.attendees?.find(a => a.userId === user?.id);
                return (
                  <Link
                    key={ev.id}
                    href={`/events?eventId=${ev.id}`}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          isMatch ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {ev.type}
                        </span>
                        <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition truncate">{ev.title}</h4>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{evDate.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span>•</span>
                        <span>godz. {evDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                        {ev.location && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{ev.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        myEvStatus?.status === 'BEDE' ? 'bg-emerald-100 text-emerald-800' :
                        myEvStatus?.status === 'NIEPEWNE' ? 'bg-amber-100 text-amber-800' :
                        myEvStatus?.status === 'NIE_BEDE' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {myEvStatus?.status === 'BEDE' ? 'Będziesz ✓' :
                         myEvStatus?.status === 'NIEPEWNE' ? 'Niepewne' :
                         myEvStatus?.status === 'NIE_BEDE' ? 'Nieobecny' : 'Brak głosu'}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">Brak dalszych terminów w najbliższym tygodniu.</p>
            )}
          </div>

          <Link
            href="/events"
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>Otwórz pełny terminarz meczów i treningów</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* PRAWA KOLUMNA: TWOJE BIEŻĄCE SPRAWY (SKŁADKA & PILNE OGŁOSZENIE) */}
        <div className="space-y-6">

          {/* TWOJE SKŁADKI KLUBOWE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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
                {unpaidUserPayments.length === 0 ? 'Wszystko OK' : `${unpaidUserPayments.length} do opłaty`}
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

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Skarbiec drużyny: <strong className="text-slate-800 font-mono font-bold">{treasury?.balance !== undefined ? `${treasury.balance} zł` : '0 zł'}</strong></span>
              <Link href="/fees" className="text-sky-600 hover:text-sky-800 font-bold underline">
                Kasa i składki &rarr;
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
