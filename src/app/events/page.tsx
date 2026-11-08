'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Trophy,
  Flame,
  Crown,
  Plus,
  Trash2,
  Edit3,
  Filter,
  Search,
  Download,
  BarChart2,
  Check,
  Shield,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  UserCheck,
  ArrowUpDown,
  Zap,
  Info,
  Lock,
  Unlock,
  Target,
  Swords,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  EventItem,
  User,
  AttendanceStatus,
  EventType,
  EventStatus,
  TacticalPlay
} from '@/lib/types';

function EventsAttendanceContent() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');

  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tactics, setTactics] = useState<TacticalPlay[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterTime, setFilterTime] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const activeFiltersCount = (filterType !== 'ALL' ? 1 : 0) + (filterTime !== 'ALL' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('TRENING');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('Hala Sportowa OSiR, ul. Sportowa 5');
  const [newEventOpponent, setNewEventOpponent] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventCost, setNewEventCost] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Event Form State
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<EventType>('TRENING');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editOpponent, setEditOpponent] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editStatus, setEditStatus] = useState<EventStatus>('ANKIETA');
  const [savingEdit, setSavingEdit] = useState(false);

  // Note editor modal for coach on player
  const [editingPlayerNote, setEditingPlayerNote] = useState<{ userId: string; name: string; note: string } | null>(null);

  // Voting note input state
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [expandedNoteEventId, setExpandedNoteEventId] = useState<string | null>(null);
  const [submittingAttendanceId, setSubmittingAttendanceId] = useState<string | null>(null);
  const [staffBypassLock, setStaffBypassLock] = useState<Record<string, boolean>>({});
  // Tabela obecności: filtr dla każdego wydarzenia (ALL, BEDE, NIEPEWNE, NIE_BEDE, BRAK)
  const [attendanceTableFilter, setAttendanceTableFilter] = useState<Record<string, 'ALL' | 'BEDE' | 'NIEPEWNE' | 'NIE_BEDE' | 'BRAK'>>({});

  const { isArchiveMode } = useSeasonArchive();
  const canManage = Boolean(
    !isArchiveMode && user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain)
  );
  const isCoach = user?.role === 'TRENER';

  const getPositionBadgeStyle = (position?: string) => {
    if (!position) return 'bg-slate-900 text-slate-400 border-slate-800';
    const pos = position.toLowerCase();
    if (pos.includes('przyjmu') || pos === 'p') {
      return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    }
    if (pos.includes('środkow') || pos.includes('srodkow') || pos === 'ś' || pos === 's') {
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
    if (pos.includes('atakuj') || pos === 'a') {
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
    if (pos.includes('rozgryw') || pos === 'r') {
      return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
    if (pos.includes('libero') || pos === 'l') {
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
    if (pos.includes('trener') || pos.includes('kierownik')) {
      return 'bg-slate-800 text-slate-200 border-slate-700';
    }
    return 'bg-slate-900 text-slate-300 border-slate-800';
  };

  // Helper to calculate 14-player ideal training lineup position balance
  const calculatePositionBalance = (event: EventItem) => {
    const confirmedAttendees = (event.attendees || []).filter(a => a.status === 'BEDE');
    
    // Categorize players vs staff
    const staffConfirmed = confirmedAttendees.filter(a => a.userRole === 'TRENER');
    const playerAttendees = confirmedAttendees.filter(a => a.userRole === 'ZAWODNIK' || (a.userRole === 'KIEROWNIK' && Boolean(a.userNumber)));

    const getPlayerDetails = (userId: string, defaultName: string) => {
      const found = users.find(u => u.id === userId);
      return {
        id: userId,
        name: found?.name || defaultName,
        number: found?.number,
        position: found?.position || 'Przyjmujący'
      };
    };

    const confirmedPlayerObjs = playerAttendees.map(a => getPlayerDetails(a.userId, a.userName));

    const normalizePos = (posStr: string) => {
      const s = (posStr || '').toLowerCase();
      if (s.includes('środk') || s.includes('srodk')) return 'ŚRODKOWY';
      if (s.includes('atak')) return 'ATAKUJĄCY';
      if (s.includes('rozgr')) return 'ROZGRYWAJĄCY';
      if (s.includes('lib')) return 'LIBERO';
      return 'PRZYJMUJĄCY';
    };

    const passers = confirmedPlayerObjs.filter(p => normalizePos(p.position) === 'PRZYJMUJĄCY');
    const middles = confirmedPlayerObjs.filter(p => normalizePos(p.position) === 'ŚRODKOWY');
    const opposites = confirmedPlayerObjs.filter(p => normalizePos(p.position) === 'ATAKUJĄCY');
    const setters = confirmedPlayerObjs.filter(p => normalizePos(p.position) === 'ROZGRYWAJĄCY');
    const liberos = confirmedPlayerObjs.filter(p => normalizePos(p.position) === 'LIBERO');

    const positions = [
      { 
        name: 'Przyjmujący', 
        code: 'P', 
        target: 4, 
        confirmed: passers, 
        color: 'text-sky-400',
        badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-300'
      },
      { 
        name: 'Środkowi', 
        code: 'Ś', 
        target: 4, 
        confirmed: middles, 
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      },
      { 
        name: 'Atakujący', 
        code: 'A', 
        target: 2, 
        confirmed: opposites, 
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      },
      { 
        name: 'Rozgrywający', 
        code: 'R', 
        target: 2, 
        confirmed: setters, 
        color: 'text-purple-400',
        badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300'
      },
      { 
        name: 'Libero', 
        code: 'L', 
        target: 2, 
        confirmed: liberos, 
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300'
      }
    ];

    const totalConfirmed = confirmedPlayerObjs.length;
    const targetTotal = 14;
    const isFull = totalConfirmed >= targetTotal;
    const missingPositions = positions
      .filter(p => p.confirmed.length < p.target)
      .map(p => `${p.target - p.confirmed.length} ${p.code}`);

    return {
      positions,
      totalConfirmed,
      targetTotal,
      isFull,
      missingPositions,
      staffConfirmed,
      staffCount: staffConfirmed.length
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, usersRes, tacticsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/users'),
        fetch('/api/tactics')
      ]);

      if (eventsRes.ok) {
        const d = await eventsRes.json();
        setEvents(d.events || []);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
      if (tacticsRes.ok) {
        const t = await tacticsRes.json();
        setTactics(t.tactics || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter players only for attendance calculations
  const players = useMemo(() => {
    return users.filter(u => u.role === 'ZAWODNIK' || (u.role === 'KIEROWNIK' && Boolean(u.number)));
  }, [users]);


  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Type filter
      if (filterType !== 'ALL') {
        const isLeague = Boolean(
          (e.type as string) === 'MECZ' ||
          e.title.toLowerCase().includes('mecz ligow') ||
          e.title.toLowerCase().includes('lals') ||
          (e.description && e.description.toLowerCase().includes('lals')) ||
          (e.opponent && e.title.toLowerCase().includes('liga'))
        );
        if (filterType === 'MECZ_LALS') {
          if (!isLeague) return false;
        } else if (filterType === 'SPARING') {
          if (isLeague || e.type !== 'SPARING') return false;
        } else if (e.type !== filterType) {
          return false;
        }
      }

      // Time filter
      const eventTime = new Date(e.date).getTime();
      const now = Date.now();
      if (filterTime === 'UPCOMING' && eventTime < now - 3600000 * 2) return false;
      if (filterTime === 'PAST' && eventTime >= now - 3600000 * 2) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchOpponent = e.opponent ? e.opponent.toLowerCase().includes(q) : false;
        const matchLoc = e.location.toLowerCase().includes(q);
        if (!matchTitle && !matchOpponent && !matchLoc) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, filterType, filterTime, searchQuery]);

  // Completed events for attendance stats
  const completedEvents = useMemo(() => {
    return events.filter(
      e => e.status === 'ZAKONCZONY' || new Date(e.date).getTime() < Date.now()
    );
  }, [events]);

  // Detailed attendance stats per player
  const playerStats = useMemo(() => {
    const totalUnits = completedEvents.length;
    const trainingUnits = completedEvents.filter(e => e.type === 'TRENING').length;
    const sparringUnits = completedEvents.filter(e => e.type === 'SPARING').length;
    const tournamentUnits = completedEvents.filter(e => e.type === 'TURNIEJ').length;

    return players.map(p => {
      let attendedTotal = 0;
      let attendedTrainings = 0;
      let attendedSparrings = 0;
      let attendedTournaments = 0;
      let declaredYesCount = 0;

      completedEvents.forEach(evt => {
        const decl = evt.attendees.find(a => a.userId === p.id);
        const wasPresent = decl?.status === 'BEDE';
        if (wasPresent) {
          attendedTotal += 1;
          declaredYesCount += 1;
          if (evt.type === 'TRENING') attendedTrainings += 1;
          if (evt.type === 'SPARING') attendedSparrings += 1;
          if (evt.type === 'TURNIEJ') attendedTournaments += 1;
        }
      });

      const overallPercent = totalUnits > 0 ? Math.round((attendedTotal / totalUnits) * 100) : 100;
      const trainingPercent = trainingUnits > 0 ? Math.round((attendedTrainings / trainingUnits) * 100) : 100;
      const reliability = 100;

      return {
        player: p,
        attendedTotal,
        totalUnits,
        overallPercent,
        attendedTrainings,
        trainingUnits,
        trainingPercent,
        attendedSparrings,
        sparringUnits,
        attendedTournaments,
        tournamentUnits,
        reliability,
        declaredYesCount,
        coachNotes: p.stats?.coachNotes || ''
      };
    }).sort((a, b) => b.overallPercent - a.overallPercent || b.attendedTotal - a.attendedTotal);
  }, [players, completedEvents]);

  // Overall team average attendance
  const teamAverageAttendance = useMemo(() => {
    if (playerStats.length === 0) return 0;
    const sum = playerStats.reduce((acc, curr) => acc + curr.overallPercent, 0);
    return Math.round(sum / playerStats.length);
  }, [playerStats]);

  // Pagination for Events
  const [eventsPage, setEventsPage] = useState(1);
  const EVENTS_PER_PAGE = 5;

  useEffect(() => {
    setEventsPage(1);
  }, [filterType, filterTime, searchQuery]);

  const totalEventsPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (eventsPage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredEvents, eventsPage]);

  // 1. Declare attendance (for everyone: players, coach, manager)
  const handleAttendance = async (eventId: string, status: AttendanceStatus, note?: string) => {
    if (isArchiveMode) {
      alert('W trybie archiwum deklarowanie obecności jest zablokowane.');
      return;
    }
    if (!user) {
      alert('Musisz być zalogowany, aby zadeklarować obecność');
      return;
    }
    setSubmittingAttendanceId(eventId);
    try {
      const chosenNote = note !== undefined ? note : (attendanceNotes[eventId] || undefined);
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: chosenNote })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAttendanceId(null);
    }
  };


  // 3. Create New Event (Training / Sparring / Tournament)
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate || !newEventLocation.trim()) {
      alert('Wypełnij wymagane pola (Tytuł, Data, Miejsce)');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          type: newEventType,
          date: newEventDate,
          location: newEventLocation,
          opponent: newEventOpponent ? newEventOpponent.trim() : undefined,
          description: newEventDescription ? newEventDescription.trim() : undefined,
          costPerPerson: newEventCost ? Number(newEventCost) : undefined
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventOpponent('');
        setNewEventCost('');
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd tworzenia jednostki');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // 4. Delete Event
  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Czy na pewno usunąć wydarzenie: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4b. Open Edit Modal
  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditType(event.type);
    try {
      const d = new Date(event.date);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditDate(localIso);
    } catch {
      setEditDate(event.date);
    }
    setEditLocation(event.location || '');
    setEditOpponent(event.opponent || '');
    setEditDescription(event.description || '');
    setEditCost(event.costPerPerson ? event.costPerPerson.toString() : '');
    setEditStatus(event.status || 'ANKIETA');
  };

  // 4c. Save Edited Event
  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editTitle.trim() || !editDate) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEvent.id,
          title: editTitle.trim(),
          type: editType,
          date: new Date(editDate).toISOString(),
          location: editLocation.trim(),
          opponent: editOpponent.trim() || undefined,
          description: editDescription.trim() || undefined,
          costPerPerson: editCost ? parseFloat(editCost) : 0,
          status: editStatus
        })
      });

      if (res.ok) {
        setEditingEvent(null);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd aktualizacji jednostki');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas zapisywania zmian');
    } finally {
      setSavingEdit(false);
    }
  };

  // 5. Save Coach Note for Player
  const handleSaveCoachNote = async () => {
    if (!editingPlayerNote) return;
    try {
      const targetUser = users.find(u => u.id === editingPlayerNote.userId);
      if (!targetUser) return;

      const updatedStats = {
        ...(targetUser.stats || {}),
        coachNotes: editingPlayerNote.note
      };

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlayerNote.userId,
          stats: updatedStats
        })
      });

      if (res.ok) {
        setEditingPlayerNote(null);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 pb-20 md:pb-16 space-y-6 sm:space-y-8">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-athletic">
                Terminarz & Frekwencja
              </h1>
              {isCoach && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Tryb Trenera
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nowa Jednostka</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminarz & Dziennik Obecności */}
      <div className="space-y-6">

        {/* Collapsible Filters Bar */}
          <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filtry</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                      {activeFiltersCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterType('ALL');
                      setFilterTime('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition underline underline-offset-2 ml-1"
                  >
                    Wyczyść filtry
                  </button>
                )}
              </div>

              {/* Quick search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Szukaj jednostki..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Collapsible Panel */}
            {showFilters && (
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Typ:</span>
                  {[
                    { id: 'ALL', label: 'Wszystkie', activeClass: 'bg-amber-500 text-slate-950 font-black shadow-sm' },
                    { id: 'TRENING', label: '🏐 Treningi', activeClass: 'bg-emerald-500 text-slate-950 font-black shadow-sm shadow-emerald-500/20' },
                    { id: 'SPARING', label: '⚔️ Sparingi', activeClass: 'bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/20' },
                    { id: 'MECZ_LALS', label: '🔵 Mecze LALS', activeClass: 'bg-sky-500 text-slate-950 font-black shadow-sm shadow-sky-500/20' },
                    { id: 'TURNIEJ', label: '🏆 Turnieje', activeClass: 'bg-purple-500 text-white font-black shadow-sm shadow-purple-500/20' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setFilterType(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        filterType === t.id
                          ? t.activeClass
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-800 hidden sm:block" />

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Czas:</span>
                  {[
                    { id: 'ALL', label: 'Wszystkie' },
                    { id: 'UPCOMING', label: 'Nadchodzące' },
                    { id: 'PAST', label: 'Zakończone' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setFilterTime(t.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        filterTime === t.id
                          ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Events List */}
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">Ładowanie terminarza...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">Brak jednostek w wybranym filtrze</h3>
              <p className="text-xs text-slate-500">Zmień filtry powyżej lub dodaj nową jednostkę treningową.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedEvents.map(event => {
                const isExpanded = expandedEventId === event.id;
                const yesAttendees = event.attendees.filter(a => a.status === 'BEDE' && (a.userRole === 'ZAWODNIK' || a.userNumber));
                const noAttendees = event.attendees.filter(a => a.status === 'NIE_BEDE');
                const maybeAttendees = event.attendees.filter(a => a.status === 'NIEPEWNE');
                const myAttendance = event.attendees.find(a => a.userId === user?.id);

                const isFinished = event.status === 'ZAKONCZONY';

                // Wyrazista kolorystyka każdego elementu wg typu jednostki (Trening = Zieleń, Sparing = Złoto/Bursztyn, Turniej = Purpura, Mecz = Błękit)
                const typeThemeStyles: Record<string, {
                  cardBorder: string;
                  cardBg: string;
                  leftAccent: string;
                  dateBoxBg: string;
                  dateBoxBorder: string;
                  dateDayText: string;
                  dateClockText: string;
                  clockIconColor: string;
                  badge: string;
                  titleHover: string;
                  actionBtn: string;
                  glow: string;
                  expandedBg: string;
                  expandedBorder: string;
                }> = {
                  TRENING: {
                    cardBorder: 'border-emerald-500/35 hover:border-emerald-500/60',
                    cardBg: isExpanded 
                      ? 'bg-gradient-to-b from-emerald-950/40 via-[#091512] to-[#070d0b]' 
                      : 'bg-gradient-to-r from-emerald-950/35 via-[#091512]/90 to-[#070b0e]/95 hover:from-emerald-950/45',
                    leftAccent: 'border-l-[6px] border-l-emerald-500',
                    dateBoxBg: 'bg-emerald-950/70',
                    dateBoxBorder: 'border-emerald-500/40 group-hover:border-emerald-400/70',
                    dateDayText: 'text-emerald-400',
                    dateClockText: 'text-emerald-100',
                    clockIconColor: 'text-emerald-400',
                    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/50',
                    titleHover: 'group-hover:text-emerald-300',
                    actionBtn: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40',
                    glow: 'shadow-lg shadow-emerald-950/20 hover:shadow-emerald-950/40',
                    expandedBg: 'bg-[#050f0c]',
                    expandedBorder: 'border-emerald-500/30',
                  },
                  SPARING: {
                    cardBorder: 'border-amber-500/40 hover:border-amber-500/70',
                    cardBg: isExpanded 
                      ? 'bg-gradient-to-b from-amber-950/40 via-[#18120a] to-[#0c0906]' 
                      : 'bg-gradient-to-r from-amber-950/35 via-[#161008]/90 to-[#0a080d]/95 hover:from-amber-950/45',
                    leftAccent: 'border-l-[6px] border-l-amber-500',
                    dateBoxBg: 'bg-amber-950/70',
                    dateBoxBorder: 'border-amber-500/40 group-hover:border-amber-400/70',
                    dateDayText: 'text-amber-400',
                    dateClockText: 'text-amber-100',
                    clockIconColor: 'text-amber-400',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/50',
                    titleHover: 'group-hover:text-amber-300',
                    actionBtn: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40',
                    glow: 'shadow-lg shadow-amber-950/20 hover:shadow-amber-950/40',
                    expandedBg: 'bg-[#100a05]',
                    expandedBorder: 'border-amber-500/30',
                  },
                  TURNIEJ: {
                    cardBorder: 'border-purple-500/40 hover:border-purple-500/70',
                    cardBg: isExpanded 
                      ? 'bg-gradient-to-b from-purple-950/40 via-[#140b20] to-[#0a0614]' 
                      : 'bg-gradient-to-r from-purple-950/35 via-[#130b1e]/90 to-[#07060d]/95 hover:from-purple-950/45',
                    leftAccent: 'border-l-[6px] border-l-purple-500',
                    dateBoxBg: 'bg-purple-950/70',
                    dateBoxBorder: 'border-purple-500/40 group-hover:border-purple-400/70',
                    dateDayText: 'text-purple-400',
                    dateClockText: 'text-purple-100',
                    clockIconColor: 'text-purple-400',
                    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-950/50',
                    titleHover: 'group-hover:text-purple-300',
                    actionBtn: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/40',
                    glow: 'shadow-lg shadow-purple-950/20 hover:shadow-purple-950/40',
                    expandedBg: 'bg-[#0f0718]',
                    expandedBorder: 'border-purple-500/30',
                  },
                  MECZ: {
                    cardBorder: 'border-sky-500/40 hover:border-sky-500/70',
                    cardBg: isExpanded 
                      ? 'bg-gradient-to-b from-sky-950/40 via-[#0a1424] to-[#060a12]' 
                      : 'bg-gradient-to-r from-sky-950/35 via-[#081220]/90 to-[#06090e]/95 hover:from-sky-950/45',
                    leftAccent: 'border-l-[6px] border-l-sky-500',
                    dateBoxBg: 'bg-sky-950/70',
                    dateBoxBorder: 'border-sky-500/40 group-hover:border-sky-400/70',
                    dateDayText: 'text-sky-400',
                    dateClockText: 'text-sky-100',
                    clockIconColor: 'text-sky-400',
                    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-950/50',
                    titleHover: 'group-hover:text-sky-300',
                    actionBtn: 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/40',
                    glow: 'shadow-lg shadow-sky-950/20 hover:shadow-sky-950/40',
                    expandedBg: 'bg-[#060e18]',
                    expandedBorder: 'border-sky-500/30',
                  }
                };

                // Wykrywanie czy wydarzenie to mecz ligowy LALS (lub powiązane z Lubońską Amatorską Ligą Siatkówki)
                const isLeagueMatch = Boolean(
                  (event.type as string) === 'MECZ' ||
                  event.title.toLowerCase().includes('mecz ligow') ||
                  event.title.toLowerCase().includes('lals') ||
                  (event.description && event.description.toLowerCase().includes('lals')) ||
                  (event.opponent && event.title.toLowerCase().includes('liga'))
                );

                // Kolorystyka i motyw: dla meczu ligowego LALS zawsze oficjalny błękitny motyw MECZ, inaczej motyw dedykowany
                const theme = isLeagueMatch ? typeThemeStyles.MECZ : (typeThemeStyles[event.type] || typeThemeStyles.SPARING);

                // Calculate 14-player position balance for the ideal 6x6 game
                const posBalance = calculatePositionBalance(event);

                // Vote-to-unlock gate: user must declare attendance (or staff bypass) to see tactics
                const hasVoted = Boolean(myAttendance && myAttendance.status);
                const isUnlocked = hasVoted || Boolean(staffBypassLock[event.id]);

                // Avoid duplicating opponent if title already contains opponent name
                const cleanOpponent = event.opponent?.trim();
                const hasOpponentInTitle = Boolean(cleanOpponent && event.title.toLowerCase().includes(cleanOpponent.toLowerCase()));
                const displayTitle = cleanOpponent && !hasOpponentInTitle ? `${event.title} vs ${cleanOpponent}` : event.title;

                return (
                  <div
                    key={event.id}
                    className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} ${theme.leftAccent} ${theme.glow} transition-all duration-300 overflow-hidden`}
                  >
                    {/* Collapsible Header Row (Rozwijany wiersz jednostki) */}
                    <div
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="p-4 sm:p-5 cursor-pointer flex flex-col gap-3.5 select-none group"
                    >
                      {/* Góra: Data, Odznaki typu, Czysty tytuł, Lokalizacja, Licznik pozycji */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Compact Date Box - themed by event type */}
                        <div className={`w-fit sm:w-28 shrink-0 px-3 py-1.5 rounded-xl ${theme.dateBoxBg} border ${theme.dateBoxBorder} flex items-center sm:flex-col sm:justify-center text-left sm:text-center gap-2 sm:gap-0.5 transition shadow-sm`}>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${theme.dateDayText}`}>
                            {new Date(event.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`text-xs font-mono font-bold flex items-center gap-1 sm:justify-center ${theme.dateClockText}`}>
                            <Clock className={`w-3 h-3 ${theme.clockIconColor}`} />
                            {new Date(event.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Title and details */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${theme.badge}`}>
                              {isLeagueMatch ? 'MECZ LALS' : event.type}
                            </span>

                            {isFinished ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Zakończona
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                Zgłoszenia w toku
                              </span>
                            )}

                            {/* Ideal 14-Player Lineup Quick Indicator */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                                posBalance.isFull
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-900/90 text-slate-300 border-slate-800'
                              }`}
                              title="Liczba zawodników do idealnego składu 14 graczy (2 pełne szóstki z libero)"
                            >
                              <Users className="w-3 h-3 text-amber-400" />
                              <span><strong>{posBalance.totalConfirmed}</strong>/14 graczy</span>
                              {posBalance.missingPositions.length > 0 ? (
                                <span className="text-amber-400 font-sans hidden md:inline">
                                  (Brak: {posBalance.missingPositions.join(', ')})
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-sans hidden md:inline">
                                  (✓ Komplet 6x6)
                                </span>
                              )}
                            </span>

                            {Boolean(event.costPerPerson && event.costPerPerson > 0) && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-slate-300 border border-slate-800">
                                {event.costPerPerson} zł / os.
                              </span>
                            )}
                          </div>

                          <h3 className={`text-base sm:text-lg font-black text-white ${theme.titleHover} transition truncate`}>
                            {displayTitle}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-slate-400 truncate">
                            <span className="flex items-center gap-1 truncate text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dolny pasek pod kreską: grafika LALS po lewej na poziomie oddaj głos */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0 pt-2.5 border-t border-slate-800/70">
                        {/* Lewa strona pod kreską: przejście do rozgrywek oraz do taktyki (spójny układ dla każdego typu) */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isLeagueMatch ? (
                            <>
                              <Link
                                href="/rozgrywki?tab=liga"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-sky-950/80 hover:bg-sky-900/60 text-sky-300 border border-sky-500/40 text-xs font-bold transition shadow-sm group/lals"
                                title="Przejdź do oficjalnego meczu i tabeli LALS w rozgrywkach"
                              >
                                <img
                                  src="/lals_logo.png"
                                  alt="LALS"
                                  className="w-4 h-4 rounded-full object-contain shrink-0 ring-1 ring-sky-400/50 p-0.5 bg-sky-950"
                                />
                                <span className="font-bold text-white group-hover/lals:text-sky-300 transition">
                                  Mecz LALS
                                </span>
                              </Link>

                              <Link
                                href={`/taktyka?eventId=${event.id}&type=MECZ_LIGOWY`}
                                onClick={e => e.stopPropagation()}
                                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-800 hover:border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                                title="Otwórz odprawę taktyczną na ten mecz ligowy"
                              >
                                <Target className="w-3.5 h-3.5 text-sky-400" />
                                <span>Taktyka</span>
                              </Link>
                            </>
                          ) : event.type === 'SPARING' ? (
                            <>
                              <Link
                                href="/rozgrywki?tab=sparingi"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/80 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm group/spar"
                                title="Przejdź do protokołu i sparingów w rozgrywkach"
                              >
                                <Swords className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-bold text-white group-hover/spar:text-amber-300 transition">
                                  Sparing
                                </span>
                              </Link>

                              <Link
                                href={`/taktyka?eventId=${event.id}&type=SPARING`}
                                onClick={e => e.stopPropagation()}
                                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                                title="Otwórz założenia sparingowe i taktykę"
                              >
                                <Target className="w-3.5 h-3.5 text-amber-400" />
                                <span>Taktyka</span>
                              </Link>
                            </>
                          ) : event.type === 'TURNIEJ' ? (
                            <>
                              <Link
                                href="/rozgrywki?tab=turnieje"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 text-xs font-bold transition shadow-sm group/turn"
                                title="Przejdź do modułu turniejowego i drabinki w rozgrywkach"
                              >
                                <Trophy className="w-3.5 h-3.5 text-purple-400" />
                                <span className="font-bold text-white group-hover/turn:text-purple-300 transition">
                                  Turniej
                                </span>
                              </Link>

                              <Link
                                href={`/taktyka?eventId=${event.id}&type=TURNIEJ`}
                                onClick={e => e.stopPropagation()}
                                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                                title="Otwórz założenia turniejowe i taktykę"
                              >
                                <Target className="w-3.5 h-3.5 text-purple-400" />
                                <span>Taktyka</span>
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/taktyka?eventId=${event.id}&type=TRENING`}
                              onClick={e => e.stopPropagation()}
                              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                              title="Otwórz tablicę taktyczną dla tego treningu"
                            >
                              <Target className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Taktyka & Plan Treningu</span>
                            </Link>
                          )}
                        </div>

                        {/* Prawa strona pod kreską: status głosu, edycja i chevron */}
                        <div className="flex items-center gap-2 text-xs">
                          {myAttendance ? (
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                                myAttendance.status === 'BEDE'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                                  : myAttendance.status === 'NIEPEWNE'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {myAttendance.status === 'BEDE' ? '✓ Będę' : myAttendance.status === 'NIEPEWNE' ? '? Niepewny' : '✗ Nieobecny'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>Oddaj głos</span>
                            </span>
                          )}

                          {/* Quick Edit Button on row for managers */}
                          {canManage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-800 transition"
                              title="Edytuj jednostkę"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Expand / Collapse Chevron */}
                          <div
                            className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-all duration-200 ${
                              isExpanded ? 'rotate-180 bg-amber-500/10 text-amber-400 border-amber-500/40' : 'group-hover:text-white group-hover:border-slate-700'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED CONTENT (Szczegóły jednostki po rozwinięciu) */}
                    {isExpanded && (
                      <div className={`p-5 sm:p-7 ${theme.expandedBg} border-t ${theme.expandedBorder} space-y-6 animate-fadeIn`}>
                        {/* Top Management Controls (for coach / manager) */}
                        {canManage && (
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/70">
                            <div className="text-xs text-slate-400">
                              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Zarządzanie Jednostką:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => openEditModal(event)}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                              >
                                <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Edytuj parametry</span>
                              </button>

                              <button
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                                title="Usuń jednostkę"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Oficjalny Banner Meczowy LALS */}
                        {isLeagueMatch && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 via-[#0a1728] to-[#070e1a] border border-sky-400/40 shadow-xl">
                            <div className="flex items-center gap-3.5">
                              <img
                                src="/lals_logo.png"
                                alt="Oficjalne Logo LALS"
                                className="w-12 h-12 rounded-full object-contain shrink-0 shadow-lg ring-2 ring-sky-400/50 p-0.5 bg-sky-950"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black uppercase text-white tracking-wider">
                                    Lubońska Amatorska Liga Siatkówki (LALS)
                                  </h4>
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                    Mecz Ligowy
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-0.5">
                                  Oficjalny pojedynek ligowy. Po meczu sprawdź tabelę punktową, sety i statystyki w module Rozgrywki.
                                </p>
                              </div>
                            </div>
                            <Link
                              href="/rozgrywki"
                              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shrink-0 shadow-md shadow-sky-500/25"
                            >
                              <span>Tabela & Wyniki LALS</span>
                              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            </Link>
                          </div>
                        )}

                        {/* SECTION 1: CZYTELNA ANKIETA OBECNOŚCI DLA WSZYSTKICH (ZAWODNICY + TRENER + SZTAB) */}
                        <div className="p-5 rounded-2xl bg-[#0c1016] border border-slate-800/90 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/70">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-amber-400" />
                                <h4 className="text-xs font-black uppercase text-white tracking-wider">
                                  Ankieta Dostępności na Jednostce
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Obecność zaznaczają <strong>wszyscy (zawodnicy, trener i sztab)</strong>. Zadeklaruj status, aby odblokować taktykę i założenia.
                              </p>
                            </div>

                            {/* Current user vote status badge */}
                            {myAttendance ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Twój wybór: <strong>{myAttendance.status === 'BEDE' ? 'Będę na jednostce' : myAttendance.status === 'NIEPEWNE' ? 'Status: Niepewny' : 'Nie będę obecny'}</strong></span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Wymagany głos w ankiecie!</span>
                              </div>
                            )}
                          </div>

                          {/* 3 Large, modern voting cards */}
                          {isArchiveMode ? (
                            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-2">
                              <Lock className="w-4 h-4 text-amber-400" />
                              <span>Tryb archiwalny: Deklarowanie i zmiana obecności są zablokowane (Tylko do odczytu)</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Option: BEDE */}
                            <button
                              type="button"
                              disabled={submittingAttendanceId === event.id}
                              onClick={() => handleAttendance(event.id, 'BEDE')}
                              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group ${
                                myAttendance?.status === 'BEDE'
                                  ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                                  <CheckCircle2 className={`w-4 h-4 ${myAttendance?.status === 'BEDE' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                                  Będę na 100%
                                </span>
                                {myAttendance?.status === 'BEDE' && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                                    Wybrano
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
                                Potwierdzam gotowość do udziału na hali.
                              </p>
                            </button>

                            {/* Option: NIEPEWNE */}
                            <button
                              type="button"
                              disabled={submittingAttendanceId === event.id}
                              onClick={() => handleAttendance(event.id, 'NIEPEWNE')}
                              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group ${
                                myAttendance?.status === 'NIEPEWNE'
                                  ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/40'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                                  <HelpCircle className={`w-4 h-4 ${myAttendance?.status === 'NIEPEWNE' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                                  Niepewny / Być może
                                </span>
                                {myAttendance?.status === 'NIEPEWNE' && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                                    Wybrano
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
                                Dam znać przed zbiórką (np. praca / korek).
                              </p>
                            </button>

                            {/* Option: NIE_BEDE */}
                            <button
                              type="button"
                              disabled={submittingAttendanceId === event.id}
                              onClick={() => handleAttendance(event.id, 'NIE_BEDE')}
                              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group ${
                                myAttendance?.status === 'NIE_BEDE'
                                  ? 'bg-rose-500/20 border-rose-400 text-white shadow-lg shadow-rose-500/15 ring-2 ring-rose-500/40'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-rose-500/40 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                                  <XCircle className={`w-4 h-4 ${myAttendance?.status === 'NIE_BEDE' ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-400'}`} />
                                  Nie będę obecny
                                </span>
                                {myAttendance?.status === 'NIE_BEDE' && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white">
                                    Wybrano
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
                                Zgłaszam nieobecność (zwolnienie / wyjazd).
                              </p>
                            </button>
                          </div>
                          )}

                          {/* Optional note input toggle */}
                          {!isArchiveMode && (
                          <div className="pt-1">
                            {expandedNoteEventId === event.id ? (
                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-fadeIn">
                                <label className="block text-[11px] font-bold text-slate-300">
                                  Notatka dla trenera (np. będę 15 min później, wychodzę o 21:00):
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={attendanceNotes[event.id] || ''}
                                    onChange={e => setAttendanceNotes({ ...attendanceNotes, [event.id]: e.target.value })}
                                    placeholder="Wpisz treść notatki..."
                                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (myAttendance) {
                                        handleAttendance(event.id, myAttendance.status, attendanceNotes[event.id]);
                                      }
                                      setExpandedNoteEventId(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
                                  >
                                    Zapisz
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedNoteEventId(null)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedNoteEventId(event.id);
                                  if (myAttendance?.note) {
                                    setAttendanceNotes({ ...attendanceNotes, [event.id]: myAttendance.note });
                                  }
                                }}
                                className="text-[11px] text-slate-400 hover:text-amber-400 font-bold transition flex items-center gap-1"
                              >
                                <span>💬 {myAttendance?.note ? `Twoja notatka: "${myAttendance.note}" (kliknij aby edytować)` : '+ Dodaj notatkę do deklaracji'}</span>
                              </button>
                            )}
                          </div>
                          )}

                          {/* TABELA OBECNOŚCI & DEKLARACJI ZAWODNIKÓW (ZAMIAST ZBIORU PIGUŁEK OBOK SIEBIE) */}
                          {(() => {
                            const activeTableFilter = attendanceTableFilter[event.id] || 'ALL';
                            const declaredMap = new Map(event.attendees.map(a => [a.userId, a]));

                            // Build all participants list (Sztab + Zawodnicy)
                            const participantsList = [
                              // 1. Sztab trenerski / kierownik
                              ...event.attendees
                                .filter(a => a.userRole === 'TRENER' || a.userRole === 'KIEROWNIK')
                                .map(a => ({
                                  userId: a.userId,
                                  name: a.userName,
                                  role: a.userRole || 'SZTAB',
                                  number: a.userNumber,
                                  position: a.position || (a.userRole === 'TRENER' ? 'Trener' : 'Kierownik'),
                                  status: a.status as 'BEDE' | 'NIEPEWNE' | 'NIE_BEDE',
                                  note: a.note,
                                  isStaff: true
                                })),
                              // 2. Wszyscy zawodnicy w kadrze
                              ...players.map(player => {
                                const declaration = declaredMap.get(player.id);
                                return {
                                  userId: player.id,
                                  name: player.name,
                                  role: player.role,
                                  number: player.number,
                                  position: player.position || 'Przyjmujący',
                                  status: (declaration ? declaration.status : 'BRAK') as 'BEDE' | 'NIEPEWNE' | 'NIE_BEDE' | 'BRAK',
                                  note: declaration?.note,
                                  isStaff: false
                                };
                              })
                            ];

                            // Filter participants
                            const filteredParticipants = participantsList.filter(p => {
                              if (activeTableFilter === 'ALL') return true;
                              return p.status === activeTableFilter;
                            });

                            // Status ordering for sorting: BEDE -> NIEPEWNE -> NIE_BEDE -> BRAK
                            const statusWeight: Record<string, number> = { BEDE: 1, NIEPEWNE: 2, NIE_BEDE: 3, BRAK: 4 };
                            const sortedTableParticipants = [...filteredParticipants].sort((a, b) => {
                              if (a.isStaff && !b.isStaff) return -1;
                              if (!a.isStaff && b.isStaff) return 1;
                              const wA = statusWeight[a.status] || 5;
                              const wB = statusWeight[b.status] || 5;
                              if (wA !== wB) return wA - wB;
                              return (a.number ?? 99) - (b.number ?? 99);
                            });

                            // Counts for filter pills
                            const countBede = participantsList.filter(p => p.status === 'BEDE').length;
                            const countNiepewne = participantsList.filter(p => p.status === 'NIEPEWNE').length;
                            const countNieBede = participantsList.filter(p => p.status === 'NIE_BEDE').length;
                            const countBrak = participantsList.filter(p => p.status === 'BRAK').length;

                            return (
                              <div className="space-y-3 pt-3 border-t border-slate-800/70">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-sky-400" />
                                      <h5 className="text-xs font-black uppercase text-white tracking-wider">
                                        Tabela Składu & Frekwencji na Jednostce
                                      </h5>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Szczegółowy wykaz każdego zawodnika: numer, pozycja boiskowa, status deklaracji oraz informacja o obecności na hali.
                                    </p>
                                  </div>

                                  {/* Szybkie przełączniki filtrowania tabeli */}
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setAttendanceTableFilter(prev => ({ ...prev, [event.id]: 'ALL' }))}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                                        activeTableFilter === 'ALL'
                                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-black shadow-sm'
                                          : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white'
                                      }`}
                                    >
                                      Wszyscy ({participantsList.length})
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setAttendanceTableFilter(prev => ({ ...prev, [event.id]: 'BEDE' }))}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                                        activeTableFilter === 'BEDE'
                                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/70'
                                      }`}
                                    >
                                      ✓ Obecni ({countBede})
                                    </button>

                                    {countNiepewne > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceTableFilter(prev => ({ ...prev, [event.id]: 'NIEPEWNE' }))}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                                          activeTableFilter === 'NIEPEWNE'
                                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                                            : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-950/70'
                                        }`}
                                      >
                                        ? Niepewni ({countNiepewne})
                                      </button>
                                    )}

                                    {countNieBede > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceTableFilter(prev => ({ ...prev, [event.id]: 'NIE_BEDE' }))}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                                          activeTableFilter === 'NIE_BEDE'
                                            ? 'bg-rose-500 text-white border-rose-400 font-black shadow-sm'
                                            : 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-950/70'
                                        }`}
                                      >
                                        ✗ Nieobecni ({countNieBede})
                                      </button>
                                    )}

                                    {countBrak > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setAttendanceTableFilter(prev => ({ ...prev, [event.id]: 'BRAK' }))}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                                          activeTableFilter === 'BRAK'
                                            ? 'bg-slate-400 text-slate-950 border-slate-300 font-black shadow-sm'
                                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-300'
                                        }`}
                                      >
                                        ⏳ Brak odpowiedzi ({countBrak})
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Responsywna Tabela */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-800/90 bg-[#070b10] shadow-xl">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        <th className="py-2.5 px-3 w-12 text-center">Nr</th>
                                        <th className="py-2.5 px-3">Zawodnik / Członek Sztabu</th>
                                        <th className="py-2.5 px-3">Pozycja Boiskowa</th>
                                        <th className="py-2.5 px-3">Status w Ankiecie</th>
                                        <th className="py-2.5 px-3">Notatka / Komentarz</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {sortedTableParticipants.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                                            Brak osób w wybranym filtrze tabeli.
                                          </td>
                                        </tr>
                                      ) : (
                                        sortedTableParticipants.map((p) => {
                                          const rowHighlight =
                                            p.status === 'BEDE'
                                              ? 'hover:bg-emerald-950/20'
                                              : p.status === 'NIEPEWNE'
                                              ? 'hover:bg-amber-950/20'
                                              : p.status === 'NIE_BEDE'
                                              ? 'hover:bg-rose-950/20 opacity-80'
                                              : 'hover:bg-slate-900/30 opacity-60';

                                          return (
                                            <tr key={p.userId} className={`transition-colors ${rowHighlight}`}>
                                              {/* Nr koszulki */}
                                              <td className="py-2.5 px-3 text-center">
                                                {p.number ? (
                                                  <span className="inline-block px-1.5 py-0.5 rounded font-mono font-black text-[11px] bg-slate-900 border border-slate-800 text-amber-400">
                                                    #{p.number}
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-600 font-mono text-[11px]">—</span>
                                                )}
                                              </td>

                                              {/* Imię i Nazwisko */}
                                              <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-white text-xs">
                                                    {p.name}
                                                  </span>
                                                  {p.isStaff && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                                      {p.role === 'TRENER' ? 'Trener' : 'Kierownik'}
                                                    </span>
                                                  )}
                                                  {p.userId === user?.id && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                      Ty
                                                    </span>
                                                  )}
                                                </div>
                                              </td>

                                              {/* Pozycja */}
                                              <td className="py-2.5 px-3">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getPositionBadgeStyle(p.position)}`}>
                                                  {p.position}
                                                </span>
                                              </td>

                                              {/* Deklaracja w ankiecie */}
                                              <td className="py-2.5 px-3">
                                                {p.status === 'BEDE' ? (
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>Będę na 100%</span>
                                                  </span>
                                                ) : p.status === 'NIEPEWNE' ? (
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                                                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                                                    <span>Niepewny</span>
                                                  </span>
                                                ) : p.status === 'NIE_BEDE' ? (
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40">
                                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                                    <span>Nieobecny</span>
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-900 text-slate-500 border border-slate-800">
                                                    <span>Brak odpowiedzi</span>
                                                  </span>
                                                )}
                                              </td>

                                              {/* Notatka */}
                                              <td className="py-2.5 px-3">
                                                {p.note ? (
                                                  <span className="text-[11px] text-amber-200/90 italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block max-w-[220px] truncate" title={p.note}>
                                                    💬 {p.note}
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-600 text-xs">—</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* SECTION 2: WSKAŹNIK IDEALNEGO SKŁADU NA TRENING (14 GRACZY: 4P, 4Ś, 2A, 2R, 2L) */}
                        <div className="p-5 rounded-2xl bg-[#0a0f18] border border-slate-800 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-sky-400" />
                                <h4 className="text-xs font-black uppercase text-white tracking-wider">
                                  Bilans Pozycji na Treningu (Idealnie: 14 Graczy do Gry 6x6)
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Cel do rozegrania pełnego meczu treningowego z dwiema szóstkami: <strong>4 Przyjmujących, 4 Środkowych, 2 Atakujących, 2 Rozgrywających, 2 Libero</strong>.
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black border ${
                                posBalance.isFull
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                  : 'bg-slate-900 text-slate-300 border-slate-800'
                              }`}>
                                {posBalance.totalConfirmed} / 14 potwierdzonych
                              </span>
                            </div>
                          </div>

                          {/* 5 Position Balance Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            {posBalance.positions.map(p => {
                              const isComplete = p.confirmed.length >= p.target;
                              const missingCount = Math.max(0, p.target - p.confirmed.length);

                              return (
                                <div
                                  key={p.code}
                                  className={`p-3 rounded-2xl border transition flex flex-col justify-between gap-2 ${
                                    isComplete
                                      ? 'bg-emerald-950/25 border-emerald-500/40 text-white'
                                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                        {p.name}
                                      </span>
                                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${p.badgeBg}`}>
                                        {p.code}
                                      </span>
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xl font-mono font-black text-white">
                                        {p.confirmed.length}
                                      </span>
                                      <span className="text-xs text-slate-500 font-mono">
                                        /{p.target}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-[11px] pt-1 border-t border-slate-800/60">
                                    {isComplete ? (
                                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Komplet
                                      </span>
                                    ) : (
                                      <span className="text-amber-400 font-bold">
                                        Brakuje: {missingCount}
                                      </span>
                                    )}
                                  </div>

                                  {/* Confirmed list on this position */}
                                  {p.confirmed.length > 0 && (
                                    <div className="text-[10px] text-slate-400 space-y-0.5 truncate">
                                      {p.confirmed.map(c => (
                                        <div key={c.id} className="truncate text-slate-300">
                                          • {c.number ? `#${c.number} ` : ''}{c.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Summary Banner */}
                          <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            posBalance.isFull
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}>
                            <span className="font-medium">
                              {posBalance.isFull
                                ? '✓ Idealne warunki do treningu: Mamy komplet na dwie pełne szóstki (6 na 6 z libero)!'
                                : `⚠️ Stan składu: Brakuje jeszcze ${14 - posBalance.totalConfirmed} zawodników (${posBalance.missingPositions.join(', ')}), aby stworzyć dwie pełne szóstki.`}
                            </span>
                          </div>
                        </div>

                        {/* SECTION 3: ZAŁOŻENIA TAKTYCZNE & PRZEKIEROWANIA (VOTE-TO-UNLOCK GATE) */}
                        <div className="p-5 rounded-2xl bg-[#0c1016] border border-slate-800/90 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-sky-400" />
                              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                                Założenia Taktyczne & Przekierowanie do Modułów
                              </h4>
                            </div>

                            {isUnlocked ? (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Unlock className="w-3 h-3 text-emerald-400" />
                                Odblokowane (Głos oddany)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-400" />
                                Zablokowane do czasu głosu
                              </span>
                            )}
                          </div>

                          {/* IF NOT UNLOCKED: SHOW LOCK BANNER (GATE) */}
                          {!isUnlocked ? (
                            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-[#090d14] p-6 text-center space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10 animate-bounce">
                                <Lock className="w-6 h-6" />
                              </div>
                              <h5 className="text-base font-black text-white uppercase tracking-tight">
                                Założenia taktyczne i playbook są ukryte
                              </h5>
                              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                                Aby zobaczyć założenia taktyczne trenera, schematy gry oraz przejść do tablicy playbooka, <strong>musisz najpierw oddać głos w ankiecie powyżej</strong> (wystarczy kliknąć: <em>Będę</em>, <em>Niepewny</em> lub <em>Nie będę</em>).
                              </p>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => setStaffBypassLock(prev => ({ ...prev, [event.id]: true }))}
                                  className="text-[11px] text-sky-400 hover:underline font-bold pt-1 block mx-auto"
                                >
                                  Omiń blokadę (Podgląd sztabowy)
                                </button>
                              )}
                            </div>
                          ) : (
                            /* IF UNLOCKED: SHOW FULL DETAILS AND DIRECT MODULE REDIRECTS */
                            <div className="space-y-4 animate-fadeIn">
                              {/* Event Description & Assumptions */}
                              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                                <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                  Plan & Wytyczne Trenerskie:
                                </div>
                                {event.description ? (
                                  <p className="leading-relaxed text-slate-200 whitespace-pre-line">{event.description}</p>
                                ) : (
                                  <p className="italic text-slate-500">Brak dodatkowych wytycznych tekstowych. Sprawdź tablicę taktyczną poniżej.</p>
                                )}
                              </div>

                              {/* Saved Linked Tactics to this Event */}
                              {(() => {
                                const linkedTactics = tactics.filter(
                                  t => t.eventId === event.id || (isLeagueMatch && (t.eventId === event.id || t.scope === 'MECZ_LIGOWY'))
                                );
                                if (linkedTactics.length === 0) return null;
                                return (
                                  <div className="space-y-2 pt-1 pb-2">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                                      <span>📸 Zapisane Zrzuty Taktyczne do tej Jednostki ({linkedTactics.length}):</span>
                                      <Link
                                        href={`/taktyka?eventId=${event.id}&type=${isLeagueMatch ? 'MECZ_LIGOWY' : event.type}`}
                                        className="text-[11px] text-sky-400 hover:text-white font-bold flex items-center gap-1"
                                      >
                                        <span>Otwórz tablicę</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </Link>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {linkedTactics.map(tac => (
                                        <div key={tac.id} className="p-3 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-2 transition shadow-md">
                                          <div className="flex items-center justify-between">
                                            <span className="font-black text-xs text-white truncate max-w-[200px]">{tac.title}</span>
                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                                              {tac.rotation} • {tac.phase}
                                            </span>
                                          </div>
                                          {tac.drawingData && (
                                            <div className="aspect-[16/9] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 max-h-28">
                                              <img src={tac.drawingData} alt={tac.title} className="w-full h-full object-contain" />
                                            </div>
                                          )}
                                          {tac.description && (
                                            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                                              {tac.description}
                                            </p>
                                          )}
                                          <Link
                                            href={`/taktyka?eventId=${event.id}&tacticId=${tac.id}`}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 pt-1"
                                          >
                                            <span>Załaduj ten zrzut na tablicę</span>
                                            <ArrowRight className="w-3 h-3" />
                                          </Link>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* DIRECT REDIRECT CARDS BASED ON EVENT TYPE */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {isLeagueMatch ? (
                                  <>
                                    <Link
                                      href={`/taktyka?eventId=${event.id}&type=MECZ_LIGOWY`}
                                      className="p-4 rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/40 to-slate-900/90 hover:border-sky-400 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center p-0.5">
                                            <img src="/lals_logo.png" alt="LALS" className="w-5 h-5 rounded-full object-contain" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-sky-300">
                                            Odprawa Taktyczna LALS
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Rywal: {cleanOpponent || 'Przeciwnik'} • Serwis w strefę 1/5 & schemat bloku.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href="/rozgrywki"
                                      className="p-4 rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/90 hover:border-slate-500 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center">
                                            <Trophy className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                            Tabela & Wyniki LALS
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Aktualna tabela Lubońskiej Amatorskiej Ligi Siatkówki i bilans setów.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>
                                  </>
                                ) : event.type === 'TRENING' ? (
                                  <>
                                    <Link
                                      href={`/taktyka?eventId=${event.id}&type=TRENING`}
                                      className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-900/90 hover:border-emerald-400 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                            <Target className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                                            Tablica Taktyczna & Schematy 5-1
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Zadania dla pozycji, zgranie szóstki i wstawienie potwierdzonych graczy.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href={`/taktyka?eventId=${event.id}&type=TRENING`}
                                      className="p-4 rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/90 hover:border-slate-500 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center">
                                            <Layers className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                            Wytyczne & Ćwiczenia Pozycyjne
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Rozkład zadań dla przyjmujących, środkowych, atakujących i libero.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>
                                  </>
                                ) : event.type === 'SPARING' ? (
                                  <>
                                    <Link
                                      href={`/taktyka?eventId=${event.id}&type=SPARING`}
                                      className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900/90 hover:border-amber-400 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                            <Swords className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                                            Plan Taktyczny na Sparing
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Rywal: {event.opponent || 'Przeciwnik'} • Założenia na blok i test szóstki.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href="/rozgrywki"
                                      className="p-4 rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/90 hover:border-slate-500 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center">
                                            <Trophy className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                            Centrum Rozgrywek & Wyniki
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Protokoły meczowe, tabele i historia sparingów zespołu.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href="/rozgrywki"
                                      className="p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-slate-900/90 hover:border-purple-400 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                            <Trophy className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                                            Moduł Turniejowy & Drabinka
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Faza grupowa, terminarz spotkań turniejowych i wyniki na żywo.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href={`/taktyka?eventId=${event.id}&type=TURNIEJ`}
                                      className="p-4 rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/90 hover:border-slate-500 text-white transition-all flex items-center justify-between group shadow-lg"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center">
                                            <Target className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                            Taktyka & Zestawienie Turniejowe
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                          Rotacja zawodników i dyspozycja na cały turniej.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls for Events */}
          {totalEventsPages > 1 && (
            <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div className="text-xs text-slate-400">
                Wyświetlanie <strong className="text-white">{(eventsPage - 1) * EVENTS_PER_PAGE + 1}–{Math.min(eventsPage * EVENTS_PER_PAGE, filteredEvents.length)}</strong> z <strong className="text-white">{filteredEvents.length}</strong> jednostek
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                  disabled={eventsPage === 1}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Poprzednia</span>
                </button>
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalEventsPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setEventsPage(p)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition border ${
                        eventsPage === p
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setEventsPage(p => Math.min(totalEventsPages, p + 1))}
                  disabled={eventsPage === totalEventsPages}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold"
                >
                  <span>Następna</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>




          {/* MODAL 2: Nowa Jednostka (Trening / Sparing / Turniej) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Zaplanuj Nową Jednostkę
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              {/* Type selection */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Typ jednostki</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'TRENING', label: '🏐 Trening' },
                    { id: 'SPARING', label: '⚔️ Sparing' },
                    { id: 'MECZ', label: '🔵 Mecz LALS' },
                    { id: 'TURNIEJ', label: '🏆 Turniej' }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setNewEventType(t.id as EventType)}
                      className={`py-2 px-3 rounded-xl font-bold transition border ${
                        newEventType === t.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-bold">Tytuł jednostki</label>
                  {newEventType === 'TRENING' && (
                    <div className="flex gap-1">
                      {['Przyjęcie & blok', 'System 5-1', 'Motoryka'].map(preset => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setNewEventTitle(`Trening: ${preset}`)}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  )}
                  {newEventType === 'SPARING' && (
                    <div className="flex gap-1">
                      {['Mecz ligowy LALS', 'Sparing kontrolny'].map(preset => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => {
                            setNewEventTitle(preset);
                            if (preset.includes('LALS')) {
                              setNewEventLocation('Hala OSiR Luboń, ul. Kołłątaja 2');
                            }
                          }}
                          className="text-[10px] text-sky-400 hover:underline"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder={newEventType === 'TRENING' ? 'np. Trening techniczno-taktyczny' : 'np. Sparing kontrolny'}
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Opponent (if Sparing, Tournament, or Match) */}
              {(newEventType === 'SPARING' || newEventType === 'TURNIEJ' || newEventType === 'MECZ') && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rywal / Zaproszone zespoły</label>
                  <input
                    type="text"
                    placeholder="np. KS Metro Warszawa, Trefl Gdańsk II"
                    value={newEventOpponent}
                    onChange={e => setNewEventOpponent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Data i godzina</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Lokalizacja (Hala)</label>
                  <input
                    type="text"
                    required
                    value={newEventLocation}
                    onChange={e => setNewEventLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Założenia / Opis jednostki</label>
                <textarea
                  rows={2}
                  placeholder="Cele treningowe, plan taktyczny lub wytyczne zbiórki..."
                  value={newEventDescription}
                  onChange={e => setNewEventDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Cost (Tournament only) */}
              {newEventType === 'TURNIEJ' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Koszt wpisowego na zawodnika (zł)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="np. 50"
                    value={newEventCost}
                    onChange={e => setNewEventCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                >
                  {creating ? 'Zapisywanie...' : 'Utwórz jednostkę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2b: Edycja Istniejącej Jednostki */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                Edycja Jednostki
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-white font-black text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4 text-xs">
              {/* Typ jednostki */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Typ jednostki</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'TRENING', label: '🏐 Trening' },
                    { id: 'SPARING', label: '⚔️ Sparing' },
                    { id: 'MECZ', label: '🔵 Mecz LALS' },
                    { id: 'TURNIEJ', label: '🏆 Turniej' }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setEditType(t.id as EventType)}
                      className={`py-2 px-3 rounded-xl font-bold transition border ${
                        editType === t.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tytuł jednostki */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tytuł jednostki</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Rywal (opcjonalny dla sparingu, meczu i turnieju) */}
              {(editType === 'SPARING' || editType === 'TURNIEJ' || editType === 'MECZ') && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rywal / Przeciwnik</label>
                  <input
                    type="text"
                    value={editOpponent}
                    onChange={e => setEditOpponent(e.target.value)}
                    placeholder="np. KS Sobieski Poznań"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Data i Godzina oraz Miejsce */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Data i godzina</label>
                  <input
                    type="datetime-local"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status jednostki</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as EventStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ANKIETA">Ankieta w toku (Głosowanie zawodników)</option>
                    <option value="WERYFIKACJA">Weryfikacja obecności</option>
                    <option value="ZAKONCZONY">Zakończony (Obecność potwierdzona)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Hala / Lokalizacja</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Koszt składki */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Składka / Koszt od zawodnika (zł, 0 jeśli bez opłaty)</label>
                <input
                  type="number"
                  min="0"
                  value={editCost}
                  onChange={e => setEditCost(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Opis / Założenia */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Założenia / Opis jednostki</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Plan taktyczny, cele treningowe, zbiórka..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                >
                  {savingEdit ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Coach Note Editor on Player */}
      {editingPlayerNote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                Notatka Trenera: {editingPlayerNote.name}
              </h3>
              <button
                onClick={() => setEditingPlayerNote(null)}
                className="text-slate-400 hover:text-white font-black"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Wpisz uwagi dotyczące frekwencji, zaangażowania lub usprawiedliwionych nieobecności zawodnika.
            </p>

            <textarea
              rows={4}
              value={editingPlayerNote.note}
              onChange={e => setEditingPlayerNote({ ...editingPlayerNote, note: e.target.value })}
              placeholder="np. Zgłasza delegacje służbowe, wzorowa punktualność, gotowość do gry..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-400"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingPlayerNote(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveCoachNote}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black"
              >
                Zapisz notatkę
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventsAttendancePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 text-sm">Ładowanie terminarza i frekwencji...</div>}>
      <EventsAttendanceContent />
    </Suspense>
  );
}
