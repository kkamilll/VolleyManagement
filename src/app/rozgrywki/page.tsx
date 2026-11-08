'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Volleyball, 
  Calendar, 
  Trophy, 
  BarChart3, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink, 
  FileText, 
  Award, 
  Flame, 
  Sparkles,
  LayoutGrid,
  Target,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Camera,
  Image as ImageIcon,
  Edit2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Layers,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  Shield,
  X,
  Save,
  Maximize2,
  Compass,
  MessageSquare,
  Share2,
  Send,
  Zap,
  Copy,
  Check,
  Radio,
  Smartphone,
  Upload,
  Download,
  Info,
  Loader2
} from 'lucide-react';
import { 
  MatchResult, 
  EventItem, 
  EventType, 
  AttendanceStatus, 
  User, 
  LeagueMatchReport,
  LeagueTableTeam,
  LeaguePhase,
  LeaguePhoto,
  VolleyballSet,
  TacticalPlay
} from '@/lib/types';

type TabType = 'sparingi' | 'liga' | 'turnieje';
type LigaSubTab = 'tabela' | 'wyniki' | 'statystyki' | 'zdjecia';
type SparingSubTab = 'mecze' | 'zdjecia';
type TurniejSubTab = 'drabinki' | 'zdjecia';

function RozgrywkiContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab');
  const initialTab: TabType = (rawTab === 'mecze' || rawTab === 'liga') ? 'liga' : (rawTab === 'turnieje' ? 'turnieje' : 'sparingi');
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [ligaSubTab, setLigaSubTab] = useState<LigaSubTab>('tabela');
  const [sparingSubTab, setSparingSubTab] = useState<SparingSubTab>('mecze');
  const [turniejSubTab, setTurniejSubTab] = useState<TurniejSubTab>('drabinki');

  // Collapsible Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');
  const activeFiltersCount = (statusFilter !== 'ALL' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [leagueReports, setLeagueReports] = useState<LeagueMatchReport[]>([]);
  const [leaderboards, setLeaderboards] = useState<any>(null);
  const [showVolleyStationImportModal, setShowVolleyStationImportModal] = useState(false);
  const [volleyStationRawInput, setVolleyStationRawInput] = useState('');
  const [volleyStationAutoCreate, setVolleyStationAutoCreate] = useState(true);
  const [submittingVolleyStation, setSubmittingVolleyStation] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState<'ANGELS' | 'LIGA'>('ANGELS');
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

  const toggleReport = (id: string) => {
    setExpandedReports(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [players, setPlayers] = useState<User[]>([]);
  const [leagueTable, setLeagueTable] = useState<LeagueTableTeam[]>([]);
  const [leaguePhases, setLeaguePhases] = useState<LeaguePhase[]>([]);
  const [activeLeaguePhaseId, setActiveLeaguePhaseId] = useState<string>('faza_1');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [editingTablePhaseId, setEditingTablePhaseId] = useState<string>('faza_1');
  const [tableRows, setTableRows] = useState<LeagueTableTeam[]>([]);
  const [savingTable, setSavingTable] = useState(false);
  const [importPhaseTargetId, setImportPhaseTargetId] = useState<string>('faza_1');
  const [rawTableInput, setRawTableInput] = useState('');
  const [leaguePhotos, setLeaguePhotos] = useState<LeaguePhoto[]>([]);
  const [tactics, setTactics] = useState<TacticalPlay[]>([]);
  const [loading, setLoading] = useState(true);

  // Stany zwijania / rozwijania kart dla sparingów, meczów ligowych i turniejów
  const [expandedSparrings, setExpandedSparrings] = useState<Record<string, boolean>>({});
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [expandedTournaments, setExpandedTournaments] = useState<Record<string, boolean>>({});

  const toggleSparring = (id: string) => {
    setExpandedSparrings(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleMatch = (id: string) => {
    setExpandedMatches(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleTournament = (id: string) => {
    setExpandedTournaments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Modals for Sparing / Tournament workflow
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventTypeToCreate, setEventTypeToCreate] = useState<EventType>('SPARING');
  const [resultModalEvent, setResultModalEvent] = useState<EventItem | null>(null);

  // Result Form State
  const [resTeamSets, setResTeamSets] = useState(3);
  const [resOppSets, setResOppSets] = useState(1);
  const [resSetsList, setResSetsList] = useState<VolleyballSet[]>([
    { setNumber: 1, teamScore: 25, opponentScore: 21 },
    { setNumber: 2, teamScore: 25, opponentScore: 19 },
    { setNumber: 3, teamScore: 22, opponentScore: 25 },
    { setNumber: 4, teamScore: 25, opponentScore: 18 }
  ]);
  const [resMvp, setResMvp] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [resTournamentRank, setResTournamentRank] = useState('');
  const [submittingResult, setSubmittingResult] = useState(false);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventLocation, setEventLocation] = useState('Hala OSiR, ul. Sportowa 5');
  const [eventOpponent, setEventOpponent] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCost, setEventCost] = useState('0');
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // League Modals
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoMatch, setPhotoMatch] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'MECZ' | 'SPARING' | 'TURNIEJ' | 'INNE'>('MECZ');
  const [photoLinkedEventId, setPhotoLinkedEventId] = useState<string>('');
  const [photoSeriesTitle, setPhotoSeriesTitle] = useState<string>('');
  const [photoSeriesList, setPhotoSeriesList] = useState<Array<{ url: string; title?: string }>>([]);
  const [photoFilterCategory, setPhotoFilterCategory] = useState<string>('ALL');
  const [submittingPhoto, setSubmittingPhoto] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<LeaguePhoto | null>(null);

  // League match manual entry modal
  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [matchPhaseId, setMatchPhaseId] = useState<string>('faza_1');
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchLocation, setMatchLocation] = useState('Hala Domowa Angels ZTP');
  const [matchIsHome, setMatchIsHome] = useState(true);
  const [matchMvp, setMatchMvp] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [manualMatchSets, setManualMatchSets] = useState<{ setNumber: number; teamScore: number; opponentScore: number }[]>([
    { setNumber: 1, teamScore: 25, opponentScore: 20 },
    { setNumber: 2, teamScore: 25, opponentScore: 22 },
    { setNumber: 3, teamScore: 25, opponentScore: 19 }
  ]);
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // 1. Share / Export to WhatsApp / Messenger modal
  const [shareModalEvent, setShareModalEvent] = useState<EventItem | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // 2. Auto-Lineup Generator modal
  const [lineupModalEvent, setLineupModalEvent] = useState<EventItem | null>(null);
  const [generatedLineup, setGeneratedLineup] = useState<any>(null);
  const [savingLineup, setSavingLineup] = useState(false);

  // 3. Live Scorekeeper state
  const [liveModalEvent, setLiveModalEvent] = useState<EventItem | null>(null);
  const [liveTeamScore, setLiveTeamScore] = useState(0);
  const [liveOppScore, setLiveOppScore] = useState(0);
  const [liveCurrentSet, setLiveCurrentSet] = useState(1);
  const [liveSetsWonTeam, setLiveSetsWonTeam] = useState(0);
  const [liveSetsWonOpp, setLiveSetsWonOpp] = useState(0);
  const [liveFinishedSets, setLiveFinishedSets] = useState<VolleyballSet[]>([]);
  const [isServingTeam, setIsServingTeam] = useState(true);
  const [savingLiveScore, setSavingLiveScore] = useState(false);

  // 4. Social Media Post Generator modal
  const [socialModalEvent, setSocialModalEvent] = useState<EventItem | null>(null);
  const [socialBestAction, setSocialBestAction] = useState('');
  const [socialNotes, setSocialNotes] = useState('');
  const [copiedSocialText, setCopiedSocialText] = useState(false);

  const { isArchiveMode } = useSeasonArchive();
  const canManage = !isArchiveMode && Boolean(user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, eventsRes, leagueReportsRes, usersRes, leagueRes, tacRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/events'),
        fetch('/api/league-reports'),
        fetch('/api/users'),
        fetch('/api/league'),
        fetch('/api/tactics')
      ]);

      if (matchesRes.ok) {
        const m = await matchesRes.json();
        setMatches(m.matches || []);
      }
      if (eventsRes.ok) {
        const e = await eventsRes.json();
        setEvents(e.events || []);
      }
      if (leagueReportsRes.ok) {
        const lr = await leagueReportsRes.json();
        setLeagueReports(lr.reports || []);
        if (lr.leaderboards) {
          setLeaderboards(lr.leaderboards);
        }
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setPlayers(u.users.filter((usr: User) => usr.role === 'ZAWODNIK'));
      }
      if (leagueRes.ok) {
        const l = await leagueRes.json();
        setLeaguePhases(l.leaguePhases || []);
        setActiveLeaguePhaseId(l.activeLeaguePhaseId || 'faza_1');
        setImportPhaseTargetId(l.activeLeaguePhaseId || 'faza_1');
        setLeagueTable(l.leagueTable || []);
        setLeaguePhotos(l.leaguePhotos || []);
      }
      if (tacRes.ok) {
        const td = await tacRes.json();
        setTactics(td.tactics || []);
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

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      if (tab === 'mecze' || tab === 'liga') {
        setActiveTab('liga');
      } else if (tab === 'turnieje' || tab === 'sparingi') {
        setActiveTab(tab as TabType);
      }
    }
  }, [searchParams]);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/rozgrywki?tab=${tab}`);
  };

  // 1. Attendance declaration vote
  const handleAttendance = async (eventId: string, status: AttendanceStatus, note?: string) => {
    if (!user) {
      alert('Musisz być zalogowany, aby zadeklarować obecność');
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Open Result Input Modal
  const openResultModal = (event: EventItem) => {
    setResultModalEvent(event);
    if (event.result) {
      setResTeamSets(event.result.teamSetsWon);
      setResOppSets(event.result.opponentSetsWon);
      setResSetsList(event.result.sets && event.result.sets.length > 0 ? [...event.result.sets] : [
        { setNumber: 1, teamScore: 25, opponentScore: 20 },
        { setNumber: 2, teamScore: 25, opponentScore: 22 },
        { setNumber: 3, teamScore: 25, opponentScore: 18 }
      ]);
      setResMvp(event.result.mvp || '');
      setResNotes(event.result.notes || '');
      setResTournamentRank(event.result.tournamentRank || '');
    } else if (event.liveScore && event.liveScore.finishedSets && event.liveScore.finishedSets.length > 0) {
      const currentSets = [...event.liveScore.finishedSets];
      if (event.liveScore.teamCurrentScore > 0 || event.liveScore.opponentCurrentScore > 0) {
        currentSets.push({
          setNumber: event.liveScore.currentSet || (currentSets.length + 1),
          teamScore: event.liveScore.teamCurrentScore,
          opponentScore: event.liveScore.opponentCurrentScore
        });
      }
      setResSetsList(currentSets);
      setResTeamSets(event.liveScore.teamSetsWon || currentSets.filter(s => s.teamScore > s.opponentScore).length);
      setResOppSets(event.liveScore.opponentSetsWon || currentSets.filter(s => s.opponentScore > s.teamScore).length);
      setResMvp('');
      setResNotes('');
      setResTournamentRank('');
    } else {
      setResTeamSets(3);
      setResOppSets(1);
      setResSetsList([
        { setNumber: 1, teamScore: 25, opponentScore: 21 },
        { setNumber: 2, teamScore: 25, opponentScore: 19 },
        { setNumber: 3, teamScore: 22, opponentScore: 25 },
        { setNumber: 4, teamScore: 25, opponentScore: 18 }
      ]);
      setResMvp('');
      setResNotes('');
      setResTournamentRank('');
    }
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultModalEvent) return;
    setSubmittingResult(true);
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resultModalEvent.id,
          status: 'ZAKONCZONY',
          result: {
            teamSetsWon: resTeamSets,
            opponentSetsWon: resOppSets,
            sets: resSetsList,
            mvp: resMvp || undefined,
            notes: resNotes || undefined,
            tournamentRank: resTournamentRank || undefined
          },
          liveScore: resultModalEvent.liveScore ? {
            ...resultModalEvent.liveScore,
            isLive: false,
            updatedAt: new Date().toISOString()
          } : undefined
        })
      });
      if (res.ok) {
        setResultModalEvent(null);
        await fetchData();
        alert('Wynik meczu został pomyślnie zapisany!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu wyniku');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingResult(false);
    }
  };

  // Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEvent(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          type: eventTypeToCreate,
          date: eventDate,
          endDate: eventEndDate || undefined,
          location: eventLocation,
          opponent: eventOpponent || undefined,
          description: eventDescription,
          costPerPerson: Number(eventCost) || 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddEventModal(false);
        setEventTitle('');
        setEventOpponent('');
        setEventDescription('');
        setEventCost('0');
        await fetchData();
        alert(data.message || 'Wydarzenie zostało utworzone!');
      } else {
        alert(data.error || 'Błąd tworzenia wydarzenia');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingEvent(false);
    }
  };

  // --- NOWE FUNKCJE: EXPORT NA CHAT, AUTO-LINEUP, LIVE SCOREKEEPER, SOCIAL MEDIA ---

  // 1. Generator tekstu na WhatsApp / Messenger / Discord
  const generateChatAnnouncementText = (event: EventItem) => {
    const yesPlayers = event.attendees.filter(a => a.status === 'BEDE' && a.userRole === 'ZAWODNIK');
    const maybePlayers = event.attendees.filter(a => a.status === 'NIEPEWNE' && a.userRole === 'ZAWODNIK');
    const noPlayers = event.attendees.filter(a => a.status === 'NIE_BEDE' && a.userRole === 'ZAWODNIK');

    const d = new Date(event.date);
    const dateStr = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    const typeLabel = event.type === 'SPARING' ? 'SPARING KONTROLNY' : event.type === 'TURNIEJ' ? 'TURNIEJ SIATKARSKI' : 'TRENING';
    const opponentStr = event.opponent ? `vs ${event.opponent}` : '';

    let text = `🏐 *ANGELS ZTP — ${typeLabel}* 🏐\n`;
    text += `⚔️ *Mecz:* Angels ZTP ${opponentStr}\n`;
    text += `📅 *Termin:* ${dateStr}, godz. ${timeStr}\n`;
    text += `📍 *Hala:* ${event.location}\n\n`;

    text += `👥 *STATUS OBECNOŚCI (${yesPlayers.length} potwierdzonych):*\n`;
    text += `🟢 *Będą (${yesPlayers.length}):* ${yesPlayers.map(p => `${p.userName}${p.userNumber ? ` (#${p.userNumber})` : ''}`).join(', ') || 'brak'}\n`;
    if (maybePlayers.length > 0) {
      text += `🟡 *Niepewni (${maybePlayers.length}):* ${maybePlayers.map(p => `${p.userName}${p.note ? ` (${p.note})` : ''}`).join(', ')}\n`;
    }
    if (noPlayers.length > 0) {
      text += `🔴 *Nieobecni (${noPlayers.length}):* ${noPlayers.map(p => `${p.userName}${p.note ? ` (${p.note})` : ''}`).join(', ')}\n`;
    }

    if (yesPlayers.length < 6) {
      text += `\n⚠️ *UWAGA:* Mamy tylko ${yesPlayers.length} graczy! Potrzebujemy minimum 6 osób, aby rozegrać spotkanie! Prośba o szybkie deklaracje!\n`;
    } else {
      text += `\n✅ Skład meczowy skompletowany. Zbiórka w szatni 45 min przed gwizdkiem.\n`;
    }

    if (event.description) {
      text += `📋 *Wytyczne trenera:* ${event.description}\n`;
    }

    text += `\n📲 Potwierdź obecność w aplikacji: ${typeof window !== 'undefined' ? window.location.origin : 'https://angels-ztp.pl'}/rozgrywki`;
    return text;
  };

  const handleCopyChatText = (event: EventItem) => {
    const text = generateChatAnnouncementText(event);
    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 3000);
  };

  // 2. Automatyczny Generator Wyjściowej Szóstki
  const handleOpenAutoLineup = (event: EventItem) => {
    setLineupModalEvent(event);

    // Filter players who confirmed presence
    const declaredYesIds = event.attendees.filter(a => a.status === 'BEDE').map(a => a.userId);
    const availablePlayers = players.filter(p => declaredYesIds.includes(p.id));
    const pool = availablePlayers.length >= 6 ? availablePlayers : players; // fallback to full squad if few declared

    // Categorize by position
    const setters = pool.filter(p => p.position === 'Rozgrywający');
    const opposites = pool.filter(p => p.position === 'Atakujący');
    const outsides = pool.filter(p => p.position === 'Przyjmujący');
    const middles = pool.filter(p => p.position === 'Środkowy');
    const liberos = pool.filter(p => p.position === 'Libero');

    const setter = setters[0]?.name ? `${setters[0].name} (#${setters[0].number || 'R'})` : 'Brak (Wybierz)';
    const opposite = opposites[0]?.name ? `${opposites[0].name} (#${opposites[0].number || 'A'})` : 'Brak (Wybierz)';
    const outsideHitters = [
      outsides[0]?.name ? `${outsides[0].name} (#${outsides[0].number || 'P1'})` : 'Brak Przyjmującego 1',
      outsides[1]?.name ? `${outsides[1].name} (#${outsides[1].number || 'P2'})` : 'Brak Przyjmującego 2'
    ];
    const middleBlockers = [
      middles[0]?.name ? `${middles[0].name} (#${middles[0].number || 'Ś1'})` : 'Brak Środkowego 1',
      middles[1]?.name ? `${middles[1].name} (#${middles[1].number || 'Ś2'})` : 'Brak Środkowego 2'
    ];
    const libero = liberos[0]?.name ? `${liberos[0].name} (#${liberos[0].number || 'L'})` : (pool.find(p => p.position === 'Libero')?.name || 'Brak Libero');

    // Reserves
    const assignedNames = new Set([setter, opposite, ...outsideHitters, ...middleBlockers, libero]);
    const reserves = pool.filter(p => !Array.from(assignedNames).some(a => a.includes(p.name))).map(p => `${p.name} (#${p.number || '-'})`);

    const missingWarnings: string[] = [];
    if (setters.length === 0) missingWarnings.push('Brak nominalnego Rozgrywającego!');
    if (opposites.length === 0) missingWarnings.push('Brak nominalnego Atakującego!');
    if (outsides.length < 2) missingWarnings.push(`Tylko ${outsides.length}/2 Przyjmujących!`);
    if (middles.length < 2) missingWarnings.push(`Tylko ${middles.length}/2 Środkowych bloku!`);

    setGeneratedLineup({
      setter,
      opposite,
      outsideHitters,
      middleBlockers,
      libero,
      reserves,
      missingWarnings
    });
  };

  const handleSaveProposedLineup = async () => {
    if (!lineupModalEvent || !generatedLineup) return;
    setSavingLineup(true);
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lineupModalEvent.id,
          lineup: {
            setter: generatedLineup.setter,
            opposite: generatedLineup.opposite,
            outsideHitters: generatedLineup.outsideHitters,
            middleBlockers: generatedLineup.middleBlockers,
            libero: generatedLineup.libero,
            reserves: generatedLineup.reserves
          }
        })
      });
      if (res.ok) {
        setLineupModalEvent(null);
        await fetchData();
        alert('Optymalna wyjściowa szóstka została zapisana do meczu!');
      } else {
        alert('Błąd zapisu szóstki');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingLineup(false);
    }
  };

  // 3. Live Scorekeeper Handlers
  const handleOpenLiveScorekeeper = (event: EventItem) => {
    setLiveModalEvent(event);
    if (event.liveScore) {
      setLiveTeamScore(event.liveScore.teamCurrentScore || 0);
      setLiveOppScore(event.liveScore.opponentCurrentScore || 0);
      setLiveCurrentSet(event.liveScore.currentSet || 1);
      setLiveSetsWonTeam(event.liveScore.teamSetsWon || 0);
      setLiveSetsWonOpp(event.liveScore.opponentSetsWon || 0);
      setLiveFinishedSets(event.liveScore.finishedSets || []);
      setIsServingTeam(event.liveScore.isServingTeam ?? true);
    } else {
      setLiveTeamScore(0);
      setLiveOppScore(0);
      setLiveCurrentSet(1);
      setLiveSetsWonTeam(0);
      setLiveSetsWonOpp(0);
      setLiveFinishedSets([]);
      setIsServingTeam(true);
    }
  };

  const handleScoreChange = async (teamDelta: number, oppDelta: number) => {
    const newTeamScore = Math.max(0, liveTeamScore + teamDelta);
    const newOppScore = Math.max(0, liveOppScore + oppDelta);
    setLiveTeamScore(newTeamScore);
    setLiveOppScore(newOppScore);

    // Save live score asynchronously
    if (liveModalEvent) {
      try {
        await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: liveModalEvent.id,
            liveScore: {
              currentSet: liveCurrentSet,
              teamCurrentScore: newTeamScore,
              opponentCurrentScore: newOppScore,
              teamSetsWon: liveSetsWonTeam,
              opponentSetsWon: liveSetsWonOpp,
              finishedSets: liveFinishedSets,
              isServingTeam,
              isLive: true,
              updatedAt: new Date().toISOString()
            }
          })
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFinishLiveSet = async () => {
    const isTeamWonSet = liveTeamScore > liveOppScore;
    const newFinishedSet: VolleyballSet = {
      setNumber: liveCurrentSet,
      teamScore: liveTeamScore,
      opponentScore: liveOppScore
    };

    const newSets = [...liveFinishedSets, newFinishedSet];
    const newTeamWon = liveSetsWonTeam + (isTeamWonSet ? 1 : 0);
    const newOppWon = liveSetsWonOpp + (!isTeamWonSet ? 1 : 0);
    const nextSetNumber = liveCurrentSet + 1;

    setLiveFinishedSets(newSets);
    setLiveSetsWonTeam(newTeamWon);
    setLiveSetsWonOpp(newOppWon);
    setLiveCurrentSet(nextSetNumber);
    setLiveTeamScore(0);
    setLiveOppScore(0);

    if (liveModalEvent) {
      try {
        await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: liveModalEvent.id,
            liveScore: {
              currentSet: nextSetNumber,
              teamCurrentScore: 0,
              opponentCurrentScore: 0,
              teamSetsWon: newTeamWon,
              opponentSetsWon: newOppWon,
              finishedSets: newSets,
              isServingTeam: true,
              isLive: true,
              updatedAt: new Date().toISOString()
            }
          })
        });
        await fetchData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFinishLiveMatch = async () => {
    if (!liveModalEvent) return;
    if (!confirm('Czy zakończyć mecz na żywo i zapisać wynik w protokole?')) return;
    setSavingLiveScore(true);
    try {
      const finalSets = [...liveFinishedSets];
      if (liveTeamScore > 0 || liveOppScore > 0) {
        finalSets.push({
          setNumber: liveCurrentSet,
          teamScore: liveTeamScore,
          opponentScore: liveOppScore
        });
      }

      const teamWonCount = finalSets.filter(s => s.teamScore > s.opponentScore).length;
      const oppWonCount = finalSets.filter(s => s.opponentScore > s.teamScore).length;

      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: liveModalEvent.id,
          status: 'ZAKONCZONY',
          result: {
            teamSetsWon: teamWonCount,
            opponentSetsWon: oppWonCount,
            sets: finalSets,
            mvp: liveModalEvent.result?.mvp || 'Wybierz po meczu',
            notes: 'Mecz rozegrany z użyciem cyfrowego Live Scorekeepera Angels ZTP.'
          },
          liveScore: {
            currentSet: liveCurrentSet,
            teamCurrentScore: liveTeamScore,
            opponentCurrentScore: liveOppScore,
            teamSetsWon: teamWonCount,
            opponentSetsWon: oppWonCount,
            finishedSets: finalSets,
            isServingTeam: false,
            isLive: false,
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        setLiveModalEvent(null);
        await fetchData();
        alert('Mecz na żywo został zakończony i zapisany!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingLiveScore(false);
    }
  };

  // 4. Social Media Post Generator
  const generateSocialPostText = (event: EventItem) => {
    const opp = event.opponent || 'Rywal';
    const won = event.result ? event.result.teamSetsWon : 3;
    const lost = event.result ? event.result.opponentSetsWon : 1;
    const isWin = won > lost;

    const setsText = event.result?.sets
      ? event.result.sets.map(s => `${s.teamScore}:${s.opponentScore}`).join(', ')
      : '25:21, 25:19, 21:25, 25:18';

    let text = `${isWin ? '🔥 ZWYCIĘSTWO ANGELS ZTP! 🦅🏐' : '⚔️ WALKA DO SAMEGO KOŃCA! 🏐'}\n\n`;
    text += `W dzisiejszym ${event.type === 'SPARING' ? 'sparingu kontrolnym' : 'meczu'} ${isWin ? 'pokonujemy' : 'ulegamy zespołowi'} ${opp}!\n\n`;
    text += `📊 WYNIK MECZU:\n`;
    text += `ANGELS ZTP ${won} : ${lost} ${opp}\n`;
    text += `(${setsText})\n\n`;

    if (event.result?.mvp) {
      text += `⭐ MVP MECZU: ${event.result.mvp}\n`;
    }
    if (socialBestAction) {
      text += `💥 AKCJA MECZU: ${socialBestAction}\n`;
    }
    if (socialNotes || event.result?.notes) {
      text += `💬 KOMENTARZ SZTABU: "${socialNotes || event.result?.notes}"\n`;
    }

    text += `\nDziękujemy wszystkim za obecność i walkę na parkiecie! Kolejne wyzwanie już wkrótce!\n\n`;
    text += `#AngelsZTP #Volleyball #Siatkowka #Matchday #Sparing #VolleyLife #KrakowSiatkowka #Zwyciestwo`;
    return text;
  };

  const handleCopySocialPost = (event: EventItem) => {
    const text = generateSocialPostText(event);
    navigator.clipboard.writeText(text);
    setCopiedSocialText(true);
    setTimeout(() => setCopiedSocialText(false), 3000);
  };

  // 5. Direct File Upload for League Photos & Series
  const handleMultiplePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loaded = 0;
    const newItems: Array<{ url: string; title?: string }> = [];

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const base64Url = ev.target?.result as string;
        newItems.push({
          url: base64Url,
          title: file.name.replace(/\.[^/.]+$/, "")
        });
        loaded++;
        if (loaded === fileList.length) {
          setPhotoSeriesList(prev => [...prev, ...newItems]);
          if (!photoSeriesTitle) {
            setPhotoSeriesTitle(photoMatch ? `Fotorelacja: ${photoMatch}` : `Seria zdjęć (${new Date().toLocaleDateString('pl-PL')})`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleMultiplePhotosUpload(e);
  };

  const handleRemoveFromSeries = (idx: number) => {
    setPhotoSeriesList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photoSeriesList.length === 0 && !photoUrl) {
      alert('Wybierz przynajmniej jedno zdjęcie lub wklej link!');
      return;
    }

    setSubmittingPhoto(true);
    try {
      const allPhotos = [...photoSeriesList];
      if (photoUrl && !allPhotos.some(p => p.url === photoUrl)) {
        allPhotos.push({ url: photoUrl, title: photoTitle || 'Zdjęcie ligowe' });
      }

      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PHOTOS_BATCH',
          photos: allPhotos,
          seriesTitle: photoSeriesTitle || photoTitle || photoMatch || 'Seria zdjęć',
          category: photoCategory,
          matchName: photoMatch,
          eventId: photoLinkedEventId || undefined,
          caption: photoCaption
        })
      });

      if (res.ok) {
        setShowAddPhotoModal(false);
        setPhotoSeriesList([]);
        setPhotoUrl('');
        setPhotoTitle('');
        setPhotoMatch('');
        setPhotoCaption('');
        setPhotoSeriesTitle('');
        setPhotoLinkedEventId('');
        await fetchData();
        alert('Zdjęcia zostały pomyślnie dodane do galerii!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd dodawania zdjęć');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił problem podczas zapisywania zdjęć');
    } finally {
      setSubmittingPhoto(false);
    }
  };

  // Add League Match
  const handleAddLeagueMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchOpponent || !matchDate) return;
    setSubmittingMatch(true);
    try {
      const selectedPhase = leaguePhases.find(p => p.id === matchPhaseId) || currentLeaguePhase;
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponent: matchOpponent,
          date: matchDate,
          location: matchLocation,
          isHome: matchIsHome,
          matchType: 'Mecz ligowy',
          sets: manualMatchSets,
          mvp: matchMvp || undefined,
          notes: matchNotes || undefined,
          leaguePhaseId: selectedPhase?.id,
          leaguePhaseName: selectedPhase?.name
        })
      });
      if (res.ok) {
        setShowAddMatchModal(false);
        setMatchOpponent('');
        setMatchMvp('');
        setMatchNotes('');
        await fetchData();
        alert('Mecz ligowy został pomyślnie zapisany!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu meczu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingMatch(false);
    }
  };

  const handleImportVolleyStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volleyStationRawInput.trim()) {
      alert('Wklej tekst ze statystykami lub terminarzem z VolleyStation!');
      return;
    }
    setSubmittingVolleyStation(true);
    try {
      const res = await fetch('/api/league-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: volleyStationRawInput,
          autoCreateMatch: volleyStationAutoCreate,
          leaguePhaseId: importPhaseTargetId,
          leaguePhaseName: leaguePhases.find(p => p.id === importPhaseTargetId)?.name
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Pomyślnie zaimportowano dane z VolleyStation!');
        setVolleyStationRawInput('');
        setShowVolleyStationImportModal(false);
        await fetchData();
      } else {
        alert(data.error || 'Błąd podczas importu danych z VolleyStation');
      }
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas wysyłania danych do serwera');
    } finally {
      setSubmittingVolleyStation(false);
    }
  };

  const currentLeaguePhase = useMemo(() => {
    return leaguePhases.find(p => p.id === activeLeaguePhaseId) || leaguePhases[0] || null;
  }, [leaguePhases, activeLeaguePhaseId]);

  const handleSwitchPhase = async (phaseId: string) => {
    setActiveLeaguePhaseId(phaseId);
    setImportPhaseTargetId(phaseId);
    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SWITCH_PHASE', phaseId })
      });
      if (res.ok) {
        const p = leaguePhases.find(ph => ph.id === phaseId);
        if (p && p.table) {
          setLeagueTable(p.table);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditTable = (phaseId: string) => {
    const targetPhase = leaguePhases.find(p => p.id === phaseId) || currentLeaguePhase;
    setEditingTablePhaseId(targetPhase?.id || 'faza_1');
    setTableRows(targetPhase?.table ? JSON.parse(JSON.stringify(targetPhase.table)) : []);
    setRawTableInput('');
    setShowEditTableModal(true);
  };

  const handleSaveTable = async () => {
    setSavingTable(true);
    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TABLE',
          phaseId: editingTablePhaseId,
          table: tableRows
        })
      });
      if (res.ok) {
        setShowEditTableModal(false);
        await fetchData();
        alert('Tabela ligowa została pomyślnie zaktualizowana!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu tabeli');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTable(false);
    }
  };

  const handleParseRawTable = () => {
    if (!rawTableInput.trim()) return;
    const lines = rawTableInput.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: LeagueTableTeam[] = [];
    
    lines.forEach((line, idx) => {
      const parts = line.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const pos = parseInt(parts[0]) || (parsed.length + 1);
        const teamName = isNaN(parseInt(parts[0])) ? parts[0] : parts[1];
        const matches = parseInt(parts[2]) || 0;
        const pts = parseInt(parts[3]) || 0;
        parsed.push({
          id: `team_${Date.now()}_${idx}`,
          position: pos,
          teamName: teamName || `Drużyna ${idx + 1}`,
          matchesPlayed: matches,
          points: pts,
          setsWon: 0,
          setsLost: 0,
          pointsWon: 0,
          pointsLost: 0,
          form: []
        });
      }
    });

    if (parsed.length > 0) {
      setTableRows(parsed);
      alert(`Wczytano ${parsed.length} zespołów do tabeli!`);
    } else {
      alert('Nie udało się automatycznie rozpoznać kolumn tabeli. Możesz edytować wiersze ręcznie.');
    }
  };

  const handleMoveTableRow = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === tableRows.length - 1)) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newRows = [...tableRows];
    const temp = newRows[idx];
    newRows[idx] = newRows[targetIdx];
    newRows[targetIdx] = temp;
    newRows.forEach((r, i) => {
      r.position = i + 1;
    });
    setTableRows(newRows);
  };

  const handleUpdateTableRow = (idx: number, field: keyof LeagueTableTeam, value: any) => {
    const newRows = [...tableRows];
    newRows[idx] = {
      ...newRows[idx],
      [field]: value
    };
    setTableRows(newRows);
  };

  const handleDeleteTableRow = (idx: number) => {
    const newRows = tableRows.filter((_, i) => i !== idx);
    newRows.forEach((r, i) => {
      r.position = i + 1;
    });
    setTableRows(newRows);
  };

  const handleAddTableRow = () => {
    const nextPos = tableRows.length + 1;
    const newRow: LeagueTableTeam = {
      id: `team_${Date.now()}_${nextPos}`,
      position: nextPos,
      teamName: `Nowy Zespół ${nextPos}`,
      matchesPlayed: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      form: []
    };
    setTableRows([...tableRows, newRow]);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten protokół meczowy?')) return;
    try {
      const res = await fetch(`/api/league-reports?id=${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sparringsList = events.filter(e => {
    if (e.type !== 'SPARING') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !(e.opponent && e.opponent.toLowerCase().includes(q))) return false;
    }
    if (statusFilter === 'UPCOMING' && e.result) return false;
    if (statusFilter === 'FINISHED' && !e.result) return false;
    return true;
  });

  const tournamentsList = events.filter(e => {
    if (e.type !== 'TURNIEJ') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !(e.opponent && e.opponent.toLowerCase().includes(q))) return false;
    }
    if (statusFilter === 'UPCOMING' && e.result) return false;
    if (statusFilter === 'FINISHED' && !e.result) return false;
    return true;
  });

  const leagueMatchesList = matches.filter(m => {
    if (m.matchType !== 'Mecz ligowy') return false;
    if (selectedPhaseFilter !== 'ALL') {
      const matchPhase = m.leaguePhaseId || 'faza_1';
      if (matchPhase !== selectedPhaseFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.opponent.toLowerCase().includes(q)) return false;
    }
    const isFinished = (m.sets && m.sets.length > 0) || (m.teamSetsWon > 0 || m.opponentSetsWon > 0);
    if (statusFilter === 'UPCOMING' && isFinished) return false;
    if (statusFilter === 'FINISHED' && !isFinished) return false;
    return true;
  });

  const [sparringsPage, setSparringsPage] = useState(1);
  const [tournamentsPage, setTournamentsPage] = useState(1);
  const [leagueMatchesPage, setLeagueMatchesPage] = useState(1);
  const [photosPage, setPhotosPage] = useState(1);
  const SPARRINGS_PER_PAGE = 3;
  const TOURNAMENTS_PER_PAGE = 3;
  const LEAGUE_MATCHES_PER_PAGE = 5;
  const PHOTOS_PER_PAGE = 6;

  useEffect(() => {
    setSparringsPage(1);
    setTournamentsPage(1);
    setLeagueMatchesPage(1);
  }, [searchQuery, statusFilter, activeTab, selectedPhaseFilter]);

  const totalSparringsPages = Math.ceil(sparringsList.length / SPARRINGS_PER_PAGE) || 1;
  const paginatedSparrings = sparringsList.slice((sparringsPage - 1) * SPARRINGS_PER_PAGE, sparringsPage * SPARRINGS_PER_PAGE);

  const totalTournamentsPages = Math.ceil(tournamentsList.length / TOURNAMENTS_PER_PAGE) || 1;
  const paginatedTournaments = tournamentsList.slice((tournamentsPage - 1) * TOURNAMENTS_PER_PAGE, tournamentsPage * TOURNAMENTS_PER_PAGE);

  const totalLeagueMatchesPages = Math.ceil(leagueMatchesList.length / LEAGUE_MATCHES_PER_PAGE) || 1;
  const paginatedLeagueMatches = leagueMatchesList.slice((leagueMatchesPage - 1) * LEAGUE_MATCHES_PER_PAGE, leagueMatchesPage * LEAGUE_MATCHES_PER_PAGE);

  const leagueOnlyPhotos: LeaguePhoto[] = useMemo(() => {
    return leaguePhotos.filter((p: LeaguePhoto) => !p.category || p.category === 'MECZ');
  }, [leaguePhotos]);

  const sparingOnlyPhotos: LeaguePhoto[] = useMemo(() => {
    return leaguePhotos.filter((p: LeaguePhoto) => p.category === 'SPARING');
  }, [leaguePhotos]);

  const tournamentOnlyPhotos: LeaguePhoto[] = useMemo(() => {
    return leaguePhotos.filter((p: LeaguePhoto) => p.category === 'TURNIEJ');
  }, [leaguePhotos]);

  const currentTabPhotos: LeaguePhoto[] = useMemo(() => {
    if (activeTab === 'sparingi') return sparingOnlyPhotos;
    if (activeTab === 'turnieje') return tournamentOnlyPhotos;
    return leagueOnlyPhotos;
  }, [activeTab, sparingOnlyPhotos, tournamentOnlyPhotos, leagueOnlyPhotos]);

  useEffect(() => {
    setPhotosPage(1);
  }, [activeTab, ligaSubTab, sparingSubTab, turniejSubTab]);

  const totalPhotosPages = Math.ceil(currentTabPhotos.length / PHOTOS_PER_PAGE) || 1;
  const paginatedPhotos = currentTabPhotos.slice((photosPage - 1) * PHOTOS_PER_PAGE, photosPage * PHOTOS_PER_PAGE);

  const renderPhotoGallerySection = (
    photos: LeaguePhoto[],
    title: string,
    subtitle: string,
    categoryType: 'MECZ' | 'SPARING' | 'TURNIEJ',
    accentColor: 'sky' | 'amber' | 'purple',
    emptyText: string,
    onAddClick: () => void
  ) => {
    const isSky = accentColor === 'sky';
    const isAmber = accentColor === 'amber';
    const isPurple = accentColor === 'purple';

    const btnClass = isSky
      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
      : isAmber
      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
      : 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20';

    const iconColor = isSky ? 'text-sky-400' : isAmber ? 'text-amber-400' : 'text-purple-400';

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Camera className={`w-5 h-5 ${iconColor}`} />
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>

          {canManage && (
            <button
              onClick={onAddClick}
              className={`px-4 py-2 rounded-xl ${btnClass} font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-1.5`}
            >
              <Camera className="w-4 h-4" />
              <span>+ Dodaj Serię Zdjęć</span>
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0b0e14] border border-slate-800 space-y-3">
            <Camera className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">Brak zdjęć w tej galerii</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {emptyText}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPhotos.map((photo: LeaguePhoto) => {
              const isT = photo.category === 'TURNIEJ';
              const isS = photo.category === 'SPARING';

              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhotoPreview(photo)}
                  className="bg-[#0b0e14] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl group cursor-pointer hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border shadow-md ${
                        isT
                          ? 'bg-purple-950/90 text-purple-300 border-purple-500/40'
                          : isS
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                          : 'bg-sky-950/90 text-sky-300 border-sky-500/40'
                      }`}>
                        {isT ? '🏆 Turniej' : isS ? '⚔️ Sparing' : '🏐 Mecz LALS'}
                      </span>

                      {photo.seriesTitle && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/70 text-slate-200 border border-white/10 backdrop-blur-sm truncate max-w-[150px]">
                          📁 {photo.seriesTitle}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-bold uppercase text-amber-300 tracking-wider block truncate">
                        {photo.matchName || (isT ? 'Turniej Siatkarski' : isS ? 'Sparing Kontrolny' : 'Mecz Ligowy LALS')}
                      </span>
                      <h4 className="text-sm font-black text-white line-clamp-1">{photo.title}</h4>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs text-slate-400">
                    {photo.caption && <p className="text-slate-300 leading-snug line-clamp-2">{photo.caption}</p>}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                      <span>{photo.date}</span>
                      <span className="truncate max-w-[140px]">{photo.uploadedBy}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Photos Pagination */}
        {totalPhotosPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#0b0e14] border border-slate-800 rounded-2xl shadow-lg">
            <span className="text-xs text-slate-400 font-medium">
              Wyświetlanie <span className="text-white font-bold">{((photosPage - 1) * PHOTOS_PER_PAGE) + 1}</span>–<span className="text-white font-bold">{Math.min(photosPage * PHOTOS_PER_PAGE, photos.length)}</span> z <span className="text-white font-bold">{photos.length}</span> zdjęć
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPhotosPage(p => Math.max(1, p - 1))}
                disabled={photosPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Poprzednia strona"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPhotosPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPhotosPage(idx + 1)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                      photosPage === idx + 1
                        ? isSky
                          ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                          : isPurple
                          ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                          : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPhotosPage(p => Math.min(totalPhotosPages, p + 1))}
                disabled={photosPage === totalPhotosPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Następna strona"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 pb-24 md:pb-16 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 glow-cyan">
            <Volleyball className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-gradient-cyan">
              Rozgrywki & Mecze
            </h1>
            <p className="text-xs text-slate-400">
              Oficjalne mecze ligowe LALS, sparingi przedsezonowe i turnieje siatkarskie
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Filters Bar */}
      <div className="cyber-card rounded-2xl p-3 sm:p-4 border border-sky-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span>Filtry</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-slate-950 font-black text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition underline underline-offset-2 ml-1"
              >
                Wyczyść filtry
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Szukaj meczu / rywala..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {showFilters && (
          <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'Wszystkie' },
              { id: 'UPCOMING', label: 'Nadchodzące' },
              { id: 'FINISHED', label: 'Zakończone z wynikiem' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  statusFilter === s.id
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. TAB: SPARINGI */}
      {activeTab === 'sparingi' && (
        <div className="space-y-6">
          {/* Sparing Subtabs (Mecze & Protokoły, Zdjęcia ze Sparingów) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setSparingSubTab('mecze')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  sparingSubTab === 'mecze'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Mecze & Protokoły ({sparringsList.length})
              </button>
              <button
                onClick={() => setSparingSubTab('zdjecia')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  sparingSubTab === 'zdjecia'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Zdjęcia ze Sparingów ({sparingOnlyPhotos.length})
              </button>
            </div>

            {canManage && sparingSubTab === 'mecze' && (
              <button
                onClick={() => {
                  setEventTypeToCreate('SPARING');
                  setEventTitle('Sparing kontrolny');
                  setShowAddEventModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Utwórz Sparing
              </button>
            )}

            {canManage && sparingSubTab === 'zdjecia' && (
              <button
                onClick={() => {
                  setPhotoCategory('SPARING');
                  setPhotoTitle('');
                  setPhotoMatch('');
                  setPhotoSeriesList([]);
                  setShowAddPhotoModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
              >
                <Camera className="w-4 h-4" />
                + Dodaj Zdjęcia ze Sparingów
              </button>
            )}
          </div>

          {sparingSubTab === 'mecze' && (
            <div className="space-y-6">

          {/* Sparing Cards List */}
          <div className="space-y-6">
            {sparringsList.length === 0 ? (
              <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                Brak zaplanowanych sparingów. Kliknij "Utwórz Sparing" powyżej.
              </div>
            ) : (
              paginatedSparrings.map(event => {
                const yesCount = event.attendees.filter(a => a.status === 'BEDE' && a.userRole === 'ZAWODNIK').length;
                const noCount = event.attendees.filter(a => a.status === 'NIE_BEDE' && a.userRole === 'ZAWODNIK').length;
                const maybeCount = event.attendees.filter(a => a.status === 'NIEPEWNE' && a.userRole === 'ZAWODNIK').length;
                const myAttendance = event.attendees.find(a => a.userId === user?.id);
                const isFinished = Boolean(event.result);

                const isExpanded = Boolean(expandedSparrings[event.id]);

                return (
                  <div
                    key={event.id}
                    className="bg-[#0b0e14] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300"
                  >
                    {/* Zwijany Nagłówek Karty Sparingowej */}
                    <div
                      onClick={() => toggleSparring(event.id)}
                      className="p-5 sm:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none hover:bg-slate-900/50 transition group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            SPARING
                          </span>
                          {isFinished ? (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Zakończony
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300">
                              Zgłoszenia w toku
                            </span>
                          )}
                          {event.liveScore?.isLive && (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              🔴 NA ŻYWO: Set {event.liveScore.currentSet} ({event.liveScore.teamCurrentScore}:{event.liveScore.opponentCurrentScore})
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-400 transition tracking-tight truncate">
                          {event.title} {event.opponent ? `vs ${event.opponent}` : ''}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Clock className="w-4 h-4 text-sky-400" />
                            {new Date(event.date).toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-4 h-4 text-rose-400" />
                            {event.location}
                          </span>
                        </div>
                      </div>

                      {/* Prawa strona nagłówka: Wynik, Licznik obecnych i Przełącznik Chevron */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t border-slate-800/60 lg:border-t-0">
                        {isFinished && event.result && (
                          <div className="text-right px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-lg font-mono font-black text-emerald-400 block leading-tight">
                              {event.result.teamSetsWon} : {event.result.opponentSetsWon}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              Wynik
                            </span>
                          </div>
                        )}

                        <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>{yesCount} obecnych</span>
                        </span>

                        <div
                          className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-all duration-200 ${
                            isExpanded ? 'rotate-180 bg-amber-500/10 text-amber-400 border-amber-500/40' : 'group-hover:text-white group-hover:border-slate-700'
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Rozwijana Zawartość Karty Sparingowej */}
                    {isExpanded && (
                      <div className="p-6 sm:p-7 border-t border-slate-800/80 space-y-6 animate-fadeIn">
                        {/* Coach & Captain Management Controls */}
                        {canManage && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                              Zarządzanie Sparingiem:
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => setShareModalEvent(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5"
                                title="Wygeneruj i skopiuj gotowy raport na WhatsApp / Messenger"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Na Czat</span>
                              </button>

                              <button
                                onClick={() => handleOpenAutoLineup(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
                                title="Automatycznie wygeneruj wyjściową szóstkę"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>Szóstka</span>
                              </button>

                              <button
                                onClick={() => handleOpenLiveScorekeeper(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition flex items-center gap-1.5"
                                title="Opcjonalnie: klikaj punkt po punkcie na żywo w trakcie sparingu"
                              >
                                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                <span>Live Score (opcjonalnie)</span>
                              </button>

                              {isFinished && (
                                <button
                                  onClick={() => setSocialModalEvent(event)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5"
                                  title="Wygeneruj post do Social Mediów"
                                >
                                  <Award className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Social Post</span>
                                </button>
                              )}

                              <button
                                onClick={() => openResultModal(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5"
                                title="Wpisz wynik po sparingu (bez klikania każdego punktu)"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                {isFinished ? 'Edytuj wynik' : 'Wpisz wynik po sparingu'}
                              </button>
                            </div>
                          </div>
                        )}

                    {/* Step 1: Ankieta Dostępności (RSVP) */}
                    <div className="p-4 rounded-2xl bg-[#0c1016] border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                            1
                          </span>
                          <h4 className="text-xs font-black uppercase text-white tracking-wider">
                            Ankieta Dostępności Zawodników
                          </h4>
                        </div>

                        {/* Player Vote Buttons OR Coach Banner */}
                        {user && (
                          user.role === 'TRENER' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
                              <Flame className="w-3.5 h-3.5 text-sky-400" />
                              <span>Sztab trenerski (Obecność stała)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAttendance(event.id, 'BEDE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                                  myAttendance?.status === 'BEDE'
                                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                                    : 'bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Będę
                              </button>
                              <button
                                onClick={() => handleAttendance(event.id, 'NIEPEWNE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                                  myAttendance?.status === 'NIEPEWNE'
                                    ? 'bg-amber-500 text-slate-950 shadow-md'
                                    : 'bg-slate-900 text-amber-400 border border-amber-500/30 hover:bg-amber-500/10'
                                }`}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                Niepewny
                              </button>
                              <button
                                onClick={() => handleAttendance(event.id, 'NIE_BEDE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                                  myAttendance?.status === 'NIE_BEDE'
                                    ? 'bg-rose-500 text-white shadow-md'
                                    : 'bg-slate-900 text-rose-400 border border-rose-500/30 hover:bg-rose-500/10'
                                }`}
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                Nie będę
                              </button>
                            </div>
                          )
                        )}
                      </div>

                      {/* Declaration Progress & Details */}
                      <div className="flex items-center gap-4 text-xs pt-2">
                        <span className="font-bold text-emerald-400">🟢 Będą: {yesCount}</span>
                        <span className="font-bold text-amber-400">🟡 Niepewni: {maybeCount}</span>
                        <span className="font-bold text-rose-400">🔴 Nieobecni: {noCount}</span>
                      </div>

                      {/* Declared players list */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {event.attendees.map(a => (
                          <span
                            key={a.userId}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${
                              a.status === 'BEDE'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : a.status === 'NIEPEWNE'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <span>{a.userName}</span>
                            {a.note && <span className="text-[10px] text-slate-400">({a.note})</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Wyjściowa Szóstka Meczu */}
                    {event.lineup && (
                      <div className="p-4 rounded-2xl bg-[#0c1016] border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                              ⚡
                            </span>
                            <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider">
                              Oficjalna Wyjściowa Szóstka Meczu
                            </h4>
                          </div>
                          {canManage && (
                            <button
                              onClick={() => handleOpenAutoLineup(event)}
                              className="text-xs text-amber-400 hover:underline font-bold"
                            >
                              Zmień szóstkę
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">Rozgrywający (R)</span>
                            <span className="font-bold text-sky-300">{event.lineup.setter}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">Atakujący (A)</span>
                            <span className="font-bold text-rose-300">{event.lineup.opposite}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">Przyjmujący (P1, P2)</span>
                            <span className="font-bold text-emerald-300">{event.lineup.outsideHitters?.join(', ')}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">Środkowi (Ś1, Ś2)</span>
                            <span className="font-bold text-purple-300">{event.lineup.middleBlockers?.join(', ')}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">Libero (L)</span>
                            <span className="font-bold text-amber-300">{event.lineup.libero}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">Rezerwowi</span>
                            <span className="font-medium text-slate-400 truncate block">{event.lineup.reserves?.slice(0, 3).join(', ') || 'Brak'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Wynik Sparingi (Score & Sets) */}
                    <div className="p-4 rounded-2xl bg-[#0c1016] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                            2
                          </span>
                          <h4 className="text-xs font-black uppercase text-white tracking-wider">
                            Wynik Sparingi (Podsumowanie pomeczowe)
                          </h4>
                        </div>

                        {canManage && (
                          <button
                            onClick={() => openResultModal(event)}
                            className="text-xs text-amber-400 hover:underline font-bold"
                          >
                            {isFinished ? 'Edytuj wynik' : 'Wpisz wynik'}
                          </button>
                        )}
                      </div>

                      {isFinished ? (
                        <div className="space-y-4 pt-1">
                          <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                            <div className="text-3xl font-black font-mono text-emerald-400">
                              {event.result!.teamSetsWon} : {event.result!.opponentSetsWon}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-400 uppercase">
                                Wyniki setów:
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {event.result!.sets.map(s => (
                                  <span
                                    key={s.setNumber}
                                    className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-white"
                                  >
                                    Set {s.setNumber}: {s.teamScore}-{s.opponentScore}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {event.result!.mvp && (
                            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                              <Trophy className="w-4 h-4 text-amber-400" />
                              <span>MVP Sparingi: <strong>{event.result!.mvp}</strong></span>
                            </div>
                          )}

                          {event.result!.notes && (
                            <p className="text-xs text-slate-300 italic bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                              💬 Wnioski pomeczowe: {event.result!.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Wynik i sety zostaną wpisane po zakończeniu sparingu.
                        </p>
                      )}
                    </div>

                    {/* Auto-Linked Tactical Snapshots & Accepted Player Suggestions */}
                    {(() => {
                      const linkedTactics = tactics.filter(t => t.eventId === event.id || t.matchId === event.id);
                      if (linkedTactics.length === 0) return null;
                      return (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/30 via-slate-900/60 to-[#0c1016] border border-sky-500/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-sky-400" />
                              <h4 className="text-xs font-black uppercase text-sky-300 tracking-wider">
                                📸 Zrzuty Taktyczne & Wytyczne Trenera na ten Mecz ({linkedTactics.length})
                              </h4>
                            </div>
                            <a
                              href={`/taktyka?eventId=${event.id}&type=SPARING`}
                              className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                            >
                              <span>Otwórz w Tablicy Taktycznej</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {linkedTactics.map(tac => {
                              const acceptedPosts = (tac.posts || []).filter(p => p.status === 'ZAAKCEPTOWANY');
                              return (
                                <div key={tac.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
                                  {tac.drawingData && (
                                    <div className="aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative">
                                      <img src={tac.drawingData} alt={tac.title} className="w-full h-full object-contain" />
                                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-black text-amber-400 border border-slate-700">
                                        {tac.rotation} • {tac.phase}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="font-black text-xs text-white">{tac.title}</h5>
                                    {tac.description && (
                                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                                        {tac.description}
                                      </p>
                                    )}
                                    <a
                                      href={`/taktyka?eventId=${event.id}&tacticId=${tac.id}`}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 mt-1.5"
                                    >
                                      <span>Załaduj ten zrzut na tablicę →</span>
                                    </a>
                                  </div>

                                  {/* Accepted player posts */}
                                  {acceptedPosts.length > 0 && (
                                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                                      <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-400" />
                                        Zaakceptowane uwagi zawodników do meczu:
                                      </span>
                                      {acceptedPosts.map(p => (
                                        <div key={p.id} className="text-[11px] text-slate-300 pl-1">
                                          • <strong className="text-white">{p.authorName}:</strong> {p.content}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sparing Pagination Controls */}
          {totalSparringsPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#0b0e14] border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs text-slate-400 font-medium">
                Wyświetlanie <span className="text-white font-bold">{((sparringsPage - 1) * SPARRINGS_PER_PAGE) + 1}</span>–<span className="text-white font-bold">{Math.min(sparringsPage * SPARRINGS_PER_PAGE, sparringsList.length)}</span> z <span className="text-white font-bold">{sparringsList.length}</span> sparingów
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSparringsPage(p => Math.max(1, p - 1))}
                  disabled={sparringsPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Poprzednia strona"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalSparringsPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSparringsPage(idx + 1)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                        sparringsPage === idx + 1
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSparringsPage(p => Math.min(totalSparringsPages, p + 1))}
                  disabled={sparringsPage === totalSparringsPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Następna strona"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </div>
        )}

        {sparingSubTab === 'zdjecia' && (
          renderPhotoGallerySection(
            sparingOnlyPhotos,
            'Fotorelacje ze Sparingów',
            'Serie zdjęć i galerie z meczów sparingowych zespołu Angels ZTP.',
            'SPARING',
            'amber',
            'Brak zdjęć ze sparingów. Użyj przycisku "+ Dodaj Serię Zdjęć" powyżej.',
            () => {
              setPhotoCategory('SPARING');
              setPhotoTitle('');
              setPhotoMatch('');
              setPhotoSeriesList([]);
              setShowAddPhotoModal(true);
            }
          )
        )}
      </div>
    )}

      {/* 2. TAB: LIGA */}
      {activeTab === 'liga' && (
        <div className="space-y-6">
          {/* Liga Subtabs (Tabela, Wyniki, Statystyki, Zdjęcia) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setLigaSubTab('tabela')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  ligaSubTab === 'tabela'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Tabela Ligowa
              </button>
              <button
                onClick={() => setLigaSubTab('wyniki')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  ligaSubTab === 'wyniki'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Volleyball className="w-3.5 h-3.5" />
                Wyniki & Terminarz
              </button>
              <button
                onClick={() => setLigaSubTab('statystyki')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  ligaSubTab === 'statystyki'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Statystyki & VolleyStation
              </button>
              <button
                onClick={() => setLigaSubTab('zdjecia')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  ligaSubTab === 'zdjecia'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Zdjęcia Ligowe ({leagueOnlyPhotos.length})
              </button>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                {ligaSubTab === 'wyniki' && (
                  <button
                    onClick={() => setShowAddMatchModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Dodaj Wynik Meczu
                  </button>
                )}
                {ligaSubTab === 'zdjecia' && (
                  <button
                    onClick={() => {
                      setPhotoCategory('MECZ');
                      setPhotoTitle('');
                      setPhotoMatch('');
                      setPhotoSeriesList([]);
                      setShowAddPhotoModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition shadow-md shadow-sky-500/20"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    + Dodaj Zdjęcia z Meczu LALS
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SubTab 1: TABELA LIGOWA */}
          {ligaSubTab === 'tabela' && (
            <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-slate-900 border border-sky-400/50 shadow-lg shrink-0 overflow-hidden">
                    <img
                      src="/lals_logo.png"
                      alt="Logo LALS"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                        Lubońska Amatorska Liga Siatkówki (LALS)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {currentLeaguePhase?.shortName || 'Faza I'}: {currentLeaguePhase?.advancementSpots === 3 ? 'Top 3 Awans' : 'Grupa Finałowa'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Oficjalne rozgrywki LALS • Klasyfikacja punktowa, bilans setów i małych punktów.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {canManage && !isArchiveMode && (
                    <button
                      onClick={() => handleOpenEditTable(currentLeaguePhase?.id || 'faza_1')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition flex items-center gap-1.5 shadow-md"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Edytuj Tabelę</span>
                    </button>
                  )}

                  <a
                    href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-sky-400 hover:text-white transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>Terminarz LALS w VolleyStation ↗</span>
                  </a>
                </div>
              </div>

              {/* Phase Switcher Navigation Ribbon */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0 mr-1">
                    Faza / Grupa:
                  </span>
                  {(leaguePhases.length > 0 ? leaguePhases : [
                    { id: 'faza_1', name: 'Faza I: Grupa Eliminacyjna (Top 3 awans)', shortName: 'Faza I (Eliminacje)', advancementSpots: 3 },
                    { id: 'faza_2', name: 'Faza II: Grupa Finałowa (7 zespołów)', shortName: 'Faza II (Grupa Finałowa)', advancementSpots: 1 }
                  ]).map((phase: any) => {
                    const isSelected = (phase.id === activeLeaguePhaseId);
                    const isFaza1 = phase.id === 'faza_1';
                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => handleSwitchPhase(phase.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 border ${
                          isSelected
                            ? isFaza1
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                        }`}
                      >
                        {isFaza1 ? (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500/50'}`}></span>
                        ) : (
                          <Trophy className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                        )}
                        <span>{phase.name}</span>
                        {isFaza1 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                            Awans: 3
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                  <span className="font-bold text-slate-300">
                    Liczba zespołów w grupie: <strong className="text-white font-mono">{leagueTable.length}</strong>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Poz.</th>
                      <th className="py-3 px-4">Drużyna</th>
                      <th className="py-3 px-2 text-center">Mecze</th>
                      <th className="py-3 px-2 text-center font-black text-white">Punkty</th>
                      <th className="py-3 px-3 text-center">Sety (W:P)</th>
                      <th className="py-3 px-3 text-center">Małe Punkty</th>
                      <th className="py-3 px-4 text-center">Forma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {leagueTable.map((team, idx) => {
                      const isAngels = team.teamName.toLowerCase().includes('angels');
                      const advSpots = currentLeaguePhase?.advancementSpots ?? 3;
                      const isAdvancing = currentLeaguePhase?.id === 'faza_1' ? (team.position <= advSpots) : false;
                      const isFinalMedalist = currentLeaguePhase?.id === 'faza_2' && team.position <= 3;

                      return (
                        <React.Fragment key={team.id || idx}>
                          <tr
                            className={`hover:bg-slate-900/50 transition ${
                              isAngels ? 'bg-sky-500/10 font-bold' : ''
                            } ${isAdvancing ? 'bg-emerald-500/5' : ''}`}
                          >
                            <td className="py-3.5 px-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                                isAdvancing
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                                  : isFinalMedalist
                                  ? team.position === 1 ? 'bg-amber-400 text-slate-950 font-black' : team.position === 2 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                                  : idx === 0
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {team.position}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-sans font-black text-white text-sm flex items-center gap-2 flex-wrap">
                              <span>{team.teamName}</span>
                              {isAngels && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                  Nasz Klub
                                </span>
                              )}
                              {isAdvancing && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                  <span>🟢 Awans (Top 3)</span>
                                </span>
                              )}
                              {currentLeaguePhase?.id === 'faza_2' && team.position === 1 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  🥇 Mistrz LALS
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-2 text-center text-slate-300">{team.matchesPlayed}</td>
                            <td className="py-3.5 px-2 text-center text-sm font-black text-amber-400">{team.points}</td>
                            <td className="py-3.5 px-3 text-center text-slate-300">
                              {team.setsWon} : {team.setsLost}
                            </td>
                            <td className="py-3.5 px-3 text-center text-slate-400">
                              {team.pointsWon} : {team.pointsLost}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {(team.form || []).map((f, i) => (
                                  <span
                                    key={i}
                                    className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                                      f === 'W' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                    }`}
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>

                          {/* Linia oddzielająca strefę awansu dla Fazy 1 po 3. pozycji */}
                          {currentLeaguePhase?.id === 'faza_1' && team.position === advSpots && (
                            <tr className="bg-emerald-950/30 border-y-2 border-emerald-500/40">
                              <td colSpan={7} className="py-2.5 px-4">
                                <div className="flex items-center justify-between gap-3 text-xs font-black uppercase text-emerald-300">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>▲ STREFA AWANSU: 3 DRUŻYNY Z TEJ GRUPY WYCHODZĄ DALEJ ▲</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-emerald-400/80 lowercase">
                                    miejsca 1–3 &rarr; grupa finałowa (7 zespołów)
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Informative Rules Footer */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    {currentLeaguePhase?.id === 'faza_1' ? (
                      <>
                        <strong>Format Fazy I:</strong> W naszej grupie występuje <strong>7 zespołów</strong>. Zgodnie z regulaminem LALS, <strong>3 najlepsze drużyny (miejsca 1–3)</strong> uzyskują awans do <strong>7-zespołowej Grupy Finałowej</strong>, która zagra o mistrzostwo ligi.
                      </>
                    ) : (
                      <>
                        <strong>Format Fazy II:</strong> <strong>7 najlepszych zespołów</strong> (w tym 3 z naszej grupy eliminacyjnej) rywalizuje systemem ligowym o tytuł <strong>Mistrza Lubońskiej Ligi Siatkówki (LALS)</strong>.
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    Aktualizacja: Sezon 2026/27
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: WYNIKI I TERMINARZ */}
          {ligaSubTab === 'wyniki' && (
            <div className="space-y-4">
              {/* Phase Filter for Matches */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0 mr-1">
                    Filtruj wg Fazy:
                  </span>
                  <button
                    onClick={() => setSelectedPhaseFilter('ALL')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition shrink-0 ${
                      selectedPhaseFilter === 'ALL'
                        ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Wszystkie fazy ({matches.filter(m => m.matchType === 'Mecz ligowy').length})
                  </button>
                  {(leaguePhases.length > 0 ? leaguePhases : [
                    { id: 'faza_1', name: 'Faza I: Grupa Eliminacyjna', shortName: 'Faza I' },
                    { id: 'faza_2', name: 'Faza II: Grupa Finałowa', shortName: 'Faza II' }
                  ]).map((p: any) => {
                    const count = matches.filter(m => m.matchType === 'Mecz ligowy' && (m.leaguePhaseId === p.id || (!m.leaguePhaseId && p.id === 'faza_1'))).length;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPhaseFilter(p.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 ${
                          selectedPhaseFilter === p.id
                            ? p.id === 'faza_1'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{p.shortName || p.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400">
                  Pokazano: <strong className="text-white font-mono">{leagueMatchesList.length}</strong> spotkań
                </div>
              </div>

              {leagueMatchesList.length === 0 ? (
                <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                  Brak meczów ligowych spełniających kryteria.
                </div>
              ) : (
                paginatedLeagueMatches.map(match => {
                  const isExpanded = Boolean(expandedMatches[match.id]);
                  const isWin = match.teamSetsWon > match.opponentSetsWon;

                  return (
                    <div
                      key={match.id}
                      className="bg-[#0b0e14] border border-sky-500/30 rounded-3xl overflow-hidden shadow-xl transition-all duration-300"
                    >
                      {/* Zwijany Nagłówek Meczu Ligowego */}
                      <div
                        onClick={() => toggleMatch(match.id)}
                        className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-900/50 transition group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              {match.isHome ? 'Mecz Domowy' : 'Wyjazd'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 border border-sky-500/30 text-sky-300">
                              <img src="/lals_logo.png" alt="LALS" className="w-3.5 h-3.5 rounded-full object-contain" />
                              <span>LALS</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              match.leaguePhaseId === 'faza_2'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {match.leaguePhaseId === 'faza_2' ? 'Faza II (Finałowa)' : 'Faza I (Eliminacje)'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(match.date).toLocaleDateString('pl-PL')} • {match.location}
                            </span>
                          </div>

                          <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-sky-300 transition truncate">
                            Angels ZTP vs {match.opponent}
                          </h3>
                        </div>

                        {/* Wynik i Chevron po prawej */}
                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t border-slate-800/60 md:border-t-0">
                          <div className="text-right">
                            <span className={`text-2xl sm:text-3xl font-black font-mono block leading-tight ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {match.teamSetsWon} : {match.opponentSetsWon}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isWin ? 'ZWYCIĘSTWO' : 'PORAŻKA'}
                            </span>
                          </div>

                          <div
                            className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-all duration-200 ${
                              isExpanded ? 'rotate-180 bg-sky-500/10 text-sky-400 border-sky-500/40' : 'group-hover:text-white group-hover:border-slate-700'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Rozwijana zawartość meczu ligowego */}
                      {isExpanded && (
                        <div className="p-5 sm:p-6 border-t border-slate-800/80 space-y-4 bg-[#080c14] animate-fadeIn">
                          {/* Sety */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              Przebieg i Wyniki Setów:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {match.sets.map(s => (
                                <span
                                  key={s.setNumber}
                                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-200 shadow-sm"
                                >
                                  Set {s.setNumber}: <strong className="text-white">{s.teamScore}</strong>:<strong className="text-white">{s.opponentScore}</strong>
                                </span>
                              ))}
                            </div>
                          </div>

                          {match.mvp && (
                            <div className="text-xs text-amber-300 font-bold flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>Najlepszy zawodnik meczu (MVP): <strong className="text-white">{match.mvp}</strong></span>
                            </div>
                          )}

                          {match.notes && (
                            <div className="text-xs text-slate-300 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Raport meczowy i uwagi:</span>
                              {match.notes}
                            </div>
                          )}

                          {/* Auto-Linked Tactical Snapshots to this League Match */}
                          {(() => {
                            const linked = tactics.filter(t => t.matchId === match.id);
                            if (linked.length === 0) return null;
                            return (
                              <div className="pt-3 border-t border-slate-800 w-full space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black uppercase text-sky-400 flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5" />
                                    📸 Zrzut Taktyczny Trenera do tego Meczu: {linked[0].title}
                                  </span>
                                  <a href={`/taktyka?matchId=${match.id}&tacticId=${linked[0].id}`} className="text-[11px] text-sky-400 font-bold hover:underline">
                                    Zobacz w tablicy →
                                  </a>
                                </div>
                                {linked[0].drawingData && (
                                  <div className="aspect-[21/9] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 max-h-36">
                                    <img src={linked[0].drawingData} alt={linked[0].title} className="w-full h-full object-contain" />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* League Matches Pagination Controls */}
              {totalLeagueMatchesPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#0b0e14] border border-slate-800 rounded-2xl shadow-lg">
                  <span className="text-xs text-slate-400 font-medium">
                    Wyświetlanie <span className="text-white font-bold">{((leagueMatchesPage - 1) * LEAGUE_MATCHES_PER_PAGE) + 1}</span>–<span className="text-white font-bold">{Math.min(leagueMatchesPage * LEAGUE_MATCHES_PER_PAGE, leagueMatchesList.length)}</span> z <span className="text-white font-bold">{leagueMatchesList.length}</span> meczów ligowych
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setLeagueMatchesPage(p => Math.max(1, p - 1))}
                      disabled={leagueMatchesPage === 1}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Poprzednia strona"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalLeagueMatchesPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLeagueMatchesPage(idx + 1)}
                          className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                            leagueMatchesPage === idx + 1
                              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setLeagueMatchesPage(p => Math.min(totalLeagueMatchesPages, p + 1))}
                      disabled={leagueMatchesPage === totalLeagueMatchesPages}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Następna strona"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SubTab 3: STATYSTYKI & VOLLEYSTATION */}
          {ligaSubTab === 'statystyki' && (
            <div className="space-y-6">
              {/* Header with Title and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-[#0b0e14] border border-slate-800 rounded-3xl shadow-xl">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sky-400" />
                    Statystyki VolleyStation & Liderzy Ligi
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Oficjalne dane meczowe, protokoły punktowe i rankingi indywidualne z ligi LALS.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowVolleyStationImportModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-sky-500/20"
                    >
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>Importuj z VolleyStation</span>
                    </button>
                  )}

                  <a
                    href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Terminarz LALS (VolleyStation) ↗</span>
                  </a>
                </div>
              </div>

              {/* 4 Summary KPI Cards for Angels ZTP */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Mecze w LALS</span>
                    <Volleyball className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-athletic">
                    {leagueReports.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Zaimportowane protokoły
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Lider Punktowy (ABS)</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400 truncate font-athletic">
                    {leaderboards?.angelsScorers?.[0]?.name || 'Brak danych'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {leaderboards?.angelsScorers?.[0]
                      ? `${leaderboards.angelsScorers[0].totalPoints} pkt (${leaderboards.angelsScorers[0].matchesPlayed} mecze)`
                      : 'Zaimportuj protokoły'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Król Bloku (Blk)</span>
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 truncate font-athletic">
                    {leaderboards?.angelsBlockers?.[0]?.name || 'Brak danych'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {leaderboards?.angelsBlockers?.[0]
                      ? `${leaderboards.angelsBlockers[0].totalBlock} punktowych bloków`
                      : 'Brak danych'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0e14] border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">As Serwisowy (Ser)</span>
                    <Zap className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-400 truncate font-athletic">
                    {leaderboards?.angelsServers?.[0]?.name || 'Brak danych'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {leaderboards?.angelsServers?.[0]
                      ? `${leaderboards.angelsServers[0].totalServe} asów serwisowych`
                      : 'Brak danych'}
                  </div>
                </div>
              </div>

              {/* Leaderboards Section (Liderzy Ligi / Zespołu) */}
              {leaderboards && (
                <div className="p-5 sm:p-6 bg-[#0b0e14] border border-slate-800 rounded-3xl shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <h4 className="text-base font-black text-white uppercase tracking-tight">
                        Rankingi Indywidualne
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setLeaderboardScope('ANGELS')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition ${
                          leaderboardScope === 'ANGELS'
                            ? 'bg-sky-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        👼 Tylko Angels ZTP
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeaderboardScope('LIGA')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition ${
                          leaderboardScope === 'LIGA'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🌐 Cała Liga LALS
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* 1. Najwięcej Punktów */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" /> Punkty (ABS)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsScorers : leaderboards.topScorers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-white truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-amber-400 shrink-0">{p.totalPoints} pkt</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Punkty z Ataku */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-sky-400 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> Atak (Ata)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsAttackers : leaderboards.topAttackers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-sky-400' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-white truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-sky-400 shrink-0">{p.totalAttack} pkt</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Bloki Punktowe */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> Blok (Blk)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsBlockers : leaderboards.topBlockers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-white truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-emerald-400 shrink-0">{p.totalBlock} blk</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. Asy Serwisowe */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Zagrywka (Ser)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsServers : leaderboards.topServers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-rose-400' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-white truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-rose-400 shrink-0">{p.totalServe} asów</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Reports List (Protokoły Meczowe) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    Protokoły Meczowe VolleyStation ({leagueReports.length})
                  </h4>
                </div>

                {leagueReports.length === 0 ? (
                  <div className="p-12 text-center bg-[#0b0e14] border border-slate-800 rounded-3xl space-y-3">
                    <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
                    <h5 className="text-base font-bold text-white">Brak zapisanych protokołów</h5>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Użyj przycisku &quot;Importuj z VolleyStation&quot; powyżej, aby wkleić statystyki lub terminarz skopiowany bezpośrednio ze strony ligi.
                    </p>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setShowVolleyStationImportModal(true)}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition"
                      >
                        Wklej dane z VolleyStation
                      </button>
                    )}
                  </div>
                ) : (
                  leagueReports.map(rep => {
                    const isExpanded = Boolean(expandedReports[rep.id]);
                    const isOurTeamHome = rep.homeTeam?.teamName?.toLowerCase().includes('angel');
                    const isOurTeamAway = rep.awayTeam?.teamName?.toLowerCase().includes('angel');
                    const ourSets = isOurTeamHome ? rep.homeSetsWon : (isOurTeamAway ? rep.awaySetsWon : undefined);
                    const oppSets = isOurTeamHome ? rep.awaySetsWon : (isOurTeamAway ? rep.homeSetsWon : undefined);
                    const isWin = ourSets !== undefined && oppSets !== undefined && ourSets > oppSets;

                    return (
                      <div
                        key={rep.id}
                        className="bg-[#0b0e14] border border-slate-800 rounded-3xl shadow-xl overflow-hidden transition"
                      >
                        {/* Header Row */}
                        <div
                          onClick={() => toggleReport(rep.id)}
                          className="p-4 sm:p-5 cursor-pointer hover:bg-slate-900/50 transition flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                              <Volleyball className="w-5 h-5 text-sky-400" />
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {(rep.round || rep.matchNumber) && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-slate-900 text-sky-400 border border-slate-800">
                                    {rep.round ? `Runda ${rep.round}` : ''} {rep.matchNumber ? `Nr ${rep.matchNumber}` : ''}
                                  </span>
                                )}
                                <span className="text-[11px] font-mono text-slate-400">
                                  {new Date(rep.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {ourSets !== undefined && oppSets !== undefined && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                    isWin
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  }`}>
                                    {isWin ? '✓ Wygrana' : '✗ Przegrana'}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-base font-black text-white truncate">
                                {rep.matchTitle}
                              </h4>
                            </div>
                          </div>

                          {/* Sets, Meta Badges & Actions */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Sets score breakdown */}
                            {rep.sets && rep.sets.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                                {rep.sets.map((s, idx) => (
                                  <span key={s.setNumber}>
                                    {idx > 0 && <span className="text-slate-600">, </span>}
                                    <span className={s.homeScore > s.awayScore ? 'text-sky-300 font-black' : 'text-slate-400'}>{s.homeScore}</span>
                                    :<span className={s.awayScore > s.homeScore ? 'text-sky-300 font-black' : 'text-slate-400'}>{s.awayScore}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {rep.duration && (
                              <span className="px-2 py-1 rounded-xl bg-slate-900 text-[10px] font-bold text-slate-400 border border-slate-800 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-400" />
                                {rep.duration}
                              </span>
                            )}

                            {rep.mvp && (
                              <span className="px-2 py-1 rounded-xl bg-amber-500/15 text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-400" />
                                {rep.mvp.name}
                              </span>
                            )}

                            {rep.volleyStationUrl && (
                              <a
                                href={rep.volleyStationUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition"
                                title="Otwórz oficjalny protokół w VolleyStation"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {canManage && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteReport(rep.id);
                                }}
                                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                                title="Usuń ten raport"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <div className="p-1 text-slate-400">
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Detailed Stats Tables */}
                        {isExpanded && (
                          <div className="p-4 sm:p-6 bg-slate-950/60 border-t border-slate-800 space-y-6 animate-fadeIn">
                            {/* Meta Bar: Sędzia, Widzowie, Czas */}
                            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80 gap-2">
                              <div className="flex items-center gap-3">
                                {rep.referee && <span>👔 <strong>Pierwszy sędzia:</strong> {rep.referee}</span>}
                                {rep.spectators !== undefined && <span>👥 <strong>Widzów:</strong> {rep.spectators}</span>}
                              </div>
                              {rep.mvp && (
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                  <Crown className="w-3.5 h-3.5" />
                                  MVP Meczu: {rep.mvp.number ? `#${rep.mvp.number} ` : ''}{rep.mvp.name} ({rep.mvp.teamName || 'MVP'})
                                </span>
                              )}
                            </div>

                            {/* Tables Grid: Home Team and Away Team */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {[rep.homeTeam, rep.awayTeam].map((team, tIdx) => {
                                if (!team) return null;
                                const isAngels = team.teamName?.toLowerCase().includes('angel');
                                return (
                                  <div
                                    key={team.teamName || tIdx}
                                    className={`rounded-2xl border p-4 space-y-3 ${
                                      isAngels
                                        ? 'bg-sky-950/20 border-sky-500/30 shadow-lg'
                                        : 'bg-slate-900/40 border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                      <h5 className="text-sm font-black text-white flex items-center gap-2">
                                        {isAngels && <span className="w-2 h-2 rounded-full bg-sky-400" />}
                                        {team.teamName}
                                      </h5>
                                      <span className="text-xs font-mono font-black text-amber-400">
                                        {team.totals?.points || 0} pkt
                                      </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[9px] tracking-wider">
                                          <tr>
                                            <th className="p-1.5 w-7 text-center">#</th>
                                            <th className="p-1.5">Zawodnik</th>
                                            <th className="p-1.5 text-center font-black text-amber-400">ABS</th>
                                            <th className="p-1.5 text-center">Ata</th>
                                            <th className="p-1.5 text-center">Blk</th>
                                            <th className="p-1.5 text-center">Ser</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40 font-mono">
                                          {(team.players || []).map(p => (
                                            <tr key={p.name} className="hover:bg-slate-900/60 transition">
                                              <td className="p-1.5 text-center text-sky-400 font-bold">{p.number}</td>
                                              <td className="p-1.5 font-sans font-bold text-white truncate max-w-[140px]">
                                                {p.name}
                                                {rep.mvp?.name && rep.mvp.name.toLowerCase() === p.name.toLowerCase() && (
                                                  <span className="ml-1 text-[9px] text-amber-400 font-black">⭐ MVP</span>
                                                )}
                                              </td>
                                              <td className="p-1.5 text-center font-black text-amber-400">{p.points}</td>
                                              <td className="p-1.5 text-center text-slate-300">{p.attack}</td>
                                              <td className="p-1.5 text-center text-slate-300">{p.block}</td>
                                              <td className="p-1.5 text-center text-slate-300">{p.serve}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        {team.totals && (
                                          <tfoot className="bg-slate-950/90 font-mono font-black text-white border-t border-slate-700">
                                            <tr>
                                              <td colSpan={2} className="p-2 font-sans font-black uppercase text-[10px] text-slate-400">
                                                Razem
                                              </td>
                                              <td className="p-2 text-center text-amber-400 font-black">{team.totals.points}</td>
                                              <td className="p-2 text-center">{team.totals.attack}</td>
                                              <td className="p-2 text-center">{team.totals.block}</td>
                                              <td className="p-2 text-center">{team.totals.serve}</td>
                                            </tr>
                                            {team.totals.opponentErrors !== undefined && (
                                              <tr>
                                                <td colSpan={6} className="p-1.5 text-[10px] text-slate-500 font-sans text-right">
                                                  Błędy przeciwnika: <strong className="text-slate-300">{team.totals.opponentErrors}</strong>
                                                </td>
                                              </tr>
                                            )}
                                          </tfoot>
                                        )}
                                      </table>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SubTab 4: ZDJĘCIA LIGOWE & SERIE */}
          {ligaSubTab === 'zdjecia' && (
            renderPhotoGallerySection(
              leagueOnlyPhotos,
              'Fotorelacje z Meczów Ligowych LALS',
              'Oficjalne serie zdjęć wyłącznie z meczów ligowych LALS zespołu Angels ZTP.',
              'MECZ',
              'sky',
              'Brak zdjęć z meczów ligowych. Użyj przycisku "+ Dodaj Serię Zdjęć" powyżej.',
              () => {
                setPhotoCategory('MECZ');
                setPhotoTitle('');
                setPhotoMatch('');
                setPhotoSeriesList([]);
                setShowAddPhotoModal(true);
              }
            )
          )}
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: TURNIEJE */}
      {activeTab === 'turnieje' && (
        <div className="space-y-6">
          {/* Turniej Subtabs (Drabinki & Wyniki, Zdjęcia z Turniejów) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setTurniejSubTab('drabinki')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  turniejSubTab === 'drabinki'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Turnieje & Drabinki ({tournamentsList.length})
              </button>
              <button
                onClick={() => setTurniejSubTab('zdjecia')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  turniejSubTab === 'zdjecia'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Zdjęcia z Turniejów ({tournamentOnlyPhotos.length})
              </button>
            </div>

            {canManage && turniejSubTab === 'drabinki' && (
              <button
                onClick={() => {
                  setEventTypeToCreate('TURNIEJ');
                  setEventTitle('Turniej Siatkarski');
                  setShowAddEventModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-500 hover:bg-purple-400 text-slate-950 transition shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" />
                Utwórz Turniej
              </button>
            )}

            {canManage && turniejSubTab === 'zdjecia' && (
              <button
                onClick={() => {
                  setPhotoCategory('TURNIEJ');
                  setPhotoTitle('');
                  setPhotoMatch('');
                  setPhotoSeriesList([]);
                  setShowAddPhotoModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-500 hover:bg-purple-400 text-white transition shadow-lg shadow-purple-500/20"
              >
                <Camera className="w-4 h-4" />
                + Dodaj Zdjęcia z Turnieju
              </button>
            )}
          </div>

          {turniejSubTab === 'drabinki' && (
            <div className="space-y-6">

          <div className="space-y-6">
            {tournamentsList.length === 0 ? (
              <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                Brak zaplanowanych turniejów.
              </div>
            ) : (
              paginatedTournaments.map(event => {
                const yesCount = event.attendees.filter(a => a.status === 'BEDE').length;
                const myAttendance = event.attendees.find(a => a.userId === user?.id);
                const isFinished = Boolean(event.result);
                const isExpanded = Boolean(expandedTournaments[event.id]);

                return (
                  <div
                    key={event.id}
                    className="bg-[#0b0e14] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300"
                  >
                    {/* Zwijany Nagłówek Turnieju */}
                    <div
                      onClick={() => toggleTournament(event.id)}
                      className="p-5 sm:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none hover:bg-slate-900/50 transition group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            TURNIEJ
                          </span>
                          {isFinished ? (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Rozegrany
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              Zgłoszenia otwarte
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-purple-300 transition tracking-tight truncate">
                          {event.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            {new Date(event.date).toLocaleDateString('pl-PL')}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-4 h-4 text-rose-400" />
                            {event.location}
                          </span>
                          {event.costPerPerson && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300">
                              💰 {event.costPerPerson} zł / os.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prawa strona nagłówka turnieju: Wynik/Puchar, Liczba zgłoszonych, Chevron */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t border-slate-800/60 lg:border-t-0">
                        {isFinished && event.result && (
                          <div className="text-right px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30">
                            <span className="text-sm font-black text-purple-200 block">
                              🏆 {event.result.tournamentRank || 'Podium'}
                            </span>
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">
                              Wynik
                            </span>
                          </div>
                        )}

                        <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span>{yesCount} chętnych</span>
                        </span>

                        <div
                          className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-all duration-200 ${
                            isExpanded ? 'rotate-180 bg-purple-500/10 text-purple-400 border-purple-500/40' : 'group-hover:text-white group-hover:border-slate-700'
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Rozwijana Zawartość Turnieju */}
                    {isExpanded && (
                      <div className="p-6 sm:p-7 border-t border-slate-800/80 space-y-6 animate-fadeIn">
                        {canManage && (
                          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                              Zarządzanie Turniejem:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openResultModal(event)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-purple-400 border border-purple-500/30 transition"
                              >
                                Wpisz wynik & miejsce
                              </button>
                            </div>
                          </div>
                        )}

                    {/* Step 1: Ankieta zgłoszeń na turniej */}
                    <div className="p-4 rounded-2xl bg-[#0c1016] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-white tracking-wider">
                          1. Deklaracja udziału ({yesCount} chętnych)
                        </span>
                        {user && (
                          user.role === 'TRENER' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                              <Flame className="w-3.5 h-3.5 text-purple-400" />
                              <span>Sztab trenerski (Prowadzący)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAttendance(event.id, 'BEDE')}
                                className={`px-3 py-1 rounded-xl text-xs font-black ${
                                  myAttendance?.status === 'BEDE' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-emerald-400'
                                }`}
                              >
                                Jadę na turniej
                              </button>
                              <button
                                onClick={() => handleAttendance(event.id, 'NIE_BEDE')}
                                className={`px-3 py-1 rounded-xl text-xs font-black ${
                                  myAttendance?.status === 'NIE_BEDE' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-rose-400'
                                }`}
                              >
                                Nie jadę
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Step 3: Wynik turnieju & Puchar */}
                    {isFinished && event.result && (
                      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                        <span className="text-xs font-black uppercase text-purple-300 tracking-wider block">
                          3. Wynik Turnieju & Miejsce
                        </span>
                        <div className="text-lg font-black text-white">
                          🏆 {event.result.tournamentRank || 'Podium'}
                        </div>
                        {event.result.notes && <p className="text-xs text-slate-300">{event.result.notes}</p>}
                      </div>
                    )}

                    {/* Auto-Linked Tactical Snapshots to Tournament */}
                    {(() => {
                      const linked = tactics.filter(t => t.eventId === event.id);
                      if (linked.length === 0) return null;
                      return (
                        <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-sky-400 flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5" />
                              📸 Zrzut Taktyczny na Turniej: {linked[0].title}
                            </span>
                            <a href={`/taktyka?eventId=${event.id}&tacticId=${linked[0].id}`} className="text-xs text-sky-400 font-bold hover:underline">
                              Otwórz w Tablicy →
                            </a>
                          </div>
                          {linked[0].drawingData && (
                            <div className="aspect-[21/9] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 max-h-36">
                              <img src={linked[0].drawingData} alt={linked[0].title} className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Turnieje Pagination Controls */}
          {totalTournamentsPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#0b0e14] border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs text-slate-400 font-medium">
                Wyświetlanie <span className="text-white font-bold">{((tournamentsPage - 1) * TOURNAMENTS_PER_PAGE) + 1}</span>–<span className="text-white font-bold">{Math.min(tournamentsPage * TOURNAMENTS_PER_PAGE, tournamentsList.length)}</span> z <span className="text-white font-bold">{tournamentsList.length}</span> turniejów
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTournamentsPage(p => Math.max(1, p - 1))}
                  disabled={tournamentsPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Poprzednia strona"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalTournamentsPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTournamentsPage(idx + 1)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                        tournamentsPage === idx + 1
                          ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setTournamentsPage(p => Math.min(totalTournamentsPages, p + 1))}
                  disabled={tournamentsPage === totalTournamentsPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Następna strona"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </div>
        )}

        {turniejSubTab === 'zdjecia' && (
          renderPhotoGallerySection(
            tournamentOnlyPhotos,
            'Fotorelacje z Turniejów',
            'Serie zdjęć i galerie z turniejów siatkarskich, dekoracji i pucharów.',
            'TURNIEJ',
            'purple',
            'Brak zdjęć z turniejów. Użyj przycisku "+ Dodaj Serię Zdjęć" powyżej.',
            () => {
              setPhotoCategory('TURNIEJ');
              setPhotoTitle('');
              setPhotoMatch('');
              setPhotoSeriesList([]);
              setShowAddPhotoModal(true);
            }
          )
        )}
      </div>
    )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Wprowadzanie / Edycja Wyniku */}
      {resultModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Wynik Spotkania: {resultModalEvent.title}
              </h3>
              <button onClick={() => setResultModalEvent(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4">
              {/* Informacyjny banner o opcjonalności Live Score */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Możesz wpisać końcowy wynik sparingu bezpośrednio tutaj po meczu. Prowadzenie <strong>Live Score</strong> (punkt po punkcie w trakcie gry) jest w pełni opcjonalne.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sety Angels ZTP</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={resTeamSets}
                    onChange={e => setResTeamSets(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-mono font-black text-emerald-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sety Rywala</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={resOppSets}
                    onChange={e => setResOppSets(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-center text-xl font-mono font-black text-rose-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Set by set inputs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">Małe punkty w setach:</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum = resSetsList.length + 1;
                        setResSetsList([...resSetsList, { setNumber: nextNum, teamScore: 25, opponentScore: 20 }]);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-bold"
                    >
                      + Dodaj set
                    </button>
                    {resSetsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setResSetsList(resSetsList.slice(0, -1))}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold"
                      >
                        - Usuń set
                      </button>
                    )}
                  </div>
                </div>
                {resSetsList.map((set, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-14 font-bold text-slate-400">Set {idx + 1}:</span>
                    <input
                      type="number"
                      value={set.teamScore}
                      onChange={e => {
                        const copy = [...resSetsList];
                        copy[idx].teamScore = Number(e.target.value);
                        setResSetsList(copy);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-slate-500 font-bold">-</span>
                    <input
                      type="number"
                      value={set.opponentScore}
                      onChange={e => {
                        const copy = [...resSetsList];
                        copy[idx].opponentScore = Number(e.target.value);
                        setResSetsList(copy);
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">MVP Meczu</label>
                <select
                  value={resMvp}
                  onChange={e => setResMvp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="">Wybierz MVP spośród zawodników...</option>
                  {players.map(p => (
                    <option key={p.id} value={`${p.name} (${p.position})`}>
                      #{p.number} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              {resultModalEvent.type === 'TURNIEJ' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Miejsce końcowe w turnieju</label>
                  <input
                    type="text"
                    value={resTournamentRank}
                    onChange={e => setResTournamentRank(e.target.value)}
                    placeholder="np. 1. miejsce (Złoty puchar)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notatki trenera / wnioski</label>
                <textarea
                  rows={2}
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)}
                  placeholder="Kluczowe zagrania, elementy do poprawy..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResultModalEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingResult}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                >
                  {submittingResult ? 'Zapisywanie...' : 'Zapisz Wynik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dodaj Wydarzenie (Sparing / Turniej) */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black uppercase text-white">
                Nowy {eventTypeToCreate === 'SPARING' ? 'Sparing' : 'Turniej'}
              </h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tytuł wydarzenia *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Przeciwnik / Zaproszone zespoły</label>
                <input
                  type="text"
                  placeholder="np. Trefl Gdańsk II"
                  value={eventOpponent}
                  onChange={e => setEventOpponent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Data i godzina *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Miejsce / Hala *</label>
                  <input
                    type="text"
                    required
                    value={eventLocation}
                    onChange={e => setEventLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Opis / Zbiórka</label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={e => setEventDescription(e.target.value)}
                  placeholder="Godzina zbiórki, stroje meczowe..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
                >
                  Utwórz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dodaj Serię Zdjęć do Galerii */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black uppercase text-white">
                  Dodaj Serię Zdjęć / Fotorelację
                </h3>
              </div>
              <button onClick={() => setShowAddPhotoModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-4">
              {/* Wybór kategorii dopasowany do aktywnej zakładki */}
              {activeTab === 'liga' ? (
                <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="font-bold text-white">Galeria Ligowa LALS</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">(Zdjęcia trafią wyłącznie do sekcji ligowej)</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300 font-bold px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/30">
                    MECZ LIGOWY
                  </span>
                </div>
              ) : activeTab === 'sparingi' ? (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-white">Fotorelacje ze Sparingów</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">(Zdjęcia trafią wyłącznie do sekcji sparingowej)</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                    SPARING
                  </span>
                </div>
              ) : activeTab === 'turnieje' ? (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="font-bold text-white">Fotorelacje Turniejowe</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">(Zdjęcia trafią wyłącznie do sekcji turniejowej)</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    TURNIEJ
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Typ Wydarzenia *</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('MECZ')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'MECZ'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Mecz LALS
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('SPARING')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'SPARING'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Sparing
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('TURNIEJ')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'TURNIEJ'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Turniej
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('INNE')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'INNE'
                          ? 'bg-slate-700 text-white border-slate-600'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Inne
                    </button>
                  </div>
                </div>
              )}

              {/* Szybkie powiązanie z konkretnym meczem lub wydarzeniem */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Powiąż z konkretnym meczem / wydarzeniem</label>
                <select
                  value={photoLinkedEventId}
                  onChange={e => {
                    const selId = e.target.value;
                    setPhotoLinkedEventId(selId);
                    if (selId) {
                      const matchedEvt = events.find(ev => ev.id === selId);
                      const matchedMatch = matches.find(m => m.id === selId);
                      if (matchedEvt) {
                        setPhotoMatch(matchedEvt.title);
                        if (!photoSeriesTitle) setPhotoSeriesTitle(`Fotorelacja: ${matchedEvt.title}`);
                      } else if (matchedMatch) {
                        const mTitle = `${matchedMatch.matchType || 'Mecz'}: Angels ZTP vs ${matchedMatch.opponent}`;
                        setPhotoMatch(mTitle);
                        if (!photoSeriesTitle) setPhotoSeriesTitle(`Fotorelacja: ${mTitle}`);
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Wybierz z kalendarza lub wpisz ręcznie poniżej --</option>
                  
                  {matches.filter(m => activeTab === 'sparingi' ? m.matchType === 'Sparing' : activeTab === 'turnieje' ? false : m.matchType !== 'Sparing').length > 0 && (
                    <optgroup label={activeTab === 'sparingi' ? '⚔️ Sparingi' : '🏐 Oficjalne Mecze LALS'}>
                      {matches
                        .filter(m => activeTab === 'sparingi' ? m.matchType === 'Sparing' : activeTab === 'turnieje' ? false : m.matchType !== 'Sparing')
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.date} — {m.matchType}: Angels vs {m.opponent} ({m.teamSetsWon}:{m.opponentSetsWon})
                          </option>
                        ))}
                    </optgroup>
                  )}

                  {events.filter(ev => activeTab === 'sparingi' ? ev.type === 'SPARING' : activeTab === 'turnieje' ? ev.type === 'TURNIEJ' : ev.type === 'MECZ').length > 0 && (
                    <optgroup label={activeTab === 'turnieje' ? '🏆 Turnieje z Kalendarza' : activeTab === 'sparingi' ? '⚔️ Sparingi z Kalendarza' : '📅 Mecze Ligowe z Kalendarza'}>
                      {events
                        .filter(ev => activeTab === 'sparingi' ? ev.type === 'SPARING' : activeTab === 'turnieje' ? ev.type === 'TURNIEJ' : ev.type === 'MECZ')
                        .map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {new Date(ev.date).toLocaleDateString('pl-PL')} — [{ev.type}] {ev.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Wybór wielu zdjęć (seria) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Wybierz zdjęcia (możesz zaznaczyć całą serię na raz) *
                  </label>
                  {photoSeriesList.length > 0 && (
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      Wczytano: {photoSeriesList.length} {photoSeriesList.length === 1 ? 'zdjęcie' : photoSeriesList.length < 5 ? 'zdjęcia' : 'zdjęć'}
                    </span>
                  )}
                </div>
                
                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-900/60 cursor-pointer transition group mb-2 text-center">
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-amber-400 transition mb-1" />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                    {photoSeriesList.length > 0
                      ? '✓ Dodaj kolejne zdjęcia do serii z galerii'
                      : 'Wybierz serię zdjęć z telefonu / komputera'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Wybierz kilka plików naraz (JPG, PNG, WebP)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleMultiplePhotosUpload}
                  />
                </label>

                {/* Podgląd miniatur wczytanej serii */}
                {photoSeriesList.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 mb-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Miniatury serii do wgrania:</span>
                      <button
                        type="button"
                        onClick={() => setPhotoSeriesList([])}
                        className="text-rose-400 hover:text-rose-300 font-bold"
                      >
                        Wyczyść wszystkie
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                      {photoSeriesList.map((item, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-700 bg-slate-950">
                          <img src={item.url} alt={`Podgląd ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSeries(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold flex items-center justify-center opacity-90 hover:opacity-100 transition shadow"
                            title="Usuń to zdjęcie z serii"
                          >
                            ✕
                          </button>
                          <span className="absolute bottom-0.5 left-1 text-[9px] font-mono text-white/80 bg-black/60 px-1 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="LUB wklej bezpośredni link URL do zdjęcia..."
                  value={photoUrl.startsWith('data:image') ? '[Zdjęcie wczytane z pliku]' : photoUrl}
                  onChange={e => {
                    if (!e.target.value.startsWith('[')) setPhotoUrl(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              {/* Tytuł serii / meczu */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tytuł serii / wydarzenia *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Mecz ligowy LALS vs KS Metro Poznań - sety 1-4"
                  value={photoSeriesTitle || photoTitle}
                  onChange={e => {
                    setPhotoSeriesTitle(e.target.value);
                    setPhotoTitle(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mecz / Rywal (opcjonalnie)</label>
                <input
                  type="text"
                  placeholder="np. Angels ZTP vs KS Metro Poznań"
                  value={photoMatch}
                  onChange={e => setPhotoMatch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Opis / Notatka do serii</label>
                <input
                  type="text"
                  placeholder="Krótki opis akcji, fotografa lub momentu meczu..."
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingPhoto}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
                >
                  {submittingPhoto
                    ? 'Zapisywanie...'
                    : photoSeriesList.length > 1
                    ? `Zapisz całą serię (${photoSeriesList.length} zdjęć)`
                    : 'Dodaj Zdjęcie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Eksport Powiadomienia na Czat (WhatsApp / Messenger / Discord) */}
      {shareModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black uppercase text-white">Eksport Raportu na Czat</h3>
              </div>
              <button onClick={() => setShareModalEvent(null)} className="text-slate-400 hover:text-white font-black">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Gotowy, sformatowany komunikat do wysłania na grupę drużyny (WhatsApp, Messenger, Discord, SMS):
            </p>

            <textarea
              readOnly
              rows={11}
              value={generateChatAnnouncementText(shareModalEvent)}
              className="w-full bg-[#07090d] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 font-mono leading-relaxed select-all focus:outline-none focus:border-emerald-500"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500">
                {copiedShareText ? '✓ Skopiowano do schowka!' : 'Kliknij poniżej, aby skopiować lub wysłać'}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleCopyChatText(shareModalEvent)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    copiedShareText
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedShareText ? 'Skopiowano!' : 'Kopiuj treść'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = generateChatAnnouncementText(shareModalEvent);
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Wyślij na WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Automatyczny Generator Wyjściowej Szóstki */}
      {lineupModalEvent && generatedLineup && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black uppercase text-white">Generator Wyjściowej Szóstki</h3>
              </div>
              <button onClick={() => setLineupModalEvent(null)} className="text-slate-400 hover:text-white font-black">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              System automatycznie przypisał optymalną szóstkę na podstawie graczy, którzy potwierdzili obecność (1xR, 1xA, 2xP, 2xŚ, 1xL):
            </p>

            {/* Warnings if missing positions */}
            {generatedLineup.missingWarnings && generatedLineup.missingWarnings.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Uwagi do składu:</span>
                </div>
                {generatedLineup.missingWarnings.map((w: string, i: number) => (
                  <p key={i} className="text-[11px] text-amber-300/90 pl-5">• {w}</p>
                ))}
              </div>
            )}

            {/* Starting Lineup Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-sky-400 font-black uppercase block">Rozgrywający (R)</span>
                <span className="text-sm font-black text-white mt-0.5 block">{generatedLineup.setter}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-rose-400 font-black uppercase block">Atakujący (A)</span>
                <span className="text-sm font-black text-white mt-0.5 block">{generatedLineup.opposite}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-black uppercase block">Przyjmujący (P1, P2)</span>
                <span className="text-sm font-black text-white mt-0.5 block">{generatedLineup.outsideHitters.join(' oraz ')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-purple-400 font-black uppercase block">Środkowi Bloku (Ś1, Ś2)</span>
                <span className="text-sm font-black text-white mt-0.5 block">{generatedLineup.middleBlockers.join(' oraz ')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 sm:col-span-2">
                <span className="text-[10px] text-amber-400 font-black uppercase block">Libero (L)</span>
                <span className="text-sm font-black text-white mt-0.5 block">{generatedLineup.libero}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 sm:col-span-2">
                <span className="text-[10px] text-slate-500 font-black uppercase block">Ławka Rezerwowych ({generatedLineup.reserves.length})</span>
                <span className="text-xs text-slate-300 mt-0.5 block">{generatedLineup.reserves.join(', ') || 'Brak rezerwowych'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLineupModalEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={savingLineup}
                onClick={handleSaveProposedLineup}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
              >
                {savingLineup ? 'Zapisywanie...' : 'Zatwierdź tę Szóstkę'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Live Scorekeeper na Telefon */}
      {liveModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-white">Live Scorekeeper</h3>
                  <span className="text-[10px] text-slate-400">Wynik na żywo: {liveModalEvent.opponent || 'Mecz'}</span>
                </div>
              </div>
              <button onClick={() => setLiveModalEvent(null)} className="text-slate-400 hover:text-white font-black text-lg">✕</button>
            </div>

            {/* Set info & Set score indicator */}
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Aktualny Set:</span>
                <span className="text-base font-black text-amber-400">SET {liveCurrentSet}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stan Setów:</span>
                <span className="text-base font-black text-white font-mono">{liveSetsWonTeam} : {liveSetsWonOpp}</span>
              </div>
              <button
                onClick={() => setIsServingTeam(!isServingTeam)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition flex items-center gap-1.5 ${
                  isServingTeam ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                <span>🏐 Serwis: {isServingTeam ? 'Angels ZTP' : 'Rywal'}</span>
              </button>
            </div>

            {/* Previous sets chips */}
            {liveFinishedSets.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {liveFinishedSets.map(s => (
                  <span key={s.setNumber} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-slate-300">
                    S{s.setNumber}: {s.teamScore}-{s.opponentScore}
                  </span>
                ))}
              </div>
            )}

            {/* Main Scoreboard: Big Touch Buttons */}
            <div className="grid grid-cols-2 gap-4 select-none">
              {/* Angels ZTP Column */}
              <div className="bg-[#07090d] border border-sky-500/30 rounded-3xl p-4 sm:p-5 text-center space-y-3 shadow-inner">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 block truncate">
                  Angels ZTP
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono text-white py-1">
                  {liveTeamScore}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleScoreChange(-1, 0)}
                    className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-black text-base"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleScoreChange(1, 0)}
                    className="py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Opponent Column */}
              <div className="bg-[#07090d] border border-rose-500/30 rounded-3xl p-4 sm:p-5 text-center space-y-3 shadow-inner">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400 block truncate">
                  {liveModalEvent.opponent || 'Rywal'}
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono text-white py-1">
                  {liveOppScore}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleScoreChange(0, -1)}
                    className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-black text-base"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleScoreChange(0, 1)}
                    className="py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-lg shadow-lg shadow-rose-500/20"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>

            {/* Set Point / Match Point detection */}
            {((liveTeamScore >= 24 || liveOppScore >= 24) && Math.abs(liveTeamScore - liveOppScore) >= 1) && (
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black text-center tracking-widest animate-pulse">
                🔥 {Math.max(liveSetsWonTeam, liveSetsWonOpp) === 2 ? 'PIŁKA MECZOWA (MATCH POINT)!' : 'PIŁKA SETOWA (SET POINT)!'}
              </div>
            )}

            {/* Set / Match Finalize buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleFinishLiveSet}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition text-center"
              >
                ✓ Zakończ Set {liveCurrentSet}
              </button>
              <button
                disabled={savingLiveScore}
                onClick={handleFinishLiveMatch}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-black transition text-center shadow-md shadow-emerald-500/20"
              >
                {savingLiveScore ? 'Zapisywanie...' : 'Zakończ Mecz & Zapisz'}
              </button>
            </div>

            {/* Quick alternative: Switch to full manual result entry */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Nie chcesz klikać punkt po punkcie?</span>
              <button
                type="button"
                onClick={() => {
                  const ev = liveModalEvent;
                  setLiveModalEvent(null);
                  openResultModal(ev);
                }}
                className="text-amber-400 hover:text-amber-300 font-bold hover:underline transition flex items-center gap-1 text-[11px]"
              >
                <span>Wpisz wynik końcowy sparingu ręcznie →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Social Media Post Generator */}
      {socialModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black uppercase text-white">Generator Posta na Social Media</h3>
              </div>
              <button onClick={() => setSocialModalEvent(null)} className="text-slate-400 hover:text-white font-black">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Uzupełnij szczegóły i skopiuj gotowy, widowiskowy post na Instagram, Facebook lub stronę klubu:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Akcja Meczu (Highlights)</label>
                <input
                  type="text"
                  placeholder="np. Pojedynczy blok Bartka na środku w końcówce 3. seta!"
                  value={socialBestAction}
                  onChange={e => setSocialBestAction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Komentarz Trenera / Sztabu</label>
                <input
                  type="text"
                  placeholder="np. Znakomite przyjęcie i pełna realizacja taktyki."
                  value={socialNotes}
                  onChange={e => setSocialNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Podgląd posta:</label>
                <textarea
                  readOnly
                  rows={9}
                  value={generateSocialPostText(socialModalEvent)}
                  className="w-full bg-[#07090d] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 font-mono leading-relaxed select-all focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">
                {copiedSocialText ? '✓ Skopiowano post do schowka!' : 'Gotowy do wklejenia na IG / FB'}
              </span>
              <button
                onClick={() => handleCopySocialPost(socialModalEvent)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  copiedSocialText ? 'bg-purple-500 text-white shadow-md' : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSocialText ? 'Skopiowano!' : 'Kopiuj Post na IG/FB'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview & Series Viewer */}
      {selectedPhotoPreview && (() => {
        const activeIdx = currentTabPhotos.findIndex((p: LeaguePhoto) => p.id === selectedPhotoPreview.id);
        const hasPrev = currentTabPhotos.length > 1;
        const hasNext = currentTabPhotos.length > 1;

        const handlePrev = (e: React.MouseEvent) => {
          e.stopPropagation();
          const prevIdx = activeIdx > 0 ? activeIdx - 1 : currentTabPhotos.length - 1;
          setSelectedPhotoPreview(currentTabPhotos[prevIdx]);
        };

        const handleNext = (e: React.MouseEvent) => {
          e.stopPropagation();
          const nextIdx = activeIdx < currentTabPhotos.length - 1 ? activeIdx + 1 : 0;
          setSelectedPhotoPreview(currentTabPhotos[nextIdx]);
        };

        return (
          <div
            onClick={() => setSelectedPhotoPreview(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer select-none"
          >
            <div className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhotoPreview(null)}
                className="absolute top-2 right-2 sm:-top-10 sm:right-0 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 transition z-20 shadow-lg text-sm"
                title="Zamknij podgląd"
              >
                ✕
              </button>

              {/* Prev Navigation Arrow */}
              {hasPrev && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center border border-slate-700 transition z-20 shadow-xl"
                  title="Poprzednie zdjęcie w serii"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Navigation Arrow */}
              {hasNext && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center border border-slate-700 transition z-20 shadow-xl"
                  title="Następne zdjęcie w serii"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Photo Display */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-black max-h-[75vh] flex items-center justify-center shadow-2xl">
                <img
                  src={selectedPhotoPreview.url}
                  alt={selectedPhotoPreview.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>

              {/* Bottom Info Bar */}
              <div className="mt-3.5 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      {selectedPhotoPreview.matchName || (selectedPhotoPreview.category === 'TURNIEJ' ? 'Turniej' : selectedPhotoPreview.category === 'SPARING' ? 'Sparing' : 'Mecz LALS')}
                    </span>
                    {selectedPhotoPreview.seriesTitle && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        • {selectedPhotoPreview.seriesTitle}
                      </span>
                    )}
                    {activeIdx >= 0 && (
                      <span className="text-[10px] font-mono text-slate-500">
                        [{activeIdx + 1} z {currentTabPhotos.length}]
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-white">{selectedPhotoPreview.title}</h3>
                  {selectedPhotoPreview.caption && (
                    <p className="text-xs text-slate-300">{selectedPhotoPreview.caption}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={selectedPhotoPreview.url}
                    download={`angels_foto_${selectedPhotoPreview.id}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5 shadow"
                    title="Pobierz pełny plik zdjęcia"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pobierz</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL IMPORTU Z VOLLEYSTATION */}
      {showVolleyStationImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek modalu */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Upload className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Import Danych z VolleyStation
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Auto-Parser LALS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Wklej skopiowany terminarz lub szczegółowy raport meczu (sety, MVP, statystyki)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVolleyStationImportModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Treść modalu */}
            <form onSubmit={handleImportVolleyStation} className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Pasek z bezpośrednim linkiem do oficjalnego terminarza */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-950 border border-sky-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Oficjalny terminarz ligowy LALS:</span>
                </div>
                <a
                  href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 hover:text-white border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Otwórz: panel.volleystation.com/schedule ↗</span>
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4 shrink-0" />
                  Jak zaimportować dane w 5 sekund:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                  <li>Otwórz powyższy link do terminarza w nowej karcie.</li>
                  <li>Zaznacz mecze i wyniki (lub cały raport ze statystykami zawodników) i skopiuj (<code className="text-white bg-slate-900 px-1 rounded">Ctrl+C</code>).</li>
                  <li>Wklej poniżej (<code className="text-white bg-slate-900 px-1 rounded">Ctrl+V</code>) i kliknij <em>Zaimportuj dane</em>.</li>
                </ol>
              </div>

              {/* Wybór fazy rozgrywek dla importu */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    🎯 Faza rozgrywek LALS, do której przypisać importowane mecze:
                  </label>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">
                    {leaguePhases.find(p => p.id === importPhaseTargetId)?.shortName || 'Faza I'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {leaguePhases.map(phase => {
                    const isSelected = importPhaseTargetId === phase.id;
                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => setImportPhaseTargetId(phase.id)}
                        className={`p-2.5 rounded-xl text-left border transition flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500/60 text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-500/30'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{phase.name}</span>
                          {isSelected && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 font-black">
                              AKTYWNA
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {phase.advancementSpots === 3
                            ? '🟢 Grupa 7 zespołów • Top 3 awansuje dalej'
                            : '🏆 Grupa Finałowa (7 zespołów) • Walka o podium'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold uppercase tracking-wider text-slate-300">
                    Wklejony tekst z VolleyStation:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVolleyStationRawInput(`[Runda: 7Nr 1926GGladiatorzy BUD-WENT3:2AAngels ZTP](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583864/)[Runda: 7Nr 1925KKoty Broniszewice0:3AAfera Volley](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583846/)[Runda: 7Nr 1924CCzelendż1:3VVolleyboars](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583847/)
18 października 2026, Niedziela
[Runda: 5Nr 1889VVolleyboars0:3CCoco Jumbo](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583848/)[Runda: 5Nr 1887AAngels ZTP3:0KKoty Broniszewice](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583849/)[Runda: 5Nr 1888AAfera Volley3:0CCzelendż](https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583850/)`);
                      }}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline"
                    >
                      + Wstaw przykładowy terminarz
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {volleyStationRawInput.length} zn.
                    </span>
                  </div>
                </div>
                <textarea
                  value={volleyStationRawInput}
                  onChange={e => setVolleyStationRawInput(e.target.value)}
                  placeholder="Wklej tutaj treść skopiowaną z terminarza ligowego lub ze strony raportu meczowego VolleyStation..."
                  rows={9}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition resize-y"
                  required
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={volleyStationAutoCreate}
                  onChange={e => setVolleyStationAutoCreate(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 focus:ring-offset-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Automatycznie synchronizuj z terminarzem ligowym LALS
                  </span>
                  <span className="text-slate-400">
                    Tworzy lub aktualizuje wpisy meczów z przeciwnikami, wynikiem, setami i nagrodą MVP.
                  </span>
                </div>
              </label>

              {/* Stopka z przyciskami */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVolleyStationImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={submittingVolleyStation}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingVolleyStation || !volleyStationRawInput.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-sky-500/20"
                >
                  {submittingVolleyStation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Przetwarzanie...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>Zaimportuj dane do systemu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RĘCZNEGO DODAWANIA MECZU LIGOWEGO */}
      {showAddMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Volleyball className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Dodaj Wynik Meczu Ligowego</h3>
                  <p className="text-xs text-slate-400">Wprowadź oficjalny rezultat meczu LALS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMatchModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLeagueMatch} className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Faza rozgrywek */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Faza rozgrywek:</label>
                <div className="grid grid-cols-2 gap-2">
                  {leaguePhases.map(phase => (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => setMatchPhaseId(phase.id)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition flex items-center justify-between ${
                        matchPhaseId === phase.id
                          ? 'bg-sky-500/20 border-sky-500 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{phase.shortName}: {phase.advancementSpots === 3 ? 'Eliminacje' : 'Finały'}</span>
                      {matchPhaseId === phase.id && <span className="text-[9px] px-1 rounded bg-sky-500 text-slate-950 font-black">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Przeciwnik */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Przeciwnik (Drużyna rywali):</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Gladiatorzy BUD-WENT', 'Afera Volley', 'Coco Jumbo', 'Volleyboars', 'Koty Broniszewice', 'Czelendż'].map(team => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => setMatchOpponent(team)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        matchOpponent === team
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {team}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={matchOpponent}
                  onChange={e => setMatchOpponent(e.target.value)}
                  placeholder="np. Gladiatorzy BUD-WENT lub wpisz inną nazwę"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Data i Lokalizacja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Data i godzina:</label>
                  <input
                    type="datetime-local"
                    value={matchDate}
                    onChange={e => setMatchDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Hala / Miejsce:</label>
                  <input
                    type="text"
                    value={matchLocation}
                    onChange={e => setMatchLocation(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Dom / Wyjazd */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="radio"
                    name="isHome"
                    checked={matchIsHome}
                    onChange={() => setMatchIsHome(true)}
                    className="text-sky-500 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span>🏠 Gospodarz (Angels ZTP)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="radio"
                    name="isHome"
                    checked={!matchIsHome}
                    onChange={() => setMatchIsHome(false)}
                    className="text-sky-500 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span>🚌 Wyjazd</span>
                </label>
              </div>

              {/* Punkty w setach */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Wynik setów (małe punkty):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (manualMatchSets.length < 5) {
                        setManualMatchSets([...manualMatchSets, { setNumber: manualMatchSets.length + 1, teamScore: 0, opponentScore: 0 }]);
                      }
                    }}
                    className="text-[11px] font-bold text-sky-400 hover:text-sky-300"
                  >
                    + Dodaj kolejny set
                  </button>
                </div>
                <div className="space-y-2">
                  {manualMatchSets.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 w-14">Set {s.setNumber}:</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={s.teamScore}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            const updated = [...manualMatchSets];
                            updated[idx].teamScore = val;
                            setManualMatchSets(updated);
                          }}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white"
                        />
                        <span className="text-slate-500 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={s.opponentScore}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            const updated = [...manualMatchSets];
                            updated[idx].opponentScore = val;
                            setManualMatchSets(updated);
                          }}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white"
                        />
                      </div>
                      {manualMatchSets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = manualMatchSets.filter((_, i) => i !== idx).map((st, i) => ({ ...st, setNumber: i + 1 }));
                            setManualMatchSets(updated);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* MVP & Notatki */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">MVP Meczu:</label>
                  <input
                    type="text"
                    value={matchMvp}
                    onChange={e => setMatchMvp(e.target.value)}
                    placeholder="np. Karol Ordon, Łukasz Kremer..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Notatki / Komentarz:</label>
                  <input
                    type="text"
                    value={matchNotes}
                    onChange={e => setMatchNotes(e.target.value)}
                    placeholder="np. Kluczowa seria asów w 3. secie"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Przyciski */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={submittingMatch}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingMatch || !matchOpponent || !matchDate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-sky-500/20"
                >
                  {submittingMatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Mecz do Ligi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTablePhaseId === 'faza_1'
                      ? 'Grupa eliminacyjna (7 zespołów) • Pozycje 1-3 mają zielony awans do Grupy Finałowej'
                      : 'Grupa finałowa (7 zespołów) • Faza medalowa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Edytowana faza:</span>
                <div className="flex gap-1.5">
                  {leaguePhases.map(ph => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setEditingTablePhaseId(ph.id);
                        setTableRows(ph.table ? JSON.parse(JSON.stringify(ph.table)) : []);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        editingTablePhaseId === ph.id
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ph.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego wklejania tabeli */}
              <details className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 group">
                <summary className="font-bold cursor-pointer text-sky-400 flex items-center justify-between list-none">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Szybkie wklejanie tabeli skopiowanej z VolleyStation
                  </span>
                  <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Skopiuj całą tabelę z VolleyStation i wklej poniżej, a system automatycznie rozpozna drużyny, mecze i punkty:
                  </p>
                  <textarea
                    rows={4}
                    value={rawTableInput}
                    onChange={e => setRawTableInput(e.target.value)}
                    placeholder="np. 1 Angels ZTP 6 16&#10;2 Gladiatorzy BUD-WENT 6 15..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseRawTable}
                      disabled={!rawTableInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition"
                    >
                      Przetwórz i wstaw do tabeli
                    </button>
                  </div>
                </div>
              </details>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const isCutoff = editingTablePhaseId === 'faza_1' && idx === 2; // after 3rd team
                    const isAdvancing = editingTablePhaseId === 'faza_1' && idx < 3;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-950/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Mecze rozegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono font-bold">Pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.points}
                                onChange={e => handleUpdateTableRow(idx, 'points', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono text-white"
                                title="Małe punkty stracone"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(idx)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                              title="Usuń drużynę z tabeli"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Cutoff visual separator after 3rd place in Faza 1 */}
                        {isCutoff && (
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
                            <span className="flex items-center gap-1.5">
                              <span>══════</span>
                              <span>🟢 GRANICA AWANSU DO GRUPY FINAŁOWEJ (TOP 3)</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                              3 ZESPOŁY AWANSUJĄ
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Liczba zespołów w grupie: <strong className="text-white">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  disabled={savingTable}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveTable}
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                >
                  {savingTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie tabeli...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz Zmiany w Tabeli</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RozgrywkiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Ładowanie Rozgrywek...</div>}>
      <RozgrywkiContent />
    </Suspense>
  );
}
