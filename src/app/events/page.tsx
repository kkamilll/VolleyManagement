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
  Volleyball,
  ArrowRight,
  FileText
} from 'lucide-react';
import {
  EventItem,
  User,
  AttendanceStatus,
  EventType,
  EventStatus,
  TacticalPlay,
  LeagueMatchReport,
  MatchResult
} from '@/lib/types';
import { TeamCrestBadge } from '@/lib/team-crests';
import { getGoogleMapsUrl } from '@/lib/maps';

function EventsAttendanceContent() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');

  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tactics, setTactics] = useState<TacticalPlay[]>([]);
  const [leagueReports, setLeagueReports] = useState<LeagueMatchReport[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const queryTypeParam = searchParams.get('type');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>(() => {
    if (queryTypeParam && ['TRENING', 'SPARING', 'MECZ_LALS', 'TURNIEJ'].includes(queryTypeParam.toUpperCase())) {
      return queryTypeParam.toUpperCase();
    }
    return 'ALL';
  });
  const [filterTime, setFilterTime] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (queryTypeParam) {
      const up = queryTypeParam.toUpperCase();
      if (['ALL', 'TRENING', 'SPARING', 'MECZ_LALS', 'TURNIEJ'].includes(up)) {
        setFilterType(up);
      }
    }
  }, [queryTypeParam]);

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
  const [newEventLocationUrl, setNewEventLocationUrl] = useState('');
  const [newEventOpponent, setNewEventOpponent] = useState('');
  const [newEventOpponentLogo, setNewEventOpponentLogo] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventCost, setNewEventCost] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Event Form State
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<EventType>('TRENING');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLocationUrl, setEditLocationUrl] = useState('');
  const [editOpponent, setEditOpponent] = useState('');
  const [editOpponentLogo, setEditOpponentLogo] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editStatus, setEditStatus] = useState<EventStatus>('ANKIETA');
  const [savingEdit, setSavingEdit] = useState(false);

  // Helper do kompresji herbu drużyny z pliku
  const handleOpponentLogoUpload = (file: File, callback: (dataUrl: string) => void) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/png'));
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Note editor modal for coach on player
  const [editingPlayerNote, setEditingPlayerNote] = useState<{ userId: string; name: string; note: string } | null>(null);

  // Voting note input state
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [expandedNoteEventId, setExpandedNoteEventId] = useState<string | null>(null);
  const [submittingAttendanceId, setSubmittingAttendanceId] = useState<string | null>(null);
  const [staffBypassLock, setStaffBypassLock] = useState<Record<string, boolean>>({});
  // Post-match coach notes state
  const [editingCoachNoteEventId, setEditingCoachNoteEventId] = useState<string | null>(null);
  const [coachNoteText, setCoachNoteText] = useState<string>('');
  const [savingCoachNote, setSavingCoachNote] = useState<boolean>(false);
  // Tabela obecności: filtr dla każdego wydarzenia (ALL, BEDE, NIEPEWNE, NIE_BEDE, BRAK)
  const [attendanceTableFilter, setAttendanceTableFilter] = useState<Record<string, 'ALL' | 'BEDE' | 'NIEPEWNE' | 'NIE_BEDE' | 'BRAK'>>({});

  // Widok: 'list' (tradycyjna lista) lub 'calendar' (interaktywny kalendarz miesięczny)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const { isArchiveMode } = useSeasonArchive();
  const canManage = Boolean(
    !isArchiveMode && user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain)
  );
  const isCoach = user?.role === 'TRENER' || user?.role === 'KIEROWNIK';

  const getPositionBadgeStyle = (position?: string) => {
    if (!position) return 'bg-slate-100 text-slate-600 border-slate-200';
    const pos = position.toLowerCase();
    if (pos.includes('przyjmu') || pos === 'p') {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (pos.includes('środkow') || pos.includes('srodkow') || pos === 'ś' || pos === 's') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (pos.includes('atakuj') || pos === 'a') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (pos.includes('rozgryw') || pos === 'r') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (pos.includes('libero') || pos === 'l') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (pos.includes('trener') || pos.includes('kierownik')) {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
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
      const [eventsRes, usersRes, tacticsRes, reportsRes, matchesRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/users'),
        fetch('/api/tactics'),
        fetch('/api/league-reports'),
        fetch('/api/matches')
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
      if (reportsRes.ok) {
        const r = await reportsRes.json();
        setLeagueReports(r.reports || []);
      }
      if (matchesRes.ok) {
        const m = await matchesRes.json();
        setMatches(m.matches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Match event to VolleyStation match report and results
  const getEventMatchInfo = (event: EventItem) => {
    // 1. Direct match by eventId
    let match = matches.find(m => (m as any).eventId === event.id);

    // 2. Match by round or opponent in title
    if (!match) {
      match = matches.find(m => {
        if (m.round && event.title && (
          event.title.includes(`(R${m.round})`) ||
          event.title.includes(`(R0${m.round})`) ||
          event.title.includes(`Runda ${m.round}`) ||
          event.title.includes(`R${m.round}:`)
        )) {
          return true;
        }
        if (m.opponent && event.opponent && m.opponent.toLowerCase().trim() === event.opponent.toLowerCase().trim()) {
          return true;
        }
        return false;
      });
    }

    // 3. Find corresponding VolleyStation report
    let report = leagueReports.find(r => {
      if (match && (r.matchId === match.id || r.id === match.id)) return true;
      if (r.round && event.title && (
        event.title.includes(`(R${r.round})`) ||
        event.title.includes(`(R0${r.round})`) ||
        event.title.includes(`Runda ${r.round}`) ||
        event.title.includes(`R${r.round}:`)
      )) {
        return true;
      }
      if (event.opponent && (
        r.matchTitle.toLowerCase().includes(event.opponent.toLowerCase()) ||
        r.homeTeam?.teamName?.toLowerCase().includes(event.opponent.toLowerCase()) ||
        r.awayTeam?.teamName?.toLowerCase().includes(event.opponent.toLowerCase())
      )) {
        return true;
      }
      return false;
    });

    const isOurTeamHome = report?.homeTeam?.teamName?.toLowerCase().includes('angel');
    const isOurTeamAway = report?.awayTeam?.teamName?.toLowerCase().includes('angel');
    const ourSetsWon = report 
      ? (isOurTeamHome ? report.homeSetsWon : isOurTeamAway ? report.awaySetsWon : match?.teamSetsWon)
      : match?.teamSetsWon;
    const oppSetsWon = report 
      ? (isOurTeamHome ? report.awaySetsWon : isOurTeamAway ? report.homeSetsWon : match?.opponentSetsWon)
      : match?.opponentSetsWon;
    const isWin = ourSetsWon !== undefined && oppSetsWon !== undefined ? ourSetsWon > oppSetsWon : undefined;
    const setsStr = report?.sets && report.sets.length > 0
      ? report.sets.map(s => `${s.homeScore}:${s.awayScore}`).join(', ')
      : match?.sets && match.sets.length > 0
      ? match.sets.map(s => `${s.teamScore}:${s.opponentScore}`).join(', ')
      : undefined;
    const mvp = report?.mvp?.name || match?.mvp;
    const duration = report?.duration;
    const volleyStationUrl = report?.volleyStationUrl || match?.url;

    return {
      match,
      report,
      ourSetsWon,
      oppSetsWon,
      isWin,
      setsStr,
      mvp,
      duration,
      volleyStationUrl
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-expand and scroll to event if eventId query param is present
  useEffect(() => {
    if (queryEventId && events.length > 0) {
      const target = events.find(e => e.id === queryEventId);
      if (target) {
        setFilterType('ALL');
        setFilterTime('ALL');
        setSearchQuery('');
        setExpandedEventId(queryEventId);
        setTimeout(() => {
          const el = document.getElementById(`event_${queryEventId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      }
    }
  }, [queryEventId, events]);

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
    }).sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      const now = Date.now() - 3600000 * 2; // 2 hour buffer for events in progress

      if (filterTime === 'UPCOMING') {
        // Nearest upcoming first
        return timeA - timeB;
      }
      if (filterTime === 'PAST') {
        // Most recent past first
        return timeB - timeA;
      }

      // Default filterTime === 'ALL':
      // Group upcoming events first in chronological order (nearest first),
      // followed by past events in reverse chronological order (most recent first)
      const isUpcomingA = timeA >= now;
      const isUpcomingB = timeB >= now;

      if (isUpcomingA && !isUpcomingB) return -1;
      if (!isUpcomingA && isUpcomingB) return 1;

      if (isUpcomingA && isUpcomingB) {
        return timeA - timeB;
      }
      return timeB - timeA;
    });
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
  const [eventsPerPage, setEventsPerPage] = useState(20);

  useEffect(() => {
    setEventsPage(1);
  }, [filterType, filterTime, searchQuery, eventsPerPage]);

  const totalEventsPages = Math.ceil(filteredEvents.length / eventsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (eventsPage - 1) * eventsPerPage;
    return filteredEvents.slice(start, start + eventsPerPage);
  }, [filteredEvents, eventsPage, eventsPerPage]);

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
    const targetEvt = events.find(e => e.id === eventId);
    const isPast = targetEvt ? (targetEvt.status === 'ZAKONCZONY' || new Date(targetEvt.date).getTime() < Date.now()) : false;
    if (isPast && !canManage) {
      alert('Termin tego wydarzenia już minął. Głosowanie na obecność zostało zamknięte.');
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
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu obecności');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAttendanceId(null);
    }
  };

  // 1b. Save Coach Post-Match Note
  const handleSavePostMatchNote = async (eventId: string) => {
    setSavingCoachNote(true);
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          coachPostMatchNote: coachNoteText
        })
      });
      if (res.ok) {
        setEditingCoachNoteEventId(null);
        await fetchData();
        alert('Notatka pomeczowa trenera została pomyślnie zapisana!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu notatki pomeczowej');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas zapisywania');
    } finally {
      setSavingCoachNote(false);
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
          locationUrl: newEventLocationUrl ? newEventLocationUrl.trim() : undefined,
          opponent: newEventOpponent ? newEventOpponent.trim() : undefined,
          opponentLogo: newEventOpponentLogo ? newEventOpponentLogo.trim() : undefined,
          description: newEventDescription ? newEventDescription.trim() : undefined,
          costPerPerson: newEventCost ? Number(newEventCost) : undefined
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewEventTitle('');
        setNewEventLocationUrl('');
        setNewEventDescription('');
        setNewEventOpponent('');
        setNewEventOpponentLogo('');
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
    setEditLocationUrl(event.locationUrl || '');
    setEditOpponent(event.opponent || '');
    setEditOpponentLogo(event.opponentLogo || '');
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
          locationUrl: editLocationUrl.trim(),
          opponent: editOpponent.trim() || undefined,
          opponentLogo: editOpponentLogo.trim() || undefined,
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

  // Kalendarz miesięczny - obliczenia dni i wydarzeń
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const monthNamesPl = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];
  const dayNamesPl = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    events.forEach(evt => {
      try {
        const d = evt.date.slice(0, 10);
        if (!map[d]) map[d] = [];
        map[d].push(evt);
      } catch {}
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfWeek = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: EventItem[];
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(calendarYear, calendarMonth - 1, dNum);
      const mm = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dd = String(prevDate.getDate()).padStart(2, '0');
      const dStr = `${prevDate.getFullYear()}-${mm}-${dd}`;
      days.push({
        dateString: dStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        events: eventsByDate[dStr] || []
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(calendarMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dStr = `${calendarYear}-${mm}-${dd}`;
      days.push({
        dateString: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        events: eventsByDate[dStr] || []
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(calendarYear, calendarMonth + 1, i);
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      const dStr = `${nextDate.getFullYear()}-${mm}-${dd}`;
      days.push({
        dateString: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        events: eventsByDate[dStr] || []
      });
    }

    return days;
  }, [calendarYear, calendarMonth, eventsByDate]);

  const selectedDayEvents = eventsByDate[selectedCalendarDate] || [];

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8 pb-28 md:pb-16 space-y-6 sm:space-y-8">
      {/* 1. Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-athletic whitespace-nowrap">
                  Terminarz & Frekwencja
                </h1>
                {isCoach && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
                    Trener
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls: View Switcher + Primary Action Button */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-auto flex-nowrap">
          {/* Przełącznik widoku: Lista vs Kalendarz */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kalendarz</span>
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-black text-xs uppercase tracking-wider transition shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3] text-amber-400" />
              <span className="sm:hidden">Dodaj</span>
              <span className="hidden sm:inline">Nowa Jednostka</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminarz & Dziennik Obecności */}
      <div className="space-y-6">

        {/* Szybki, zawsze widoczny pasek przełączania kategorii i czasu */}
          <div className="space-y-2.5">
            <div className="p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/90 shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'ALL', label: 'Wszystkie' },
                  { id: 'MECZ_LALS', label: 'Mecze LALS' },
                  { id: 'TRENING', label: 'Treningi' },
                  { id: 'SPARING', label: 'Sparingi' },
                  { id: 'TURNIEJ', label: 'Turnieje' }
                ].map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilterType(t.id)}
                    className={`${idx === 0 ? 'col-span-2 sm:col-span-1' : ''} h-10 px-3 rounded-xl text-xs sm:text-sm font-bold transition border flex items-center justify-center cursor-pointer active:scale-95 ${
                      filterType === t.id
                        ? 'bg-slate-900 text-amber-400 border-slate-800 font-black shadow-xs'
                        : 'bg-white/90 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:bg-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'Wszystkie' },
                  { id: 'UPCOMING', label: 'Nadchodzące' },
                  { id: 'PAST', label: 'Zakończone' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilterTime(t.id as any)}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition border cursor-pointer active:scale-95 ${
                      filterTime === t.id
                        ? 'bg-slate-900 text-amber-400 border-slate-800 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('ALL');
                      setFilterTime('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    Resetuj
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
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Widok Kalendarza vs Lista */}
          {viewMode === 'calendar' ? (
            <div className="space-y-6">
              {/* Calendar Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6 text-slate-800">
                {/* Month Navigation Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                        {monthNamesPl[calendarMonth]} <span className="text-sky-600">{calendarYear}</span>
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                      title="Poprzedni miesiąc"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setCalendarDate(now);
                        setSelectedCalendarDate(now.toISOString().slice(0, 10));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                    >
                      Dziś
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                      title="Następny miesiąc"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Names */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                  {dayNamesPl.map((dName, idx) => (
                    <div
                      key={dName}
                      className={`py-2 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-lg ${
                        idx >= 5 ? 'text-sky-700 bg-sky-50' : 'text-slate-600 bg-slate-100/80'
                      }`}
                    >
                      {dName}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarDays.map(day => {
                    const isSelected = selectedCalendarDate === day.dateString;
                    const hasEvents = day.events.length > 0;
                    return (
                      <button
                        key={day.dateString}
                        type="button"
                        onClick={() => setSelectedCalendarDate(day.dateString)}
                        className={`min-h-[70px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-xl text-left transition flex flex-col justify-between border relative group ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50 shadow-sm ring-1 ring-sky-400'
                            : day.isToday
                            ? 'border-amber-400 bg-amber-50/50'
                            : day.isCurrentMonth
                            ? 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50 shadow-sm'
                            : 'border-slate-100 bg-slate-50/50 opacity-40 hover:opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              isSelected
                                ? 'text-sky-700 font-black'
                                : day.isToday
                                ? 'w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs'
                                : day.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                          {hasEvents && (
                            <span className="w-2 h-2 rounded-full bg-sky-600 sm:hidden"></span>
                          )}
                        </div>

                        {/* Event pills on desktop */}
                        <div className="hidden sm:flex flex-col gap-1 w-full mt-1">
                          {day.events.slice(0, 2).map(evt => {
                            const badgeColor =
                              evt.type === 'TRENING'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : evt.type === 'MECZ'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : evt.type === 'SPARING'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200';
                            return (
                              <div
                                key={evt.id}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate border ${badgeColor}`}
                                title={evt.title}
                              >
                                {evt.date.slice(11, 16)} {evt.type === 'MECZ' ? (evt.opponent ? `vs ${evt.opponent}` : 'Mecz') : evt.type}
                              </div>
                            );
                          })}
                          {day.events.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-bold pl-1">
                              +{day.events.length - 2} więcej
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-200 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Trening</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span>Mecz Ligowy LALS</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Sparing</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>Turniej</span>
                  </span>
                </div>
              </div>

              {/* Selected Day Event Drawer */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <span>Wydarzenia w dniu:</span>
                      <span className="text-sky-600">{selectedCalendarDate}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedDayEvents.length === 0
                        ? 'Brak zaplanowanych jednostek w tym terminie.'
                        : `Znaleziono jednostek: ${selectedDayEvents.length}`}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewEventDate(`${selectedCalendarDate}T19:30`);
                        setShowCreateModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 w-fit shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Zaplanuj na ten dzień</span>
                    </button>
                  )}
                </div>

                {selectedDayEvents.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-sm text-slate-500">W tym dniu drużyna ma wolne od oficjalnych jednostek.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDayEvents.map(event => {
                      const yesAttendees = event.attendees.filter(a => a.status === 'BEDE' && (a.userRole === 'ZAWODNIK' || a.userNumber));
                      const myAttendance = event.attendees.find(a => a.userId === user?.id);

                      const isCalLeagueMatch = Boolean(
                        (event.type as string) === 'MECZ' ||
                        event.title.toLowerCase().includes('mecz ligow') ||
                        event.title.toLowerCase().includes('lals') ||
                        (event.opponent && event.title.toLowerCase().includes('liga'))
                      );
                      const calCleanOpponent = event.opponent?.trim();
                      const calTactics = tactics.filter(
                        t => t.eventId === event.id || 
                             t.matchId === event.id ||
                             Boolean(calCleanOpponent && t.targetOpponent && t.targetOpponent.toLowerCase().includes(calCleanOpponent.toLowerCase()))
                      );
                      const hasCalTactic = calTactics.length > 0;

                      return (
                        <div
                          key={event.id}
                          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition space-y-4 shadow-sm text-slate-800"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                  event.type === 'TRENING'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : event.type === 'MECZ'
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : event.type === 'SPARING'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}>
                                  {event.type}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sky-600" />
                                  {event.date.slice(11, 16)}
                                </span>
                              </div>
                              {event.type === 'TRENING' ? (
                                <Link
                                  href={`/trening?eventId=${event.id}`}
                                  className="group inline-flex items-center gap-1.5"
                                  title="Otwórz konspekt i ćwiczenia treningu"
                                >
                                  <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition flex items-center gap-1.5 underline decoration-emerald-400">
                                    <Volleyball className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{event.title}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition" />
                                  </h4>
                                </Link>
                              ) : (
                                <h4 className="text-base font-black text-slate-900">
                                  {event.title} {event.opponent ? `• rywal: ${event.opponent}` : ''}
                                </h4>
                              )}
                              {event.location && (
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>{event.location}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start">
                              {event.type === 'TRENING' ? (
                                <Link
                                  href={`/trening?eventId=${event.id}`}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition"
                                  title="Otwórz konspekt i ćwiczenia treningu"
                                >
                                  <Volleyball className="w-3.5 h-3.5" />
                                  <span>Rozpiska treningu &rarr;</span>
                                </Link>
                              ) : (
                                <>
                                  {isCalLeagueMatch ? (
                                    <Link
                                      href="/rozgrywki?tab=liga"
                                      className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs transition"
                                      title="Przejdź do oficjalnego meczu i tabeli LALS"
                                    >
                                      <img src="/lals_logo.png" alt="LALS" className="w-3.5 h-3.5 rounded-full bg-white p-0.5 object-contain" />
                                      <span>Liga LALS</span>
                                    </Link>
                                  ) : event.type === 'SPARING' ? (
                                    <Link
                                      href="/rozgrywki?tab=sparingi"
                                      className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs transition"
                                      title="Przejdź do protokołu i sparingów w rozgrywkach"
                                    >
                                      <Swords className="w-3.5 h-3.5 text-slate-950" />
                                      <span>Sparing</span>
                                    </Link>
                                  ) : (
                                    <Link
                                      href="/rozgrywki?tab=turnieje"
                                      className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs transition"
                                      title="Przejdź do turnieju i drabinki"
                                    >
                                      <Trophy className="w-3.5 h-3.5" />
                                      <span>Turniej</span>
                                    </Link>
                                  )}

                                  {hasCalTactic && (
                                    <Link
                                      href={event.type === 'SPARING' ? `/taktyka?tab=sparingi&eventId=${event.id}&type=SPARING` : event.type === 'TURNIEJ' ? `/taktyka?tab=turnieje&eventId=${event.id}&type=TURNIEJ` : `/taktyka?tab=matches&eventId=${event.id}&type=MECZ`}
                                      className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs transition"
                                      title={`Założenia taktyczne (${calTactics.length})`}
                                    >
                                      <Target className="w-3.5 h-3.5 text-sky-600" />
                                      <span>Taktyka</span>
                                    </Link>
                                  )}
                                </>
                              )}

                              <span className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                                Obecnych: <strong className="text-emerald-700 font-mono">{yesAttendees.length}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Szybka deklaracja obecności */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 font-bold">Twoja obecność:</span>
                              {myAttendance?.status === 'BEDE' ? (
                                <span className="text-emerald-700 font-black flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Będę
                                </span>
                              ) : myAttendance?.status === 'NIEPEWNE' ? (
                                <span className="text-amber-700 font-black flex items-center gap-1">
                                  <HelpCircle className="w-3.5 h-3.5" /> Niepewne
                                </span>
                              ) : myAttendance?.status === 'NIE_BEDE' ? (
                                <span className="text-rose-600 font-black flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Nie będę
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Brak deklaracji</span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                              {Boolean(event.status === 'ZAKONCZONY' || new Date(event.date).getTime() < Date.now()) && !canManage ? (
                                <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 text-center">
                                  🔒 Zakończono (tylko wgląd)
                                </span>
                              ) : (
                                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                                  <button
                                    type="button"
                                    disabled={submittingAttendanceId === event.id}
                                    onClick={() => handleAttendance(event.id, 'BEDE')}
                                    className={`h-11 sm:h-9.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition border flex items-center justify-center cursor-pointer active:scale-95 ${
                                      myAttendance?.status === 'BEDE'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                                        : 'bg-slate-50 text-emerald-800 border-slate-200 hover:bg-emerald-50'
                                    }`}
                                  >
                                    Będę 👍
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingAttendanceId === event.id}
                                    onClick={() => handleAttendance(event.id, 'NIEPEWNE')}
                                    className={`h-11 sm:h-9.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition border flex items-center justify-center cursor-pointer active:scale-95 ${
                                      myAttendance?.status === 'NIEPEWNE'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-black'
                                        : 'bg-slate-50 text-amber-800 border-slate-200 hover:bg-amber-50'
                                    }`}
                                  >
                                    Niepewne 🤔
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingAttendanceId === event.id}
                                    onClick={() => handleAttendance(event.id, 'NIE_BEDE')}
                                    className={`h-11 sm:h-9.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition border flex items-center justify-center cursor-pointer active:scale-95 ${
                                      myAttendance?.status === 'NIE_BEDE'
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-black'
                                        : 'bg-slate-50 text-rose-800 border-slate-200 hover:bg-rose-50'
                                    }`}
                                  >
                                    Nie będę 👎
                                  </button>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setViewMode('list');
                                  setExpandedEventId(event.id);
                                }}
                                className="h-11 sm:h-9.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition border border-slate-200 shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
                              >
                                Szczegóły & Skład →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Events List */}
              {loading ? (
                <div className="py-20 text-center text-slate-500 text-sm">Ładowanie terminarza...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm text-slate-800">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">Brak jednostek w wybranym filtrze</h3>
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
                const isEventPast = Boolean(event.status === 'ZAKONCZONY' || new Date(event.date).getTime() < Date.now());

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
                    cardBorder: 'border-emerald-200 hover:border-emerald-400',
                    cardBg: isExpanded 
                      ? 'bg-emerald-50/20' 
                      : 'bg-white hover:bg-emerald-50/10',
                    leftAccent: 'border-l-[6px] border-l-emerald-500',
                    dateBoxBg: 'bg-emerald-50',
                    dateBoxBorder: 'border-emerald-200 group-hover:border-emerald-300',
                    dateDayText: 'text-emerald-700 font-bold',
                    dateClockText: 'text-emerald-950 font-black',
                    clockIconColor: 'text-emerald-600',
                    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm',
                    titleHover: 'group-hover:text-emerald-700',
                    actionBtn: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300',
                    glow: 'shadow-sm hover:shadow-md',
                    expandedBg: 'bg-slate-50',
                    expandedBorder: 'border-emerald-200',
                  },
                  SPARING: {
                    cardBorder: 'border-amber-200 hover:border-amber-400',
                    cardBg: isExpanded 
                      ? 'bg-amber-50/20' 
                      : 'bg-white hover:bg-amber-50/10',
                    leftAccent: 'border-l-[6px] border-l-amber-500',
                    dateBoxBg: 'bg-amber-50',
                    dateBoxBorder: 'border-amber-200 group-hover:border-amber-300',
                    dateDayText: 'text-amber-700 font-bold',
                    dateClockText: 'text-amber-950 font-black',
                    clockIconColor: 'text-amber-600',
                    badge: 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm',
                    titleHover: 'group-hover:text-amber-700',
                    actionBtn: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300',
                    glow: 'shadow-sm hover:shadow-md',
                    expandedBg: 'bg-slate-50',
                    expandedBorder: 'border-amber-200',
                  },
                  TURNIEJ: {
                    cardBorder: 'border-purple-200 hover:border-purple-400',
                    cardBg: isExpanded 
                      ? 'bg-purple-50/20' 
                      : 'bg-white hover:bg-purple-50/10',
                    leftAccent: 'border-l-[6px] border-l-purple-500',
                    dateBoxBg: 'bg-purple-50',
                    dateBoxBorder: 'border-purple-200 group-hover:border-purple-300',
                    dateDayText: 'text-purple-700 font-bold',
                    dateClockText: 'text-purple-950 font-black',
                    clockIconColor: 'text-purple-600',
                    badge: 'bg-purple-50 text-purple-800 border-purple-300 shadow-sm',
                    titleHover: 'group-hover:text-purple-700',
                    actionBtn: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300',
                    glow: 'shadow-sm hover:shadow-md',
                    expandedBg: 'bg-slate-50',
                    expandedBorder: 'border-purple-200',
                  },
                  MECZ: {
                    cardBorder: 'border-sky-200 hover:border-sky-400',
                    cardBg: isExpanded 
                      ? 'bg-sky-50/20' 
                      : 'bg-white hover:bg-sky-50/10',
                    leftAccent: 'border-l-[6px] border-l-sky-500',
                    dateBoxBg: 'bg-sky-50',
                    dateBoxBorder: 'border-sky-200 group-hover:border-sky-300',
                    dateDayText: 'text-sky-700 font-bold',
                    dateClockText: 'text-sky-950 font-black',
                    clockIconColor: 'text-sky-600',
                    badge: 'bg-sky-50 text-sky-800 border-sky-300 shadow-sm',
                    titleHover: 'group-hover:text-sky-700',
                    actionBtn: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300',
                    glow: 'shadow-sm hover:shadow-md',
                    expandedBg: 'bg-slate-50',
                    expandedBorder: 'border-sky-200',
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
                const rawTitle = cleanOpponent && !hasOpponentInTitle ? `${event.title} vs ${cleanOpponent}` : event.title;
                const displayTitle = isLeagueMatch
                  ? rawTitle
                      .replace(/^(?:oficjalne\s+spotkanie\s+(?:ligowe\s+)?lals|mecz\s+ligowy\s+lals|mecz\s+lals)\s*(\([^\)]+\))?:\s*/i, (_m, round) => round ? `${round} ` : '')
                      .trim()
                  : rawTitle;

                // Sprawdzenie czy do tej jednostki przypisano jakąkolwiek taktykę
                const eventTactics = tactics.filter(
                  t => t.eventId === event.id || 
                       t.matchId === event.id ||
                       Boolean(cleanOpponent && t.targetOpponent && t.targetOpponent.toLowerCase().includes(cleanOpponent.toLowerCase()))
                );
                const hasTactic = eventTactics.length > 0;
                const matchInfo = getEventMatchInfo(event);

                return (
                  <div
                    key={event.id}
                    id={`event_${event.id}`}
                    className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} ${theme.leftAccent} ${theme.glow} transition-all duration-300 overflow-hidden`}
                  >
                    {/* Collapsible Header Row (Rozwijany wiersz jednostki) */}
                    <div
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="p-4 sm:p-5 cursor-pointer flex flex-col gap-3.5 select-none group"
                    >
                      {/* Góra: Data, Odznaki typu, Czysty tytuł, Lokalizacja + Duże Przyciski Akcji po Prawej */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Lewa strona: Data + Tytuł + Szczegóły */}
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

                            {/* Match Result & VolleyStation Score Badge if match played */}
                            {matchInfo.ourSetsWon !== undefined && matchInfo.oppSetsWon !== undefined ? (
                              <span
                                className={`px-2 sm:px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide flex items-center gap-1 sm:gap-1.5 border shadow-2xs ${
                                  matchInfo.isWin
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                <span className="sm:hidden">{matchInfo.isWin ? '✓' : '✗'}</span>
                                <span className="hidden sm:inline">{matchInfo.isWin ? '✓ Wygrana' : '✗ Przegrana'}</span>
                                <span className="font-mono text-xs font-black">{matchInfo.ourSetsWon}:{matchInfo.oppSetsWon}</span>
                              </span>
                            ) : isFinished || isEventPast ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-slate-400" /> Zakończone
                              </span>
                            ) : null}

                            {/* Attendance counter ONLY for upcoming events */}
                            {!isEventPast && !isFinished && matchInfo.ourSetsWon === undefined && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                                  posBalance.isFull
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                                title="Liczba zawodników zapisanych na to wydarzenie"
                              >
                                <Users className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>
                                  <strong>{posBalance.totalConfirmed}</strong>/14
                                  <span className="hidden sm:inline"> graczy</span>
                                </span>
                              </span>
                            )}

                            {Boolean(event.costPerPerson && event.costPerPerson > 0) && (
                              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {event.costPerPerson} zł / os.
                              </span>
                            )}
                          </div>

                          {event.type === 'TRENING' ? (
                            <Link
                              href={`/trening?eventId=${event.id}`}
                              onClick={e => e.stopPropagation()}
                              className="group/tlink inline-flex items-start sm:items-center gap-1.5 min-w-0 max-w-full"
                              title="Kliknij, aby otworzyć konspekt ćwiczeń tego treningu"
                            >
                              <h3 className="text-sm sm:text-lg font-black text-slate-900 group-hover/tlink:text-emerald-700 transition leading-snug line-clamp-2 sm:truncate underline decoration-emerald-400 decoration-2 underline-offset-2 flex items-start sm:items-center gap-1.5">
                                <Volleyball className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                                <span>{displayTitle}</span>
                                <ArrowRight className="hidden sm:inline w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover/tlink:opacity-100 group-hover/tlink:translate-x-0.5 transition shrink-0" />
                              </h3>
                            </Link>
                          ) : (
                            <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
                              {cleanOpponent && (
                                <TeamCrestBadge
                                  teamName={cleanOpponent}
                                  logoUrl={event.opponentLogo}
                                  size="sm"
                                  className="shadow-2xs shrink-0 mt-0.5 sm:mt-0"
                                />
                              )}
                              <h3 className={`text-sm sm:text-lg font-black text-slate-900 ${theme.titleHover} transition leading-snug line-clamp-2 sm:truncate`}>
                                {displayTitle}
                              </h3>
                            </div>
                          )}

                          {(() => {
                            const mapsHref = getGoogleMapsUrl(event.location, event.locationUrl);
                            if (!mapsHref) return null;
                            return (
                              <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 hover:text-amber-700 transition group/map max-w-full"
                                title={event.locationUrl ? 'Otwórz pinezkę w Google Maps' : 'Wyszukaj ten adres w Google Maps'}
                              >
                                <MapPin className="w-3.5 h-3.5 text-rose-500 group-hover/map:scale-110 transition shrink-0" />
                                <span className="line-clamp-1 underline decoration-slate-300 group-hover/map:decoration-amber-500 underline-offset-2">
                                  {event.location}
                                </span>
                                {event.locationUrl && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-black uppercase tracking-wider shrink-0">
                                    Pinezka
                                  </span>
                                )}
                              </a>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Prawa strona nagłówka: Wygodne, duże przyciski akcji dopasowane pod kciuk */}
                      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap sm:flex-nowrap">
                        {/* 1. Szybki link do Ligi / Sparingów / Treningu */}
                        {isLeagueMatch ? (
                          <Link
                            href="/rozgrywki?tab=liga"
                            onClick={e => e.stopPropagation()}
                            className="flex-1 sm:flex-initial h-10 sm:h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer active:scale-95 min-h-[40px]"
                            title="Przejdź do oficjalnego meczu i tabeli LALS"
                          >
                            <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full bg-white p-0.5 object-contain shrink-0" />
                            <span>Liga LALS</span>
                          </Link>
                        ) : event.type === 'SPARING' ? (
                          <Link
                            href="/rozgrywki?tab=sparingi"
                            onClick={e => e.stopPropagation()}
                            className="flex-1 sm:flex-initial h-10 sm:h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer active:scale-95 min-h-[40px]"
                            title="Przejdź do sparingów"
                          >
                            <Swords className="w-4 h-4 text-slate-950 shrink-0" />
                            <span>Sparing</span>
                          </Link>
                        ) : event.type === 'TRENING' ? (
                          <Link
                            href={`/trening?eventId=${event.id}`}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 sm:flex-initial h-10 sm:h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:shadow transition shrink-0 cursor-pointer active:scale-95 min-h-[40px]"
                            title="Otwórz konspekt i ćwiczenia treningu"
                          >
                            <Volleyball className="w-4 h-4 shrink-0" />
                            <span>Rozpiska &rarr;</span>
                          </Link>
                        ) : null}

                        {/* 2. Przycisk Taktyki – dla meczów, sparingów i turniejów */}
                        {event.type !== 'TRENING' && (
                          hasTactic ? (
                            <Link
                              href={event.type === 'SPARING' ? `/taktyka?tab=sparingi&eventId=${event.id}&type=SPARING` : event.type === 'TURNIEJ' ? `/taktyka?tab=turnieje&eventId=${event.id}&type=TURNIEJ` : `/taktyka?tab=matches&eventId=${event.id}&type=MECZ`}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition shrink-0 bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 cursor-pointer active:scale-95 min-h-[40px]"
                              title={`Założenia taktyczne (${eventTactics.length})`}
                            >
                              <Target className="w-4 h-4 shrink-0 text-sky-600" />
                              <span>Taktyka</span>
                            </Link>
                          ) : canManage ? (
                            <Link
                              href={event.type === 'SPARING' ? `/taktyka?tab=sparingi&eventId=${event.id}&type=SPARING` : event.type === 'TURNIEJ' ? `/taktyka?tab=turnieje&eventId=${event.id}&type=TURNIEJ` : `/taktyka?tab=matches&eventId=${event.id}&type=MECZ`}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 opacity-80 hover:opacity-100 cursor-pointer active:scale-95 min-h-[40px]"
                              title="Dodaj taktykę"
                            >
                              <Target className="w-4 h-4 shrink-0 text-slate-500" />
                              <span>+ Taktyka</span>
                            </Link>
                          ) : null
                        )}

                        {/* 3. Przycisk obecności – TYLKO dla nadchodzących wydarzeń */}
                        {!isEventPast && !isFinished && matchInfo.ourSetsWon === undefined && (
                          myAttendance ? (
                            <span
                              className={`flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center text-center shrink-0 min-h-[40px] ${
                                myAttendance.status === 'BEDE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                                  : myAttendance.status === 'NIEPEWNE'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              <span className="truncate">
                                {myAttendance.status === 'BEDE' ? '✓ Będę' : myAttendance.status === 'NIEPEWNE' ? '? Niepewny' : '✗ Nieobecny'}
                              </span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                              className="flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center gap-1.5 transition shadow-2xs shrink-0 cursor-pointer active:scale-95 min-h-[40px]"
                              title="Kliknij, aby oddać głos w ankiecie obecności"
                            >
                              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="truncate">Oddaj głos</span>
                            </button>
                          )
                        )}

                        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                          {/* 4. Quick Edit Button dla sztabu */}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openEditModal(event)}
                              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shadow-2xs flex items-center justify-center shrink-0 cursor-pointer active:scale-95 min-w-[40px]"
                              title="Edytuj jednostkę"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* 5. Przycisk Chevron */}
                          <div
                            className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0 min-w-[40px] ${
                              isExpanded ? 'rotate-180 bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-600 group-hover:text-slate-900'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* EXPANDED CONTENT (Szczegóły jednostki po rozwinięciu) */}
                    {isExpanded && (
                      <div className={`p-5 sm:p-7 ${theme.expandedBg} border-t ${theme.expandedBorder} space-y-6 animate-fadeIn`}>
                        {/* Top Management Controls (for coach / manager) */}
                        {canManage && (
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                            <div className="text-xs text-slate-500">
                              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Zarządzanie Jednostką:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => openEditModal(event)}
                                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Edytuj parametry</span>
                              </button>

                              <button
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition shadow-sm"
                                title="Usuń jednostkę"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* PROMINENT BANNER DLA TRENINGU: BEZPOŚREDNIE PRZEJŚCIE DO ROZPISKI */}
                        {event.type === 'TRENING' && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Volleyball className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase text-emerald-950 tracking-wider flex items-center gap-2">
                                  <span>Konspekt Ćwiczeń & Warsztat Trenera</span>
                                  <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Rozpiska
                                  </span>
                                </h4>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  Zobacz rozpisane ćwiczenia, rysunki na boisku, materiały PDF i wideo oraz cele tej jednostki.
                                </p>
                              </div>
                            </div>
                            <Link
                              href={`/trening?eventId=${event.id}`}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:shadow transition shrink-0"
                            >
                              <span>Otwórz konspekt treningu</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        )}

                        {/* SECTION 0: OFICJALNY PROTOKÓŁ MECZOWY VOLLEYSTATION (Wynik, Sety, MVP, Statystyki) */}
                        {(matchInfo.report || matchInfo.match) && (
                          <div className="p-5 rounded-2xl bg-white border border-sky-200 space-y-4 shadow-sm text-slate-800">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-sky-600" />
                                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                    Oficjalny Raport Meczowy VolleyStation
                                  </h4>
                                  {(matchInfo.report?.round || matchInfo.match?.round) && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                      Runda {matchInfo.report?.round || matchInfo.match?.round}
                                    </span>
                                  )}
                                  {matchInfo.ourSetsWon !== undefined && matchInfo.oppSetsWon !== undefined && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                      matchInfo.isWin
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-rose-50 text-rose-800 border-rose-300'
                                    }`}>
                                      {matchInfo.isWin ? '✓ Wygrana' : '✗ Przegrana'} {matchInfo.ourSetsWon}:{matchInfo.oppSetsWon}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Rezultat i rozliczenie setów pobrane z protokołu Lubońskiej Amatorskiej Ligi Siatkówki.
                                </p>
                              </div>

                              {matchInfo.volleyStationUrl && (
                                <a
                                  href={matchInfo.volleyStationUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1.5 transition border border-sky-200 w-fit shrink-0"
                                >
                                  <span>Otwórz w VolleyStation</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>

                            {/* Set by Set Breakdown */}
                            {matchInfo.report?.sets && matchInfo.report.sets.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {matchInfo.report.sets.map((s, idx) => (
                                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">Set {s.setNumber}</span>
                                    <div className="text-base font-mono font-black text-slate-900">
                                      <span className={s.homeScore > s.awayScore ? 'text-sky-600' : ''}>{s.homeScore}</span>
                                      <span className="text-slate-400"> : </span>
                                      <span className={s.awayScore > s.homeScore ? 'text-sky-600' : ''}>{s.awayScore}</span>
                                    </div>
                                    {s.duration && <span className="text-[9px] text-slate-500 block font-mono font-medium">{s.duration}</span>}
                                  </div>
                                ))}
                              </div>
                            ) : matchInfo.match?.sets && matchInfo.match.sets.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {matchInfo.match.sets.map((s, idx) => (
                                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">Set {s.setNumber}</span>
                                    <div className="text-base font-mono font-black text-slate-900">
                                      <span className={s.teamScore > s.opponentScore ? 'text-sky-600' : ''}>{s.teamScore}</span>
                                      <span className="text-slate-400"> : </span>
                                      <span className={s.opponentScore > s.teamScore ? 'text-sky-600' : ''}>{s.opponentScore}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {/* MVP & Duration Info */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                              {matchInfo.mvp && (
                                <span className="flex items-center gap-1.5 font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                                  <Crown className="w-4 h-4 text-amber-600" />
                                  <span>MVP Meczu: {matchInfo.mvp}</span>
                                </span>
                              )}
                              {matchInfo.duration && (
                                <span className="flex items-center gap-1.5 font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Czas trwania: {matchInfo.duration}</span>
                                </span>
                              )}
                              {matchInfo.report?.referee && (
                                <span className="text-slate-500 text-xs">
                                  👔 Sędzia: {matchInfo.report.referee}
                                </span>
                              )}
                            </div>

                            {matchInfo.match?.notes && (
                              <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                &quot;{matchInfo.match.notes}&quot;
                              </p>
                            )}
                          </div>
                        )}

                        {/* Oficjalny Banner Meczowy LALS */}
                        {isLeagueMatch && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-sky-50 border border-sky-200 shadow-sm text-slate-800">
                            <div className="flex items-center gap-3.5">
                              <img
                                src="/lals_logo.png"
                                alt="Oficjalne Logo LALS"
                                className="w-12 h-12 rounded-full object-contain shrink-0 shadow-sm ring-1 ring-sky-300 p-0.5 bg-white"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                    Lubońska Amatorska Liga Siatkówki (LALS)
                                  </h4>
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-200">
                                    Mecz Ligowy
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  Oficjalny pojedynek ligowy. Po meczu sprawdź tabelę punktową, sety i statystyki w module Rozgrywki.
                                </p>
                              </div>
                            </div>
                            <Link
                              href="/rozgrywki"
                              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm"
                            >
                              <span>Tabela & Wyniki LALS</span>
                              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            </Link>
                          </div>
                        )}

                        {/* SECTION: WNIOSKI & NOTATKA POMECZOWA TRENERA (Tylko do odczytu dla graczy, edycja dla trenera i sztabu) */}
                        {isEventPast && (
                          <div className="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm space-y-3.5 text-slate-800">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                  <ClipboardList className="w-4 h-4 text-amber-700" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider">
                                      Wnioski & Odprawa Pomeczowa Trenera
                                    </h4>
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                                      Odprawa
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    Oficjalne podsumowanie po meczu: uwagi taktyczne, plusy i wnioski na kolejne treningi.
                                  </p>
                                </div>
                              </div>

                              {canManage && editingCoachNoteEventId !== event.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCoachNoteEventId(event.id);
                                    setCoachNoteText(event.coachPostMatchNote || matchInfo.match?.coachComments || '');
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-2xs w-fit shrink-0"
                                >
                                  <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>{event.coachPostMatchNote ? 'Edytuj notatkę' : '+ Dodaj notatkę trenera'}</span>
                                </button>
                              )}
                            </div>

                            {/* Edycja notatki dla trenera / sztabu */}
                            {editingCoachNoteEventId === event.id ? (
                              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3 animate-fadeIn">
                                <label className="block text-xs font-bold text-slate-800">
                                  Treść notatki / wniosków pomeczowych (widoczna dla całej kadry):
                                </label>
                                <textarea
                                  rows={4}
                                  value={coachNoteText}
                                  onChange={e => setCoachNoteText(e.target.value)}
                                  placeholder="Wpisz analizę meczu, wyróżnienia graczy, elementy wymagające poprawy na treningach..."
                                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs leading-relaxed"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    disabled={savingCoachNote}
                                    onClick={() => setEditingCoachNoteEventId(null)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                                  >
                                    Anuluj
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingCoachNote}
                                    onClick={() => handleSavePostMatchNote(event.id)}
                                    className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>{savingCoachNote ? 'Zapisywanie...' : 'Zapisz notatkę'}</span>
                                  </button>
                                </div>
                              </div>
                            ) : event.coachPostMatchNote || matchInfo.match?.coachComments ? (
                              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                                  {event.coachPostMatchNote || matchInfo.match?.coachComments}
                                </p>
                                <div className="text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-200 flex items-center justify-between">
                                  <span>👔 Sztab Szkoleniowy Angels ZTP</span>
                                  <span>Wpis zarchiwizowany</span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 italic">
                                Trener nie zamieścił jeszcze oficjalnej notatki pomeczowej do tego spotkania.
                              </div>
                            )}
                          </div>
                        )}

                        {/* SECTION 1: CZYTELNA ANKIETA OBECNOŚCI DLA WSZYSTKICH (ZAWODNICY + TRENER + SZTAB) */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm text-slate-800">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-sky-600" />
                                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                  Ankieta Dostępności na Jednostce
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Obecność zaznaczają <strong>wszyscy (zawodnicy, trener i sztab)</strong>. Zadeklaruj status, aby odblokować taktykę i założenia.
                              </p>
                            </div>

                            {/* Current user vote status badge */}
                            {myAttendance ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Twój wybór: <strong>{myAttendance.status === 'BEDE' ? 'Będę na jednostce' : myAttendance.status === 'NIEPEWNE' ? 'Status: Niepewny' : 'Nie będę obecny'}</strong></span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Wymagany głos w ankiecie!</span>
                              </div>
                            )}
                          </div>

                          {/* 3 Large, modern voting cards */}
                          {isArchiveMode ? (
                            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
                              <Lock className="w-4 h-4 text-amber-600" />
                              <span>Tryb archiwalny: Deklarowanie i zmiana obecności są zablokowane (Tylko do odczytu)</span>
                            </div>
                          ) : isEventPast && !canManage ? (
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                                  <Lock className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-black text-slate-900 uppercase text-xs tracking-wide flex items-center gap-1.5">
                                    <span>Głosowanie Zamknięte</span>
                                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-mono font-bold uppercase">Archiwum</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Termin jednostki minął — ankieta została zamknięta. Poniższa lista obecności oraz statystyki są wyłącznie do wglądu.
                                  </div>
                                </div>
                              </div>
                              {myAttendance ? (
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs shrink-0 shadow-2xs">
                                  <span className="text-slate-400 text-[10px] uppercase font-mono">Twój zapis:</span>
                                  <span className={myAttendance.status === 'BEDE' ? 'text-emerald-700 font-black' : myAttendance.status === 'NIEPEWNE' ? 'text-amber-700 font-black' : 'text-rose-700 font-black'}>
                                    {myAttendance.status === 'BEDE' ? '✓ Obecny' : myAttendance.status === 'NIEPEWNE' ? '? Niepewny' : '✗ Nieobecny'}
                                  </span>
                                  {myAttendance.note && (
                                    <span className="text-slate-500 text-[11px] italic font-normal max-w-[140px] truncate" title={myAttendance.note}>
                                      &quot;{myAttendance.note}&quot;
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic px-3 py-1 rounded-lg bg-slate-200/60 shrink-0">
                                  Brak głosu przed jednostką
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {isEventPast && canManage && (
                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>Termin jednostki minął (zawodnicy nie mogą już edytować głosów). Jako Trener/Sztab masz uprawnienia do korekty frekwencji.</span>
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Option: BEDE */}
                              <button
                                type="button"
                                disabled={submittingAttendanceId === event.id}
                                onClick={() => handleAttendance(event.id, 'BEDE')}
                                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group ${
                                  myAttendance?.status === 'BEDE'
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm ring-2 ring-emerald-400'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                                    <CheckCircle2 className={`w-4 h-4 ${myAttendance?.status === 'BEDE' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                                    Będę na 100%
                                  </span>
                                  {myAttendance?.status === 'BEDE' && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                                      Wybrano
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 group-hover:text-slate-700">
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
                                    ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-sm ring-2 ring-amber-400'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/40'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                                    <HelpCircle className={`w-4 h-4 ${myAttendance?.status === 'NIEPEWNE' ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-600'}`} />
                                    Niepewny / Być może
                                  </span>
                                  {myAttendance?.status === 'NIEPEWNE' && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-600 text-white">
                                      Wybrano
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 group-hover:text-slate-700">
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
                                    ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-sm ring-2 ring-rose-400'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/40'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                                    <XCircle className={`w-4 h-4 ${myAttendance?.status === 'NIE_BEDE' ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-600'}`} />
                                    Nie będę obecny
                                  </span>
                                  {myAttendance?.status === 'NIE_BEDE' && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                                      Wybrano
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 group-hover:text-slate-700">
                                  Zgłaszam nieobecność (zwolnienie / wyjazd).
                                </p>
                              </button>
                            </div>
                            </div>
                          )}

                          {/* Optional note input toggle */}
                          {!isArchiveMode && (!isEventPast || canManage) && (
                          <div className="pt-1">
                            {expandedNoteEventId === event.id ? (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-fadeIn">
                                <label className="block text-[11px] font-bold text-slate-700">
                                  Notatka dla trenera (np. będę 15 min później, wychodzę o 21:00):
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={attendanceNotes[event.id] || ''}
                                    onChange={e => setAttendanceNotes({ ...attendanceNotes, [event.id]: e.target.value })}
                                    placeholder="Wpisz treść notatki..."
                                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (myAttendance) {
                                        handleAttendance(event.id, myAttendance.status, attendanceNotes[event.id]);
                                      }
                                      setExpandedNoteEventId(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition shadow-sm"
                                  >
                                    Zapisz
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedNoteEventId(null)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs hover:bg-slate-300"
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
                                className="text-[11px] text-slate-500 hover:text-sky-700 font-bold transition flex items-center gap-1"
                              >
                                <span>💬 {myAttendance?.note ? `Twoja notatka: "${myAttendance.note}" (kliknij aby edytować)` : '+ Dodaj notatkę do deklaracji'}</span>
                              </button>
                            )}
                          </div>
                          )}

                          {/* TABELA OBECNOŚCI & DEKLARACJI ZAWODNIKÓW */}
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
                              <div className="space-y-3 pt-3 border-t border-slate-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-sky-600" />
                                      <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                        Tabela Składu & Frekwencji na Jednostce
                                      </h5>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
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
                                          ? 'bg-sky-600 text-white border-sky-600 font-black shadow-sm'
                                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      Wszyscy ({participantsList.length})
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setAttendanceTableFilter(prev => ({ ...prev, [event.id]: 'BEDE' }))}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                                        activeTableFilter === 'BEDE'
                                          ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-sm'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
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
                                            ? 'bg-amber-600 text-white border-amber-600 font-black shadow-sm'
                                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
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
                                            ? 'bg-rose-600 text-white border-rose-600 font-black shadow-sm'
                                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
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
                                            ? 'bg-slate-700 text-white border-slate-700 font-black shadow-sm'
                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                        }`}
                                      >
                                        ⏳ Brak odpowiedzi ({countBrak})
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Responsywna Tabela */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                                        <th className="py-2.5 px-3 w-12 text-center">Nr</th>
                                        <th className="py-2.5 px-3">Zawodnik / Członek Sztabu</th>
                                        <th className="py-2.5 px-3">Pozycja Boiskowa</th>
                                        <th className="py-2.5 px-3">Status w Ankiecie</th>
                                        <th className="py-2.5 px-3">Notatka / Komentarz</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {sortedTableParticipants.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                            Brak osób w wybranym filtrze tabeli.
                                          </td>
                                        </tr>
                                      ) : (
                                        sortedTableParticipants.map((p) => {
                                          return (
                                            <tr key={p.userId} className="hover:bg-slate-50 transition-colors">
                                              {/* Nr koszulki */}
                                              <td className="py-2.5 px-3 text-center">
                                                {p.number ? (
                                                  <span className="inline-block px-1.5 py-0.5 rounded font-mono font-black text-[11px] bg-slate-100 border border-slate-200 text-slate-800">
                                                    #{p.number}
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-400 font-mono text-[11px]">—</span>
                                                )}
                                              </td>

                                              {/* Imię i Nazwisko */}
                                              <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-slate-900 text-xs">
                                                    {p.name}
                                                  </span>
                                                  {p.isStaff && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200">
                                                      {p.role === 'TRENER' ? 'Trener' : 'Kierownik'}
                                                    </span>
                                                  )}
                                                  {p.userId === user?.id && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
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
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Będę na 100%</span>
                                                  </span>
                                                ) : p.status === 'NIEPEWNE' ? (
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>Niepewny</span>
                                                  </span>
                                                ) : p.status === 'NIE_BEDE' ? (
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                    <span>Nieobecny</span>
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                    <span>Brak odpowiedzi</span>
                                                  </span>
                                                )}
                                              </td>

                                              {/* Notatka */}
                                              <td className="py-2.5 px-3">
                                                {p.note ? (
                                                  <span className="text-[11px] text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block max-w-[220px] truncate" title={p.note}>
                                                    💬 {p.note}
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-400 text-xs">—</span>
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

                        {/* SECTION 2: WSKAŹNIK IDEALNEGO SKŁADU NA TRENING */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm text-slate-800">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-sky-600" />
                                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                  Bilans Pozycji na Treningu (Idealnie: 14 Graczy do Gry 6x6)
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Cel do rozegrania pełnego meczu treningowego z dwiema szóstkami: <strong>4 Przyjmujących, 4 Środkowych, 2 Atakujących, 2 Rozgrywających, 2 Libero</strong>.
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black border ${
                                posBalance.isFull
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
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
                                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-sm'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                        {p.name}
                                      </span>
                                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${p.badgeBg}`}>
                                        {p.code}
                                      </span>
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xl font-mono font-black text-slate-900">
                                        {p.confirmed.length}
                                      </span>
                                      <span className="text-xs text-slate-500 font-mono">
                                        /{p.target}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-[11px] pt-1 border-t border-slate-200">
                                    {isComplete ? (
                                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Komplet
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 font-bold">
                                        Brakuje: {missingCount}
                                      </span>
                                    )}
                                  </div>

                                  {/* Confirmed list on this position */}
                                  {p.confirmed.length > 0 && (
                                    <div className="text-[10px] text-slate-600 space-y-0.5 truncate">
                                      {p.confirmed.map(c => (
                                        <div key={c.id} className="truncate">
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
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <span className="font-medium">
                              {posBalance.isFull
                                ? '✓ Idealne warunki do treningu: Mamy komplet na dwie pełne szóstki (6 na 6 z libero)!'
                                : `⚠️ Stan składu: Brakuje jeszcze ${14 - posBalance.totalConfirmed} zawodników (${posBalance.missingPositions.join(', ')}), aby stworzyć dwie pełne szóstki.`}
                            </span>
                          </div>
                        </div>

                        {/* SECTION 3: ZAŁOŻENIA TAKTYCZNE */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm text-slate-800">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-sky-600" />
                              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                Założenia Taktyczne & Przekierowanie do Modułów
                              </h4>
                            </div>

                            {isUnlocked ? (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-sm">
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                Odblokowane (Głos oddany)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" />
                                Zablokowane do czasu głosu
                              </span>
                            )}
                          </div>

                          {/* IF NOT UNLOCKED: SHOW LOCK BANNER (GATE) */}
                          {!isUnlocked ? (
                            <div className="relative rounded-2xl overflow-hidden border border-amber-300 bg-amber-50/60 p-6 text-center space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mx-auto shadow-sm animate-bounce">
                                <Lock className="w-6 h-6" />
                              </div>
                              <h5 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                Założenia taktyczne i playbook są ukryte
                              </h5>
                              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                Aby zobaczyć założenia taktyczne trenera, schematy gry oraz przejść do tablicy playbooka, <strong>musisz najpierw oddać głos w ankiecie powyżej</strong> (wystarczy kliknąć: <em>Będę</em>, <em>Niepewny</em> lub <em>Nie będę</em>).
                              </p>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => setStaffBypassLock(prev => ({ ...prev, [event.id]: true }))}
                                  className="text-[11px] text-sky-600 hover:underline font-bold pt-1 block mx-auto"
                                >
                                  Omiń blokadę (Podgląd sztabowy)
                                </button>
                              )}
                            </div>
                          ) : (
                            /* IF UNLOCKED: SHOW FULL DETAILS AND DIRECT MODULE REDIRECTS */
                            <div className="space-y-4 animate-fadeIn">
                              {/* Event Description & Assumptions */}
                              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                                <div className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                                  Plan & Wytyczne Trenerskie:
                                </div>
                                {event.description ? (
                                  <p className="leading-relaxed text-slate-800 whitespace-pre-line text-justified-clean">{event.description}</p>
                                ) : (
                                  <p className="italic text-slate-400">Brak dodatkowych wytycznych tekstowych. Sprawdź tablicę taktyczną poniżej.</p>
                                )}
                              </div>

                              {/* Saved Linked Tactics to this Event */}
                              {(() => {
                                const linkedTactics = tactics.filter(
                                  t => t.eventId === event.id || 
                                       t.matchId === event.id ||
                                       Boolean(cleanOpponent && t.targetOpponent && t.targetOpponent.toLowerCase().includes(cleanOpponent.toLowerCase()))
                                );
                                if (linkedTactics.length === 0) return null;
                                return (
                                  <div className="space-y-2 pt-1 pb-2">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center justify-between">
                                      <span>Zapisane Zrzuty Taktyczne do tej Jednostki ({linkedTactics.length}):</span>
                                      <Link
                                        href={`/taktyka?eventId=${event.id}&type=${isLeagueMatch ? 'MECZ_LIGOWY' : event.type}`}
                                        className="text-[11px] text-sky-600 hover:underline font-bold flex items-center gap-1"
                                      >
                                        <span>Otwórz tablicę</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </Link>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {linkedTactics.map(tac => (
                                        <div key={tac.id} className="p-3 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl space-y-2 transition shadow-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="font-black text-xs text-slate-900 truncate max-w-[200px]">{tac.title}</span>
                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                              {tac.rotation} • {tac.phase}
                                            </span>
                                          </div>
                                          {tac.drawingData && (
                                            <div className="aspect-[16/9] bg-white rounded-xl overflow-hidden border border-slate-200 max-h-28">
                                              <img src={tac.drawingData} alt={tac.title} className="w-full h-full object-contain" />
                                            </div>
                                          )}
                                          {tac.description && (
                                            <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                                              {tac.description}
                                            </p>
                                          )}
                                          <Link
                                            href={`/taktyka?eventId=${event.id}&tacticId=${tac.id}`}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline pt-1"
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
                                      href={`/taktyka?tab=matches&eventId=${event.id}&type=MECZ`}
                                      className="p-4 rounded-2xl border border-sky-200 bg-sky-50/50 hover:border-sky-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center p-0.5">
                                            <img src="/lals_logo.png" alt="LALS" className="w-5 h-5 rounded-full object-contain" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-sky-800">
                                            Odprawa Taktyczna LALS
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          Rywal: {cleanOpponent || 'Przeciwnik'} • Serwis w strefę 1/5 & schemat bloku.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-sky-600 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href="/rozgrywki"
                                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                                            <Trophy className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            Tabela & Wyniki LALS
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          Aktualna tabela Lubońskiej Amatorskiej Ligi Siatkówki i bilans setów.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>
                                  </>
                                ) : event.type === 'TRENING' ? (
                                  <>
                                    <Link
                                      href={`/taktyka?tab=board&eventId=${event.id}`}
                                      className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Target className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                                            Tablica Taktyczna & Schematy 5-1
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          Zadania dla pozycji, zgranie szóstki i wstawienie potwierdzonych graczy.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href={`/trening?eventId=${event.id}`}
                                      className="p-4 rounded-2xl border border-sky-200 bg-sky-50/50 hover:border-sky-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                                            <Volleyball className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-sky-800">
                                            Rozpiska Treningowa & Ćwiczenia
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          Rysunki ćwiczeń na boisku, grafiki, wideo, cele jednostki i wnioski trenera.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-sky-600 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>
                                  </>
                                ) : event.type === 'SPARING' ? (
                                  <>
                                    <Link
                                      href={`/taktyka?tab=sparingi&eventId=${event.id}&type=SPARING`}
                                      className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 hover:border-amber-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                            <Swords className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                                            Plan Taktyczny na Sparing
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          Rywal: {event.opponent || 'Przeciwnik'} • Założenia na blok i test szóstki.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href="/rozgrywki"
                                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                                            <Trophy className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            Centrum Rozgrywek & Wyniki
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
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
                                      className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 hover:border-purple-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                                            <Trophy className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-purple-800">
                                            Moduł Turniejowy & Drabinka
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                          Faza grupowa, terminarz spotkań turniejowych i wyniki na żywo.
                                        </p>
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                                    </Link>

                                    <Link
                                      href={`/taktyka?tab=turnieje&eventId=${event.id}&type=TURNIEJ`}
                                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 text-slate-800 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-sky-700 flex items-center justify-center">
                                            <Target className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            Taktyka & Zestawienie Turniejowe
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
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
          {filteredEvents.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm text-slate-800">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>
                  Wyświetlanie <strong className="text-slate-900">{(eventsPage - 1) * eventsPerPage + 1}–{Math.min(eventsPage * eventsPerPage, filteredEvents.length)}</strong> z <strong className="text-slate-900">{filteredEvents.length}</strong> jednostek
                </span>
                <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Na stronę:</span>
                  {[10, 20, 50, 100].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setEventsPerPage(size);
                        setEventsPage(1);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                        eventsPerPage === size
                          ? 'bg-sky-600 text-white shadow-2xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {totalEventsPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                    disabled={eventsPage === 1}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold"
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
                            ? 'bg-sky-600 text-white border-sky-600 font-black shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setEventsPage(p => Math.min(totalEventsPages, p + 1))}
                    disabled={eventsPage === totalEventsPages}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold"
                  >
                    <span>Następna</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
          </>
        )}
        </div>




          {/* MODAL 2: Nowa Jednostka (Trening / Sparing / Turniej) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-600" />
                Zaplanuj Nową Jednostkę
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              {/* Type selection */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Typ jednostki</label>
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
                          ? 'bg-sky-600 text-white border-sky-600 font-black shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                  <label className="text-slate-600 font-bold">Tytuł jednostki</label>
                  {newEventType === 'TRENING' && (
                    <div className="flex gap-1">
                      {['Przyjęcie & blok', 'System 5-1', 'Motoryka'].map(preset => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setNewEventTitle(`Trening: ${preset}`)}
                          className="text-[10px] text-sky-600 hover:underline font-bold"
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
                          className="text-[10px] text-sky-600 hover:underline font-bold"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Opponent (if Sparing, Tournament, or Match) */}
              {(newEventType === 'SPARING' || newEventType === 'TURNIEJ' || newEventType === 'MECZ') && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Rywal / Zaproszone zespoły</label>
                    <input
                      type="text"
                      placeholder="np. KS Metro Warszawa, Trefl Gdańsk II"
                      value={newEventOpponent}
                      onChange={e => setNewEventOpponent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Herb rywala (Upload lub URL) */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-sky-600" />
                        Herb rywala (plik z dysku / telefonu lub link URL)
                      </label>
                      {newEventOpponentLogo && (
                        <button
                          type="button"
                          onClick={() => setNewEventOpponentLogo('')}
                          className="text-[10px] text-rose-500 hover:underline font-bold"
                        >
                          Usuń herb
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <TeamCrestBadge teamName={newEventOpponent || 'Rywal'} logoUrl={newEventOpponentLogo} size="lg" />
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleOpponentLogoUpload(file, setNewEventOpponentLogo);
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 file:cursor-pointer"
                        />
                        <input
                          type="url"
                          placeholder="lub wklej link URL do herbu..."
                          value={newEventOpponentLogo}
                          onChange={e => setNewEventOpponentLogo(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Data i godzina</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Lokalizacja (Hala)</label>
                  <input
                    type="text"
                    required
                    value={newEventLocation}
                    onChange={e => setNewEventLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Pinezka Google Maps (opcjonalnie) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Pinezka / Link Google Maps (opcjonalnie)</span>
                  </label>
                  {(newEventLocationUrl.trim() || newEventLocation.trim()) && (
                    <a
                      href={getGoogleMapsUrl(newEventLocation, newEventLocationUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      Sprawdź w Mapach &rarr;
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/... (wklej pinezkę z Google Maps)"
                  value={newEventLocationUrl}
                  onChange={e => setNewEventLocationUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Założenia / Opis jednostki</label>
                <textarea
                  rows={2}
                  placeholder="Cele treningowe, plan taktyczny lub wytyczne zbiórki..."
                  value={newEventDescription}
                  onChange={e => setNewEventDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Cost (Tournament only) */}
              {newEventType === 'TURNIEJ' && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Koszt wpisowego na zawodnika (zł)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="np. 50"
                    value={newEventCost}
                    onChange={e => setNewEventCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-600" />
                Edycja Jednostki
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4 text-xs">
              {/* Typ jednostki */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Typ jednostki</label>
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
                          ? 'bg-sky-600 text-white border-sky-600 font-black shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tytuł jednostki */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Tytuł jednostki</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Rywal (opcjonalny dla sparingu, meczu i turnieju) */}
              {(editType === 'SPARING' || editType === 'TURNIEJ' || editType === 'MECZ') && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Rywal / Przeciwnik</label>
                    <input
                      type="text"
                      value={editOpponent}
                      onChange={e => setEditOpponent(e.target.value)}
                      placeholder="np. KS Sobieski Poznań"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Herb rywala (Edycja) */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-sky-600" />
                        Herb rywala (plik z dysku / telefonu lub link URL)
                      </label>
                      {editOpponentLogo && (
                        <button
                          type="button"
                          onClick={() => setEditOpponentLogo('')}
                          className="text-[10px] text-rose-500 hover:underline font-bold"
                        >
                          Usuń herb
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <TeamCrestBadge teamName={editOpponent || 'Rywal'} logoUrl={editOpponentLogo} size="lg" />
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleOpponentLogoUpload(file, setEditOpponentLogo);
                          }}
                          className="block w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 file:cursor-pointer"
                        />
                        <input
                          type="url"
                          placeholder="lub wklej link URL do herbu..."
                          value={editOpponentLogo}
                          onChange={e => setEditOpponentLogo(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data i Godzina oraz Miejsce */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Data i godzina</label>
                  <input
                    type="datetime-local"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Status jednostki</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as EventStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="ANKIETA">Ankieta w toku (Głosowanie zawodników)</option>
                    <option value="WERYFIKACJA">Weryfikacja obecności</option>
                    <option value="ZAKONCZONY">Zakończony (Obecność potwierdzona)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Hala / Lokalizacja</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Pinezka Google Maps */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Pinezka / Link Google Maps (opcjonalnie)</span>
                  </label>
                  {(editLocationUrl.trim() || editLocation.trim()) && (
                    <a
                      href={getGoogleMapsUrl(editLocation, editLocationUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      Sprawdź w Mapach &rarr;
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/... (wklej pinezkę z Google Maps)"
                  value={editLocationUrl}
                  onChange={e => setEditLocationUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Koszt składki */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Składka / Koszt od zawodnika (zł, 0 jeśli bez opłaty)</label>
                <input
                  type="number"
                  min="0"
                  value={editCost}
                  onChange={e => setEditCost(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Opis / Założenia */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Założenia / Opis jednostki</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Plan taktyczny, cele treningowe, zbiórka..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (editingEvent) {
                      const id = editingEvent.id;
                      const title = editingEvent.title;
                      setEditingEvent(null);
                      handleDeleteEvent(id, title);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Usuń to wydarzenie</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700 hover:bg-slate-200 text-xs"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm"
                  >
                    {savingEdit ? 'Zapisywanie...' : 'Zapisz zmiany'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Coach Note Editor on Player */}
      {editingPlayerNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                Notatka Trenera: {editingPlayerNote.name}
              </h3>
              <button
                onClick={() => setEditingPlayerNote(null)}
                className="text-slate-400 hover:text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Wpisz uwagi dotyczące frekwencji, zaangażowania lub usprawiedliwionych nieobecności zawodnika.
            </p>

            <textarea
              rows={4}
              value={editingPlayerNote.note}
              onChange={e => setEditingPlayerNote({ ...editingPlayerNote, note: e.target.value })}
              placeholder="np. Zgłasza delegacje służbowe, wzorowa punktualność, gotowość do gry..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingPlayerNote(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveCoachNote}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-sm"
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
