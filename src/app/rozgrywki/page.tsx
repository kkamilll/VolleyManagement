'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
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
  Swords,
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
  Settings,
  GitFork,
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
  TacticalPlay,
  TournamentMatch,
  TournamentPhase,
  VolleyStationScheduleMatch
} from '@/lib/types';
import { recognizeTextFromImage } from '@/lib/ocr';
import { parseVolleyStationTable, parseVolleyStationSchedule, cleanTeamName } from '@/lib/volleystation-parser';

function formatVolleyDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
    return formatted.replace(/, ([a-ząćęłńóśźż])/i, (_, l) => `, ${l.toUpperCase()}`);
  } catch {
    return dateStr;
  }
}

type TabType = 'sparingi' | 'liga' | 'turnieje';
type LigaSubTab = 'tabela' | 'wyniki' | 'statystyki' | 'zdjecia';
type SparingSubTab = 'mecze' | 'zdjecia';
type TurniejSubTab = 'drabinki' | 'zdjecia';

const TOURNAMENT_PHASES: { id: TournamentPhase; label: string; badge: string; icon: string }[] = [
  { id: 'FAZA_GRUPOWA', label: 'Faza Grupowa', badge: 'bg-sky-50 text-sky-800 border-sky-300', icon: '🏐' },
  { id: '1_16_FINALU', label: '1/16 Finału', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: '⚔️' },
  { id: '1_8_FINALU', label: '1/8 Finału', badge: 'bg-purple-50 text-purple-800 border-purple-200', icon: '⚔️' },
  { id: '1_4_FINALU', label: '1/4 Finału (Ćwierćfinał)', badge: 'bg-violet-50 text-violet-800 border-violet-300', icon: '🛡️' },
  { id: '1_2_FINALU', label: '1/2 Finału (Półfinał)', badge: 'bg-amber-50 text-amber-800 border-amber-300', icon: '🔥' },
  { id: 'O_3_MIEJSCE', label: 'Mecz o 3. miejsce', badge: 'bg-orange-50 text-orange-800 border-orange-300', icon: '🥉' },
  { id: 'FINAL', label: 'Wielki Finał', badge: 'bg-amber-100 text-amber-900 border-amber-400 font-black', icon: '🥇' },
  { id: 'INNA', label: 'Mecz Klasyfikacyjny / Inny', badge: 'bg-slate-100 text-slate-700 border-slate-300', icon: '📋' }
];

const getPhaseBadge = (phase?: string) => {
  const p = TOURNAMENT_PHASES.find(tp => tp.id === phase);
  if (p) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-black border ${p.badge}`}>
        <span>{p.icon}</span>
        <span>{p.label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
      <span>🏐</span>
      <span>{phase || 'Mecz turniejowy'}</span>
    </span>
  );
};

function TeamShieldBadge({ name, isAngels = false }: { name: string; isAngels?: boolean }) {
  if (isAngels) {
    return (
      <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0 border border-sky-400">
        👼
      </div>
    );
  }
  const clean = cleanTeamName(name);
  const initial = (clean[0] || '?').toUpperCase();
  return (
    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0 border border-slate-700">
      {initial}
    </div>
  );
}

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
  const [playerRankings, setPlayerRankings] = useState<any[]>([]);
  const [rankingSearch, setRankingSearch] = useState('');
  const [rankingFilterTeam, setRankingFilterTeam] = useState<'ALL' | 'ANGELS'>('ALL');
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
  const [leagueSchedule, setLeagueSchedule] = useState<VolleyStationScheduleMatch[]>([]);
  const [leagueScheduleScope, setLeagueScheduleScope] = useState<'ALL' | 'ANGELS'>('ALL');
  const [leagueScheduleStatus, setLeagueScheduleStatus] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [parsedScheduleMatchesToImport, setParsedScheduleMatchesToImport] = useState<VolleyStationScheduleMatch[]>([]);

  // Dynamic LALS Phases & Groups Modals
  const [showCreatePhaseModal, setShowCreatePhaseModal] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseShortName, setNewPhaseShortName] = useState('');
  const [newPhaseAdvSpots, setNewPhaseAdvSpots] = useState<number>(3);
  const [newPhaseAdvTarget, setNewPhaseAdvTarget] = useState('Grupa Finałowa');
  const [creatingPhase, setCreatingPhase] = useState(false);

  const [showSplitPhaseModal, setShowSplitPhaseModal] = useState(false);
  const [splitSourcePhaseId, setSplitSourcePhaseId] = useState<string>('faza_1');
  const [splitPhaseName, setSplitPhaseName] = useState('Grupa Mistrzowska (Miejsca 1-4)');
  const [splitPhaseShortName, setSplitPhaseShortName] = useState('Mistrzowska');
  const [splitStartRank, setSplitStartRank] = useState<number>(1);
  const [splitEndRank, setSplitEndRank] = useState<number>(4);
  const [splitAdvSpots, setSplitAdvSpots] = useState<number>(1);
  const [splitAdvTarget, setSplitAdvTarget] = useState('Mistrz Ligi LALS');
  const [splitCarryOverStats, setSplitCarryOverStats] = useState<boolean>(true);
  const [splittingPhase, setSplittingPhase] = useState(false);

  const [showConfigPhaseModal, setShowConfigPhaseModal] = useState(false);
  const [configPhaseId, setConfigPhaseId] = useState<string>('faza_1');
  const [configPhaseName, setConfigPhaseName] = useState('');
  const [configPhaseShortName, setConfigPhaseShortName] = useState('');
  const [configPhaseAdvSpots, setConfigPhaseAdvSpots] = useState<number>(3);
  const [configPhaseAdvTarget, setConfigPhaseAdvTarget] = useState('');
  const [updatingPhaseConfig, setUpdatingPhaseConfig] = useState(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [editingTablePhaseId, setEditingTablePhaseId] = useState<string>('faza_1');
  const [tableRows, setTableRows] = useState<LeagueTableTeam[]>([]);
  const [savingTable, setSavingTable] = useState(false);
  const [importPhaseTargetId, setImportPhaseTargetId] = useState<string>('faza_1');
  const [rawTableInput, setRawTableInput] = useState('');
  const [tableOcrLoading, setTableOcrLoading] = useState(false);
  const [tableOcrProgress, setTableOcrProgress] = useState(0);
  const [tableOcrStatus, setTableOcrStatus] = useState('');
  const [tableImportTab, setTableImportTab] = useState<'text' | 'image'>('text');
  const [tableImagePreview, setTableImagePreview] = useState<string | null>(null);

  // Import Terminarza & Wyników LALS (Tekst / Zdjęcie OCR)
  const [showImportScheduleModal, setShowImportScheduleModal] = useState(false);
  const [scheduleImportTab, setScheduleImportTab] = useState<'text' | 'image'>('text');
  const [rawScheduleInput, setRawScheduleInput] = useState('');
  const [scheduleImagePreview, setScheduleImagePreview] = useState<string | null>(null);
  const [scheduleOcrLoading, setScheduleOcrLoading] = useState(false);
  const [scheduleOcrProgress, setScheduleOcrProgress] = useState(0);
  const [scheduleOcrStatus, setScheduleOcrStatus] = useState('');
  const [parsedMatchesToImport, setParsedMatchesToImport] = useState<any[]>([]);
  const [parsedFixturesToImport, setParsedFixturesToImport] = useState<any[]>([]);
  const [submittingScheduleImport, setSubmittingScheduleImport] = useState(false);
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
  const [eventIncludeResult, setEventIncludeResult] = useState(false);
  const [eventResultSetsTeam, setEventResultSetsTeam] = useState(3);
  const [eventResultSetsOpp, setEventResultSetsOpp] = useState(1);
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // Tournament Match & Phase states
  const [tournamentPhaseFilter, setTournamentPhaseFilter] = useState<Record<string, string>>({});
  const [showAddTournamentMatchModal, setShowAddTournamentMatchModal] = useState(false);
  const [selectedTournamentForMatch, setSelectedTournamentForMatch] = useState<EventItem | null>(null);
  const [matchFormPhase, setMatchFormPhase] = useState<TournamentPhase>('FAZA_GRUPOWA');
  const [matchFormRound, setMatchFormRound] = useState('');
  const [matchFormTeamA, setMatchFormTeamA] = useState('Angels ZTP');
  const [matchFormTeamB, setMatchFormTeamB] = useState('');
  const [matchFormScoreA, setMatchFormScoreA] = useState('2');
  const [matchFormScoreB, setMatchFormScoreB] = useState('0');
  const [matchFormSetScores, setMatchFormSetScores] = useState('');
  const [matchFormTime, setMatchFormTime] = useState('');
  const [matchFormIsFinished, setMatchFormIsFinished] = useState(false);
  const [matchFormNotes, setMatchFormNotes] = useState('');
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [savingMatch, setSavingMatch] = useState(false);
  const [showTournamentRankModal, setShowTournamentRankModal] = useState<EventItem | null>(null);

  const handleOpenAddMatch = (event: EventItem) => {
    setSelectedTournamentForMatch(event);
    setEditingMatchId(null);
    setMatchFormPhase('FAZA_GRUPOWA');
    setMatchFormRound(`Mecz ${(event.tournamentMatches || []).length + 1}`);
    setMatchFormTeamA('Angels ZTP');
    setMatchFormTeamB('');
    setMatchFormScoreA('2');
    setMatchFormScoreB('0');
    setMatchFormSetScores('');
    setMatchFormTime('');
    setMatchFormIsFinished(false);
    setMatchFormNotes('');
    setShowAddTournamentMatchModal(true);
  };

  const handleOpenEditMatch = (event: EventItem, match: TournamentMatch) => {
    setSelectedTournamentForMatch(event);
    setEditingMatchId(match.id);
    setMatchFormPhase((match.phase as TournamentPhase) || 'FAZA_GRUPOWA');
    setMatchFormRound(match.round || '');
    setMatchFormTeamA(match.teamA || 'Angels ZTP');
    setMatchFormTeamB(match.teamB || '');
    setMatchFormScoreA(match.scoreA !== undefined ? String(match.scoreA) : '2');
    setMatchFormScoreB(match.scoreB !== undefined ? String(match.scoreB) : '0');
    setMatchFormSetScores(match.setScores || '');
    setMatchFormTime(match.time || '');
    setMatchFormIsFinished(Boolean(match.isFinished));
    setMatchFormNotes(match.notes || '');
    setShowAddTournamentMatchModal(true);
  };

  const handleSaveTournamentMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentForMatch) return;
    setSavingMatch(true);
    try {
      const existingMatches = [...(selectedTournamentForMatch.tournamentMatches || [])];
      const matchData: TournamentMatch = {
        id: editingMatchId || `tm_${Date.now()}`,
        phase: matchFormPhase,
        round: matchFormRound.trim() || 'Mecz turniejowy',
        teamA: matchFormTeamA.trim() || 'Angels ZTP',
        teamB: matchFormTeamB.trim() || 'Przeciwnik',
        scoreA: matchFormScoreA !== '' ? Number(matchFormScoreA) : undefined,
        scoreB: matchFormScoreB !== '' ? Number(matchFormScoreB) : undefined,
        setScores: matchFormSetScores.trim(),
        time: matchFormTime.trim(),
        isFinished: matchFormIsFinished,
        notes: matchFormNotes.trim()
      };

      let updatedMatches: TournamentMatch[];
      if (editingMatchId) {
        updatedMatches = existingMatches.map(m => m.id === editingMatchId ? matchData : m);
      } else {
        updatedMatches = [...existingMatches, matchData];
      }

      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTournamentForMatch.id,
          tournamentMatches: updatedMatches
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Błąd zapisu meczu');
      }

      setEvents(prev => prev.map(ev => ev.id === selectedTournamentForMatch.id ? { ...ev, tournamentMatches: updatedMatches } : ev));
      setShowAddTournamentMatchModal(false);
    } catch (err: any) {
      alert(err.message || 'Nie udało się zapisać meczu turniejowego');
    } finally {
      setSavingMatch(false);
    }
  };

  const handleDeleteTournamentMatch = async (event: EventItem, matchId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten mecz z turnieju?')) return;
    try {
      const updatedMatches = (event.tournamentMatches || []).filter(m => m.id !== matchId);
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          tournamentMatches: updatedMatches
        })
      });
      if (res.ok) {
        setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, tournamentMatches: updatedMatches } : ev));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (event: EventItem) => {
    const typeLabel = event.type === 'TURNIEJ' ? 'turniej' : event.type === 'SPARING' ? 'sparing' : 'wydarzenie';
    if (!confirm(`Czy na pewno chcesz bezpowrotnie usunąć ${typeLabel}: "${event.title}"?`)) return;
    try {
      const res = await fetch(`/api/events?id=${event.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(prev => prev.filter(ev => ev.id !== event.id));
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || `Błąd podczas usuwania ${typeLabel}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Wystąpił błąd podczas usuwania ${typeLabel}`);
    }
  };

  const handleQuickSetTournamentRank = async (event: EventItem, rank: string) => {
    try {
      const updatedResult = {
        ...(event.result || { teamSetsWon: 0, opponentSetsWon: 0, sets: [] }),
        tournamentRank: rank
      };
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          result: updatedResult
        })
      });
      if (res.ok) {
        setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, result: updatedResult } : ev));
      }
    } catch (err) {
      console.error(err);
    }
  };

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
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);

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
  const canManageMatches = !isArchiveMode && Boolean(
    user && (
      user.role === 'KIEROWNIK' ||
      user.isCaptain ||
      user.id === 'usr_pujanek' ||
      user.id === 'usr_kierownik' ||
      (user.email && (user.email.toLowerCase().includes('pujanek') || user.email.toLowerCase().includes('kremer'))) ||
      user.permissions?.canManageMatches ||
      user.permissions?.isAdmin
    )
  );
  const canManage = !isArchiveMode && Boolean(
    user && (
      user.role === 'KIEROWNIK' ||
      user.role === 'TRENER' ||
      user.isCaptain ||
      user.id === 'usr_pujanek' ||
      user.id === 'usr_kierownik' ||
      user.permissions?.canManageEvents ||
      user.permissions?.isAdmin
    )
  );

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
        if (lr.playerRankings) {
          setPlayerRankings(lr.playerRankings);
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
        setLeagueSchedule(l.leagueSchedule || []);
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
      const isSparing = eventTypeToCreate === 'SPARING';
      const fallbackTitle = isSparing
        ? (eventOpponent ? `Sparing vs ${eventOpponent}` : 'Sparing kontrolny')
        : (eventTitle || 'Turniej siatkarski');
      const finalTitle = eventTitle.trim() || fallbackTitle;
      const isSparingWithScore = isSparing && eventIncludeResult;

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          type: eventTypeToCreate,
          date: eventDate,
          endDate: eventEndDate || undefined,
          location: eventLocation,
          opponent: eventOpponent || undefined,
          description: eventDescription,
          costPerPerson: Number(eventCost) || 0,
          status: isSparingWithScore ? 'ZAKONCZONY' : 'ANKIETA',
          result: isSparingWithScore ? {
            teamSetsWon: eventResultSetsTeam,
            opponentSetsWon: eventResultSetsOpp,
            sets: [
              { setNumber: 1, teamScore: 25, opponentScore: 21 },
              { setNumber: 2, teamScore: 25, opponentScore: 20 },
              { setNumber: 3, teamScore: 25, opponentScore: 22 }
            ],
            notes: eventDescription || undefined
          } : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddEventModal(false);
        setEventTitle('');
        setEventOpponent('');
        setEventDescription('');
        setEventCost('0');
        setEventIncludeResult(false);
        await fetchData();
        alert(data.message || (isSparingWithScore ? 'Sparing wraz z wynikiem został zapisany!' : 'Wydarzenie zostało utworzone!'));
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

  // 5. Direct File Upload for League Photos & Series (Batch Drag & Drop + Auto Compression)
  const compressPhotoFile = (file: File): Promise<{ url: string; title: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const rawDataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_DIM = 1600;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.82);
              resolve({
                url: compressed,
                title: file.name.replace(/\.[^/.]+$/, "")
              });
              return;
            }
          } catch (err) {
            console.warn('Canvas compression fallback to raw:', err);
          }
          resolve({
            url: rawDataUrl,
            title: file.name.replace(/\.[^/.]+$/, "")
          });
        };
        img.onerror = () => {
          resolve({
            url: rawDataUrl,
            title: file.name.replace(/\.[^/.]+$/, "")
          });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const processPhotoFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      alert('Wybierz lub przeciągnij pliki graficzne (JPG, PNG, WebP)!');
      return;
    }

    setProcessingPhotos(true);
    setProcessingCount(fileList.length);

    try {
      const processedItems = await Promise.all(fileList.map(compressPhotoFile));
      setPhotoSeriesList(prev => [...prev, ...processedItems]);
      if (!photoSeriesTitle) {
        setPhotoSeriesTitle(photoMatch ? `Fotorelacja: ${photoMatch}` : `Seria zdjęć (${new Date().toLocaleDateString('pl-PL')})`);
      }
    } catch (err) {
      console.error('Error processing photos:', err);
      alert('Wystąpił błąd podczas wczytywania zdjęć');
    } finally {
      setProcessingPhotos(false);
      setProcessingCount(0);
    }
  };

  const handleMultiplePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processPhotoFiles(e.target.files);
    }
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

  const handleOpenEditTable = (phaseId: string, initialImportTab?: 'text' | 'image') => {
    const targetPhase = leaguePhases.find(p => p.id === phaseId) || currentLeaguePhase;
    setEditingTablePhaseId(targetPhase?.id || 'faza_1');
    setTableRows(targetPhase?.table ? JSON.parse(JSON.stringify(targetPhase.table)) : []);
    setRawTableInput('');
    if (initialImportTab) {
      setTableImportTab(initialImportTab);
    }
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

  const handleOpenCreatePhase = () => {
    setNewPhaseName(`Faza ${leaguePhases.length + 1}`);
    setNewPhaseShortName(`Grupa ${String.fromCharCode(65 + leaguePhases.length)}`);
    setNewPhaseAdvSpots(1);
    setNewPhaseAdvTarget('Mistrz Ligi LALS');
    setShowCreatePhaseModal(true);
  };

  const handleCreatePhase = async () => {
    if (!newPhaseName.trim()) {
      alert('Podaj nazwę nowej fazy');
      return;
    }
    setCreatingPhase(true);
    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PHASE',
          name: newPhaseName.trim(),
          shortName: newPhaseShortName.trim() || newPhaseName.trim(),
          advancementSpots: Number(newPhaseAdvSpots) || 0,
          advancementTargetName: newPhaseAdvTarget.trim() || 'Kolejny Etap',
          table: []
        })
      });
      const data = await res.json();
      if (res.ok && data.phase) {
        setShowCreatePhaseModal(false);
        await fetchData();
        await handleSwitchPhase(data.phase.id);
        // Automatycznie otwórz edytor/importer tabeli, aby użytkownik mógł od razu wkleić nowe zestawienie
        handleOpenEditTable(data.phase.id, 'text');
      } else {
        alert(data.error || 'Błąd tworzenia fazy');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas tworzenia fazy');
    } finally {
      setCreatingPhase(false);
    }
  };

  const handleOpenSplitPhase = (sourcePhaseId?: string) => {
    const srcId = sourcePhaseId || activeLeaguePhaseId;
    const src = leaguePhases.find(p => p.id === srcId) || currentLeaguePhase;
    const count = src?.table?.length || leagueTable.length || 7;
    setSplitSourcePhaseId(srcId);
    setSplitStartRank(1);
    const half = Math.min(4, Math.max(1, Math.ceil(count / 2)));
    setSplitEndRank(half);
    setSplitPhaseName(`Grupa Mistrzowska (Miejsca 1-${half})`);
    setSplitPhaseShortName(`Mistrzowska (1-${half})`);
    setSplitAdvSpots(1);
    setSplitAdvTarget('Mistrz Ligi LALS');
    setSplitCarryOverStats(true);
    setShowSplitPhaseModal(true);
  };

  const handleSplitPhase = async () => {
    if (!splitPhaseName.trim()) {
      alert('Podaj nazwę nowej grupy');
      return;
    }
    setSplittingPhase(true);
    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SPLIT_PHASE',
          sourcePhaseId: splitSourcePhaseId,
          newPhaseName: splitPhaseName.trim(),
          newPhaseShortName: splitPhaseShortName.trim() || splitPhaseName.trim(),
          startRank: Number(splitStartRank) || 1,
          endRank: Number(splitEndRank) || 4,
          advancementSpots: Number(splitAdvSpots) || 0,
          advancementTargetName: splitAdvTarget.trim() || 'Mistrz Ligi',
          carryOverStats: splitCarryOverStats
        })
      });
      const data = await res.json();
      if (res.ok && data.phase) {
        setShowSplitPhaseModal(false);
        await fetchData();
        await handleSwitchPhase(data.phase.id);
        alert(data.message || 'Podział grupy zakończony pomyślnie!');
      } else {
        alert(data.error || 'Błąd podziału grupy');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas podziału grupy');
    } finally {
      setSplittingPhase(false);
    }
  };

  const handleOpenConfigPhase = (phaseId?: string) => {
    const target = leaguePhases.find(p => p.id === (phaseId || activeLeaguePhaseId)) || currentLeaguePhase;
    if (!target) return;
    setConfigPhaseId(target.id);
    setConfigPhaseName(target.name);
    setConfigPhaseShortName(target.shortName || target.name);
    setConfigPhaseAdvSpots(target.advancementSpots ?? 0);
    setConfigPhaseAdvTarget(target.advancementTargetName || '');
    setShowConfigPhaseModal(true);
  };

  const handleSavePhaseConfig = async () => {
    if (!configPhaseName.trim()) {
      alert('Podaj nazwę fazy');
      return;
    }
    setUpdatingPhaseConfig(true);
    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PHASE',
          phase: {
            id: configPhaseId,
            name: configPhaseName.trim(),
            shortName: configPhaseShortName.trim() || configPhaseName.trim(),
            advancementSpots: Number(configPhaseAdvSpots) || 0,
            advancementTargetName: configPhaseAdvTarget.trim()
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowConfigPhaseModal(false);
        await fetchData();
        alert('Ustawienia fazy zostały pomyślnie zaktualizowane!');
      } else {
        alert(data.error || 'Błąd aktualizacji fazy');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas zapisu konfiguracji fazy');
    } finally {
      setUpdatingPhaseConfig(false);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (leaguePhases.length <= 1) {
      alert('Nie można usunąć jedynej fazy w lidze.');
      return;
    }
    const target = leaguePhases.find(p => p.id === phaseId);
    if (!confirm(`Czy na pewno chcesz usunąć fazę "${target?.name || phaseId}"? Ta operacja jest nieodwracalna.`)) {
      return;
    }
    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_PHASE',
          phaseId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowConfigPhaseModal(false);
        await fetchData();
        if (data.activeLeaguePhaseId) {
          await handleSwitchPhase(data.activeLeaguePhaseId);
        }
        alert('Faza została pomyślnie usunięta.');
      } else {
        alert(data.error || 'Błąd usuwania fazy');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas usuwania fazy');
    }
  };

  const handleParseRawTable = (overrideText?: string) => {
    const textToParse = typeof overrideText === 'string' ? overrideText : rawTableInput;
    if (!textToParse.trim()) return;

    // 1. Spróbuj inteligentnego parsera VolleyStation (obsługuje wklejanie bezpośrednio ze strony LALS/VolleyStation, ze schowka, z Excela)
    const vsParsed = parseVolleyStationTable(textToParse);
    if (vsParsed.length > 0) {
      setTableRows(vsParsed);
      alert(`Wczytano pomyślnie ${vsParsed.length} zespołów ze statystykami z VolleyStation!`);
      return;
    }

    const lines = textToParse.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: LeagueTableTeam[] = [];
    
    lines.forEach((line, idx) => {
      // Pomiń nagłówki tabeli (np. "Lp Drużyna M Pkt Sety...")
      if (/^(lp|poz|miejsce|drużyna|zespół|team|nr)\b/i.test(line)) return;

      // 1. Spróbuj dopasować liczby na końcu linii: [Nazwa] [Mecze] [Punkty] [Sety wygrane:przegrane]? [Małe punkty]?
      const endStatsMatch = line.match(/(.*?)\s+(\d+)\s+(\d+)(?:\s+(\d+[:\-]\d+))?(?:\s+(\d+[:\-]\d+))?$/);
      if (endStatsMatch) {
        const lead = endStatsMatch[1].trim();
        const matches = parseInt(endStatsMatch[2]) || 0;
        const pts = parseInt(endStatsMatch[3]) || 0;
        const setsStr = endStatsMatch[4] || '';
        const ptsStr = endStatsMatch[5] || '';

        // Usuń ewentualną cyfrę pozycji z początku (np. "1. " lub "1 ")
        const posMatch = lead.match(/^(\d+)[.)\s]+(.*)$/);
        const pos = posMatch ? parseInt(posMatch[1]) : (parsed.length + 1);
        const teamName = posMatch ? posMatch[2].trim() : lead;

        let setsWon = 0;
        let setsLost = 0;
        if (setsStr) {
          const [sw, sl] = setsStr.split(/[:\-]/).map(n => parseInt(n) || 0);
          setsWon = sw || 0;
          setsLost = sl || 0;
        }

        let pointsWon = 0;
        let pointsLost = 0;
        if (ptsStr) {
          const [pw, pl] = ptsStr.split(/[:\-]/).map(n => parseInt(n) || 0);
          pointsWon = pw || 0;
          pointsLost = pl || 0;
        }

        if (teamName) {
          parsed.push({
            id: `team_${Date.now()}_${idx}`,
            position: pos,
            teamName,
            matchesPlayed: matches,
            points: pts,
            setsWon,
            setsLost,
            pointsWon,
            pointsLost,
            form: []
          });
          return;
        }
      }

      // 2. Podział tabulatorem lub wieloma spacjami
      const parts = line.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const firstIsNum = !isNaN(parseInt(parts[0]));
        const pos = firstIsNum ? parseInt(parts[0]) : (parsed.length + 1);
        const teamName = firstIsNum ? parts[1] : parts[0];
        const matches = parseInt(firstIsNum ? parts[2] : parts[1]) || 0;
        const pts = parseInt(firstIsNum ? parts[3] : parts[2]) || 0;
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

  // OCR dla zdjęcia tabeli
  const handleTableImageOcr = async (file: File) => {
    setTableOcrLoading(true);
    setTableOcrProgress(0);
    setTableOcrStatus('Wczytywanie zdjęcia tabeli...');
    try {
      const previewUrl = URL.createObjectURL(file);
      setTableImagePreview(previewUrl);
      const text = await recognizeTextFromImage(file, p => {
        setTableOcrProgress(p.progress);
        setTableOcrStatus(p.status);
      });
      setRawTableInput(text);
      handleParseRawTable(text);
    } catch (err: any) {
      alert('Błąd OCR podczas rozpoznawania zdjęcia tabeli: ' + (err?.message || err));
    } finally {
      setTableOcrLoading(false);
      setTableOcrStatus('');
    }
  };

  // Parser tekstu terminarza i wyników
  const handleParseScheduleText = (text: string) => {
    if (!text.trim()) {
      setParsedMatchesToImport([]);
      setParsedFixturesToImport([]);
      return;
    }

    const matchesList: any[] = [];
    const fixturesList: any[] = [];

    // 1. Spróbuj oficjalnego parsera terminarza VolleyStation (obsługuje [Runda: ...], daty po polsku, godziny po południu)
    const vsSchedule = parseVolleyStationSchedule(text);
    if (vsSchedule.length > 0) {
      setParsedScheduleMatchesToImport(vsSchedule);
      vsSchedule.forEach(sm => {
        const isAngelsHome = sm.homeTeam.toLowerCase().includes('angel');
        const isAngelsAway = sm.awayTeam.toLowerCase().includes('angel');
        const isAngels = isAngelsHome || isAngelsAway;

        const opponent = isAngelsHome ? sm.awayTeam : (isAngelsAway ? sm.homeTeam : `${sm.homeTeam} vs ${sm.awayTeam}`);
        const isHome = isAngelsHome;
        const timeStr = sm.timeStr || '18:00';
        const dateIso = sm.date || new Date().toISOString();

        if (sm.isFinished && sm.homeSetsWon !== undefined && sm.awaySetsWon !== undefined) {
          const ourSets = isAngels ? (isAngelsAway ? sm.awaySetsWon : sm.homeSetsWon) : sm.homeSetsWon;
          const oppSets = isAngels ? (isAngelsAway ? sm.homeSetsWon : sm.awaySetsWon) : sm.awaySetsWon;
          matchesList.push({
            title: isAngels ? `Angels ZTP vs ${opponent}` : `${sm.homeTeam} vs ${sm.awayTeam}`,
            opponent,
            date: dateIso,
            isHome,
            isAngels,
            homeTeam: sm.homeTeam,
            awayTeam: sm.awayTeam,
            matchType: 'Mecz ligowy',
            teamSetsWon: ourSets,
            opponentSetsWon: oppSets,
            sets: [
              { setNumber: 1, teamScore: ourSets > oppSets ? 25 : 21, opponentScore: ourSets > oppSets ? 21 : 25 }
            ],
            notes: `Runda ${sm.round}, Nr ${sm.matchNumber}. Raport VolleyStation: ${sm.url}`
          });
        } else {
          fixturesList.push({
            title: isAngels ? `Mecz ligowy LALS vs ${opponent}` : `${sm.homeTeam} vs ${sm.awayTeam}`,
            opponent: isAngels ? opponent : `${sm.homeTeam} vs ${sm.awayTeam}`,
            date: dateIso,
            time: timeStr,
            isAngels,
            round: sm.round,
            matchNumber: sm.matchNumber,
            url: sm.url,
            isHome,
            location: isHome ? 'Hala Luboń (Domowa)' : 'Wyjazd',
            description: `Oficjalny mecz LALS (Runda ${sm.round}, Nr ${sm.matchNumber}). Godzina ${timeStr}`
          });
        }
      });

      setParsedMatchesToImport(matchesList);
      setParsedFixturesToImport(fixturesList);
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const currentYear = new Date().getFullYear();

    lines.forEach(line => {
      // 1. Szukaj daty (np. 14.11.2026 lub 14.11 lub 2026-11-14)
      const dateMatch = line.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/) || line.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
      let dateIso = '';

      // 2. Szukaj godziny (np. 19:30 lub 18:00)
      const timeMatch = line.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
      const timeStr = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '19:30';

      if (dateMatch) {
        if (dateMatch[3] && dateMatch[3].length === 4) {
          const d = dateMatch[1].padStart(2, '0');
          const m = dateMatch[2].padStart(2, '0');
          const y = dateMatch[3];
          dateIso = `${y}-${m}-${d}T${timeStr}:00`;
        } else if (dateMatch[1].length === 4) {
          const y = dateMatch[1];
          const m = dateMatch[2].padStart(2, '0');
          const d = dateMatch[3].padStart(2, '0');
          dateIso = `${y}-${m}-${d}T${timeStr}:00`;
        } else {
          const d = dateMatch[1].padStart(2, '0');
          const m = dateMatch[2].padStart(2, '0');
          dateIso = `${currentYear}-${m}-${d}T${timeStr}:00`;
        }
      } else {
        // Jeśli nie ma daty, pomijamy linie nagłówkowe
        return;
      }

      // 3. Sprawdź czy jest wynik meczu, np. 3:1, 3-0, 1:3
      const scoreMatch = line.match(/\b([0-3])\s*[:\-]\s*([0-3])\b/);
      
      // 4. Szukaj setów w nawiasie, np. (25:21, 23:25, 25:18, 25:20)
      const setsMatch = line.match(/\(([^)]+)\)/);
      let detailedSets: VolleyballSet[] = [];

      if (setsMatch) {
        const rawSets = setsMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
        rawSets.forEach((sStr, idx) => {
          const sScores = sStr.match(/(\d+)\s*[:\-]\s*(\d+)/);
          if (sScores) {
            detailedSets.push({
              setNumber: idx + 1,
              teamScore: parseInt(sScores[1]) || 0,
              opponentScore: parseInt(sScores[2]) || 0
            });
          }
        });
      }

      // 5. Nazwy drużyn
      let cleanLine = line
        .replace(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/, '')
        .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/, '')
        .replace(/\(([^)]+)\)/, '')
        .replace(/\b([0-3])\s*[:\-]\s*([0-3])\b/, '')
        .trim();

      let parts = cleanLine.split(/\s+(?:vs|VS|v|\-|–|—)\s+/).map(p => p.trim()).filter(Boolean);
      if (parts.length < 2) {
        parts = cleanLine.split(/\s{2,}|\t/).map(p => p.trim()).filter(Boolean);
      }

      let teamA = parts[0] || 'Angels ZTP';
      let teamB = parts[1] || 'Przeciwnik';

      const aIsAngels = teamA.toLowerCase().includes('angel');
      const bIsAngels = teamB.toLowerCase().includes('angel');

      let opponent = '';
      let isHome = true;

      if (bIsAngels) {
        opponent = teamA;
        isHome = false;
      } else {
        opponent = teamB;
        isHome = true;
      }

      // Czy to rozegrany mecz z wynikiem, czy przyszły mecz terminarza?
      if (scoreMatch) {
        let setsA = parseInt(scoreMatch[1]);
        let setsB = parseInt(scoreMatch[2]);
        let ourSets = bIsAngels ? setsB : setsA;
        let oppSets = bIsAngels ? setsA : setsB;

        if (detailedSets.length === 0) {
          for (let i = 1; i <= ourSets + oppSets; i++) {
            if (i <= ourSets) {
              detailedSets.push({ setNumber: i, teamScore: 25, opponentScore: 20 });
            } else {
              detailedSets.push({ setNumber: i, teamScore: 20, opponentScore: 25 });
            }
          }
        }

        matchesList.push({
          opponent,
          date: dateIso,
          isHome,
          matchType: 'Mecz ligowy',
          teamSetsWon: ourSets,
          opponentSetsWon: oppSets,
          sets: detailedSets,
          notes: `Zaimportowano z LALS: ${line}`
        });
      } else {
        fixturesList.push({
          title: `Mecz ligowy LALS vs ${opponent}`,
          opponent,
          date: dateIso,
          location: 'Hala OSiR, ul. Sportowa 5',
          description: `Oficjalny mecz LALS: ${line}`
        });
      }
    });

    setParsedMatchesToImport(matchesList);
    setParsedFixturesToImport(fixturesList);
  };

  // OCR dla zdjęcia terminarza
  const handleScheduleImageOcr = async (file: File) => {
    setScheduleOcrLoading(true);
    setScheduleOcrProgress(0);
    setScheduleOcrStatus('Wczytywanie zdjęcia terminarza...');
    try {
      const previewUrl = URL.createObjectURL(file);
      setScheduleImagePreview(previewUrl);
      const text = await recognizeTextFromImage(file, p => {
        setScheduleOcrProgress(p.progress);
        setScheduleOcrStatus(p.status);
      });
      setRawScheduleInput(text);
      handleParseScheduleText(text);
    } catch (err: any) {
      alert('Błąd OCR podczas rozpoznawania terminarza: ' + (err?.message || err));
    } finally {
      setScheduleOcrLoading(false);
      setScheduleOcrStatus('');
    }
  };

  // Zapisz zaimportowane mecze i terminarz do bazy
  const handleSaveImportedSchedule = async () => {
    if (parsedMatchesToImport.length === 0 && parsedFixturesToImport.length === 0) {
      alert('Brak rozpoznanych meczów do zaimportowania.');
      return;
    }
    setSubmittingScheduleImport(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BATCH_IMPORT',
          matchesToImport: parsedMatchesToImport,
          fixturesToImport: parsedFixturesToImport,
          scheduleMatches: parsedScheduleMatchesToImport
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Pomyślnie zaimportowano terminarz i mecze!');
        setShowImportScheduleModal(false);
        setRawScheduleInput('');
        setParsedMatchesToImport([]);
        setParsedFixturesToImport([]);
        setParsedScheduleMatchesToImport([]);
        await fetchData();
      } else {
        alert(data.error || 'Błąd importu');
      }
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas zapisywania');
    } finally {
      setSubmittingScheduleImport(false);
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

  // Zunifikowany oficjalny terminarz i wyniki meczów ligowych LALS (zgodny z VolleyStation)
  const unifiedLeagueSchedule = useMemo(() => {
    const items: Array<{
      id: string;
      round?: number;
      matchNumber?: number;
      homeTeam: string;
      awayTeam: string;
      date: string;
      dateHeader: string;
      timeStr?: string;
      isFinished: boolean;
      homeSetsWon?: number;
      awaySetsWon?: number;
      isAngels: boolean;
      isWin?: boolean;
      url?: string;
      sets?: VolleyballSet[];
      mvp?: string;
      notes?: string;
      phaseId?: string;
    }> = [];

    const norm = (s: string) => cleanTeamName(s || '').toLowerCase().trim();

    // 1. Dodaj mecze z oficjalnego leagueSchedule (VolleyStation)
    (leagueSchedule || []).forEach(sm => {
      const isHomeAngels = norm(sm.homeTeam).includes('angel');
      const isAwayAngels = norm(sm.awayTeam).includes('angel');
      const isAngels = isHomeAngels || isAwayAngels;
      const isFinished = Boolean(sm.isFinished && sm.homeSetsWon !== undefined && sm.awaySetsWon !== undefined);

      let isWin: boolean | undefined = undefined;
      if (isFinished && isAngels) {
        isWin = isHomeAngels
          ? (sm.homeSetsWon! > sm.awaySetsWon!)
          : (sm.awaySetsWon! > sm.homeSetsWon!);
      }

      // Połącz z ewentualnym szczegółowym raportem setów w matches
      const matchedLocal = matches.find(m =>
        m.matchType === 'Mecz ligowy' &&
        m.date.slice(0, 10) === (sm.date || '').slice(0, 10) &&
        (norm(m.opponent) === norm(sm.awayTeam) || norm(m.opponent) === norm(sm.homeTeam))
      );

      items.push({
        id: `vs_${sm.matchNumber || sm.round}_${norm(sm.homeTeam)}_${norm(sm.awayTeam)}`,
        round: sm.round,
        matchNumber: sm.matchNumber,
        homeTeam: cleanTeamName(sm.homeTeam),
        awayTeam: cleanTeamName(sm.awayTeam),
        date: sm.date || '2026-11-15T18:00:00',
        dateHeader: sm.dateStr || formatVolleyDate(sm.date || '2026-11-15T18:00:00'),
        timeStr: sm.timeStr || (sm.date && sm.date.includes('T') ? sm.date.slice(11, 16) : '18:00'),
        isFinished,
        homeSetsWon: sm.homeSetsWon,
        awaySetsWon: sm.awaySetsWon,
        isAngels,
        isWin,
        url: sm.url,
        sets: matchedLocal?.sets,
        mvp: matchedLocal?.mvp,
        notes: matchedLocal?.notes,
        phaseId: matchedLocal?.leaguePhaseId || 'faza_1'
      });
    });

    // 2. Dodaj mecze z matches (jeśli jakiegoś brakuje w leagueSchedule)
    matches.filter(m => m.matchType === 'Mecz ligowy').forEach(m => {
      const alreadyPresent = items.some(it =>
        it.date.slice(0, 10) === m.date.slice(0, 10) &&
        (norm(it.awayTeam) === norm(m.opponent) || norm(it.homeTeam) === norm(m.opponent))
      );
      if (!alreadyPresent) {
        const isAngelsWin = m.teamSetsWon > m.opponentSetsWon;
        const homeName = m.isHome ? 'Angels ZTP' : m.opponent;
        const awayName = m.isHome ? m.opponent : 'Angels ZTP';
        const homeSets = m.isHome ? m.teamSetsWon : m.opponentSetsWon;
        const awaySets = m.isHome ? m.opponentSetsWon : m.teamSetsWon;

        const rMatch = m.notes?.match(/Runda\s*(\d+)/i);
        const nrMatch = m.notes?.match(/Nr\s*(\d+)/i);
        const urlMatch = m.notes?.match(/https?:\/\/[^\s\)]+/);

        items.push({
          id: m.id,
          round: rMatch ? parseInt(rMatch[1], 10) : undefined,
          matchNumber: nrMatch ? parseInt(nrMatch[1], 10) : undefined,
          homeTeam: cleanTeamName(homeName),
          awayTeam: cleanTeamName(awayName),
          date: m.date,
          dateHeader: formatVolleyDate(m.date),
          timeStr: m.date.includes('T') ? m.date.slice(11, 16) : '18:00',
          isFinished: true,
          homeSetsWon: homeSets,
          awaySetsWon: awaySets,
          isAngels: true,
          isWin: isAngelsWin,
          sets: m.sets,
          mvp: m.mvp,
          notes: m.notes,
          url: urlMatch ? urlMatch[0] : undefined,
          phaseId: m.leaguePhaseId || 'faza_1'
        });
      }
    });

    // 3. Dodaj nadchodzące mecze z events (jeśli nie ma ich w leagueSchedule)
    events.filter(e => e.type === 'MECZ').forEach(e => {
      const alreadyPresent = items.some(it =>
        it.date.slice(0, 10) === e.date.slice(0, 10) &&
        (norm(it.awayTeam) === norm(e.opponent || '') || norm(it.homeTeam) === norm(e.opponent || ''))
      );
      if (!alreadyPresent && e.opponent) {
        let homeName = 'Angels ZTP';
        let awayName = e.opponent;
        if (e.opponent.includes(' vs ')) {
          const parts = e.opponent.split(' vs ');
          homeName = parts[0];
          awayName = parts[1];
        }

        const rMatch = e.description?.match(/Runda\s*(\d+)/i);
        const nrMatch = e.description?.match(/Nr\s*(\d+)/i);

        items.push({
          id: e.id,
          round: rMatch ? parseInt(rMatch[1], 10) : undefined,
          matchNumber: nrMatch ? parseInt(nrMatch[1], 10) : undefined,
          homeTeam: cleanTeamName(homeName),
          awayTeam: cleanTeamName(awayName),
          date: e.date,
          dateHeader: formatVolleyDate(e.date),
          timeStr: e.date.includes('T') ? e.date.slice(11, 16) : '18:00',
          isFinished: false,
          isAngels: norm(homeName).includes('angel') || norm(awayName).includes('angel'),
          phaseId: 'faza_1'
        });
      }
    });

    return items;
  }, [leagueSchedule, matches, events]);

  const filteredUnifiedSchedule = useMemo(() => {
    return unifiedLeagueSchedule.filter(item => {
      // 1. Filtr fazy
      if (selectedPhaseFilter !== 'ALL') {
        const itemPhase = item.phaseId || 'faza_1';
        if (itemPhase !== selectedPhaseFilter) return false;
      }

      // 2. Filtr zakresu (Wszyscy vs Tylko Angels)
      if (leagueScheduleScope === 'ANGELS' && !item.isAngels) return false;

      // 3. Filtr statusu (Wszystkie vs Terminarz vs Wyniki)
      if (leagueScheduleStatus === 'UPCOMING' && item.isFinished) return false;
      if (leagueScheduleStatus === 'FINISHED' && !item.isFinished) return false;

      // 4. Wyszukiwanie
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          item.homeTeam.toLowerCase().includes(q) ||
          item.awayTeam.toLowerCase().includes(q) ||
          (item.round && `runda ${item.round}`.includes(q)) ||
          (item.matchNumber && `nr ${item.matchNumber}`.includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [unifiedLeagueSchedule, selectedPhaseFilter, leagueScheduleScope, leagueScheduleStatus, searchQuery]);

  // Grupowanie meczów ligowych według daty (dokładnie jak w VolleyStation)
  const groupedScheduleByDate = useMemo(() => {
    const map = new Map<string, { dateHeader: string; timestamp: number; matches: typeof filteredUnifiedSchedule }>();

    filteredUnifiedSchedule.forEach(m => {
      const header = m.dateHeader || formatVolleyDate(m.date);
      if (!map.has(header)) {
        const ts = m.date ? new Date(m.date).getTime() : 0;
        map.set(header, { dateHeader: header, timestamp: isNaN(ts) ? 0 : ts, matches: [] });
      }
      map.get(header)!.matches.push(m);
    });

    const groups = Array.from(map.values());
    if (leagueScheduleStatus === 'UPCOMING') {
      groups.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      groups.sort((a, b) => b.timestamp - a.timestamp);
    }
    return groups;
  }, [filteredUnifiedSchedule, leagueScheduleStatus]);

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

  const handleOpenAddSparingResult = () => {
    const unfinished = sparringsList.find(s => !s.result);
    if (unfinished) {
      openResultModal(unfinished);
    } else if (sparringsList.length > 0) {
      openResultModal(sparringsList[0]);
    } else {
      setEventTypeToCreate('SPARING');
      setEventTitle('Sparing kontrolny');
      setEventOpponent('');
      setEventLocation('Hala Sportowa OSiR, ul. Sportowa 5');
      setEventDate(new Date().toISOString().slice(0, 16));
      setEventIncludeResult(true);
      setShowAddEventModal(true);
    }
  };

  const handleOpenCreateSparing = () => {
    setEventTypeToCreate('SPARING');
    setEventTitle('Sparing kontrolny');
    setEventOpponent('');
    setEventLocation('Hala Sportowa OSiR, ul. Sportowa 5');
    setEventDate(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16));
    setEventIncludeResult(false);
    setShowAddEventModal(true);
  };

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
      : 'bg-purple-500 hover:bg-purple-400 text-slate-900 shadow-purple-500/20';

    const iconColor = isSky ? 'text-sky-400' : isAmber ? 'text-amber-400' : 'text-purple-400';

    return (
      <div 
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
          if (canManage) setIsGalleryDragging(true);
        }}
        onDragEnter={e => {
          e.preventDefault();
          e.stopPropagation();
          if (canManage) setIsGalleryDragging(true);
        }}
        onDragLeave={e => {
          e.preventDefault();
          e.stopPropagation();
          setIsGalleryDragging(false);
        }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          setIsGalleryDragging(false);
          if (canManage && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onAddClick();
            processPhotoFiles(e.dataTransfer.files);
          }
        }}
        className={`space-y-6 relative rounded-3xl transition ${
          isGalleryDragging ? 'ring-4 ring-amber-400 bg-amber-50/20' : ''
        }`}
      >
        {isGalleryDragging && (
          <div className="absolute inset-0 bg-amber-50/95 backdrop-blur-xs border-3 border-dashed border-amber-500 rounded-3xl z-30 flex flex-col items-center justify-center p-8 text-amber-950 pointer-events-none space-y-2">
            <Upload className="w-12 h-12 text-amber-600 animate-bounce" />
            <h3 className="text-lg font-black uppercase font-athletic">Upuść serię zdjęć tutaj!</h3>
            <p className="text-xs font-bold text-amber-800">Automatycznie otworzymy formularz i zoptymalizujemy wszystkie upuszczone zdjęcia.</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Camera className={`w-5 h-5 ${iconColor}`} />
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
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
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
            <Camera className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">Brak zdjęć w tej galerii</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm group cursor-pointer hover:border-slate-300 transition flex flex-col justify-between"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border shadow-xs ${
                        isT
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : isS
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-sky-100 text-sky-900 border-sky-300'
                      }`}>
                        {isT ? '🏆 Turniej' : isS ? '⚔️ Sparing' : '🏐 Mecz LALS'}
                      </span>

                      {photo.seriesTitle && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/70 text-slate-700 border border-white/10 backdrop-blur-sm truncate max-w-[150px]">
                          📁 {photo.seriesTitle}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-slate-900">
                      <span className="text-[10px] font-bold uppercase text-amber-300 tracking-wider block truncate">
                        {photo.matchName || (isT ? 'Turniej Siatkarski' : isS ? 'Sparing Kontrolny' : 'Mecz Ligowy LALS')}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 line-clamp-1">{photo.title}</h4>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs text-slate-500">
                    {photo.caption && <p className="text-slate-600 leading-snug line-clamp-2">{photo.caption}</p>}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-lg">
            <span className="text-xs text-slate-500 font-medium">
              Wyświetlanie <span className="text-slate-900 font-bold">{((photosPage - 1) * PHOTOS_PER_PAGE) + 1}</span>–<span className="text-slate-900 font-bold">{Math.min(photosPage * PHOTOS_PER_PAGE, photos.length)}</span> z <span className="text-slate-900 font-bold">{photos.length}</span> zdjęć
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPhotosPage(p => Math.max(1, p - 1))}
                disabled={photosPage === 1}
                className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                          ? 'bg-purple-500 text-slate-900 shadow-md shadow-purple-500/20'
                          : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPhotosPage(p => Math.min(totalPhotosPages, p + 1))}
                disabled={photosPage === totalPhotosPages}
                className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
            <Volleyball className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-slate-900">
              {activeTab === 'liga' ? 'Lubońska Amatorska Liga Siatkówki (LALS)' : activeTab === 'sparingi' ? 'Mecze Sparingowe' : 'Turnieje Siatkarskie'}
            </h1>
            <p className="text-xs text-slate-500">
              {activeTab === 'liga'
                ? 'Oficjalne mecze ligowe LALS • Terminarz, wyniki i tabela zespołów'
                : activeTab === 'sparingi'
                ? 'Mecze kontrolne i sparingi przygotowawcze zespołu Angels ZTP'
                : 'Turnieje pucharowe, faza grupowa i drabinki meczowe'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. TAB: SPARINGI */}
      {activeTab === 'sparingi' && (
        <div className="space-y-6">
          {/* Sparing Actions Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                Mecze kontrolne ({sparringsList.length})
              </span>
            </div>

            {canManage && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 self-start sm:self-auto py-0.5">
                <button
                  type="button"
                  onClick={handleOpenAddSparingResult}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition shadow-sm whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dodaj Wynik</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateSparing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm whitespace-nowrap shrink-0"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Utwórz Sparing</span>
                </button>
              </div>
            )}
          </div>

          {sparingSubTab === 'mecze' && (
            <div className="space-y-6">

          {/* Sparing Cards List */}
          <div className="space-y-6">
            {sparringsList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500">
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

                // Obliczanie czy do sparingu przypisana jest taktyka
                const cleanOpponent = event.opponent?.trim();
                const sparingTactics = tactics.filter(
                  t => t.eventId === event.id ||
                       t.matchId === event.id ||
                       (t.scope === 'SPARING' && t.eventId === event.id) ||
                       (cleanOpponent && t.targetOpponent && t.targetOpponent.toLowerCase().includes(cleanOpponent.toLowerCase()))
                );
                const hasTactic = sparingTactics.length > 0;

                // Wyznaczenie gospodarza i gościa w meczu sparingowym
                let homeTeam = 'Angels ZTP';
                let awayTeam = cleanOpponent || '';

                if (cleanOpponent) {
                  awayTeam = cleanOpponent;
                  const vsParts = event.title.split(/\s+vs\.?\s+|\s+-\s+/i);
                  if (vsParts.length === 2) {
                    const p1 = vsParts[0].trim();
                    if (!p1.toLowerCase().includes('sparing') && p1.length > 2 && p1.toLowerCase() !== 'angels ztp') {
                      homeTeam = p1;
                    }
                  }
                } else {
                  const vsParts = event.title.split(/\s+vs\.?\s+|\s+-\s+/i);
                  if (vsParts.length === 2) {
                    const p1 = vsParts[0].trim();
                    const p2 = vsParts[1].trim();
                    if (p1.toLowerCase().includes('angels')) {
                      homeTeam = 'Angels ZTP';
                      awayTeam = p2;
                    } else if (p2.toLowerCase().includes('angels')) {
                      homeTeam = p1;
                      awayTeam = 'Angels ZTP';
                    } else if (p1.length > 2) {
                      homeTeam = p1;
                      awayTeam = p2;
                    } else {
                      homeTeam = 'Angels ZTP';
                      awayTeam = p2;
                    }
                  } else {
                    const t = event.title.replace(/^sparing\s*(kontrolny)?\s*(z|vs)?\s*/i, '').trim();
                    awayTeam = t || 'Rywal Sparingowy';
                    homeTeam = 'Angels ZTP';
                  }
                }

                const isHomeAngels = homeTeam.toLowerCase().includes('angels') || (!homeTeam.toLowerCase().includes('vs') && !awayTeam.toLowerCase().includes('angels'));
                const isAwayAngels = awayTeam.toLowerCase().includes('angels');

                return (
                  <div
                    key={event.id}
                    className={`bg-white border ${
                      isExpanded ? 'border-amber-400 shadow-md ring-2 ring-amber-100/70' : 'border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-sm'
                    } border-l-[6px] border-l-amber-500 rounded-3xl overflow-hidden transition-all duration-200`}
                  >
                    {/* Zwijany Nagłówek Karty Sparingowej */}
                    <div
                      onClick={() => toggleSparring(event.id)}
                      className="p-4 sm:p-5 cursor-pointer flex flex-col gap-4 select-none hover:bg-amber-50/15 transition group"
                    >
                      {/* 1. Górna belka metadanych i szybkich akcji */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                        {/* Lewa strona: Data/Godzina + Badges + Lokalizacja */}
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {/* Data i Godzina - wyrazisty dark badge w stylu sportowym */}
                          <div className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="uppercase">{new Date(event.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-amber-300">{new Date(event.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {/* Typ: Sparing */}
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs shrink-0">
                            ⚔️ SPARING
                          </span>

                          {/* Status */}
                          {isFinished ? (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Rozegrany
                            </span>
                          ) : event.liveScore?.isLive ? (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1.5 animate-pulse shadow-2xs shrink-0">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                              🔴 NA ŻYWO: Set {event.liveScore.currentSet} ({event.liveScore.teamCurrentScore}:{event.liveScore.opponentCurrentScore})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              ⏳ Zgłoszenia w toku
                            </span>
                          )}

                          {/* Lokalizacja na desktopie */}
                          {event.location && (
                            <span className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-medium ml-1 truncate max-w-[280px]">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Prawa strona: Taktyka, Frekwencja, Chevron */}
                        <div 
                          onClick={e => e.stopPropagation()} 
                          className="flex items-center gap-2 shrink-0 ml-auto"
                        >
                          {/* Przycisk Taktyki – podświetlony gdy jest taktyka, wyszarzony gdy jej brak */}
                          {hasTactic ? (
                            <Link
                              href={`/taktyka?eventId=${event.id}&type=SPARING`}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition"
                              title={`Założenia taktyczne sparingu (${sparingTactics.length})`}
                            >
                              <Target className="w-3.5 h-3.5 text-sky-600" />
                              <span>Taktyka 🎯</span>
                            </Link>
                          ) : canManage ? (
                            <Link
                              href={`/taktyka?eventId=${event.id}&type=SPARING`}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition opacity-60 hover:opacity-100"
                              title="Brak taktyki – kliknij, aby utworzyć założenia dla tego sparingu"
                            >
                              <Target className="w-3.5 h-3.5 text-slate-400" />
                              <span>Taktyka</span>
                            </Link>
                          ) : (
                            <div
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 opacity-40 cursor-not-allowed select-none"
                              title="Brak taktyki dla tego sparingu"
                            >
                              <Target className="w-3.5 h-3.5 text-slate-400" />
                              <span>Taktyka</span>
                            </div>
                          )}

                          {/* Licznik obecności */}
                          <span className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            <span>{yesCount}</span>
                            <span className="hidden sm:inline">obecnych</span>
                          </span>

                          {/* Przycisk rozwijania (Chevron) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSparring(event.id);
                            }}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                              isExpanded ? 'rotate-180 bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
                            }`}
                            title={isExpanded ? 'Zwiń szczegóły' : 'Rozwiń szczegóły'}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 2. Główna Arena Pojedynku: Gospodarz vs Gość z centralną tablicą wyników */}
                      <div className="py-2 flex items-center justify-between gap-3 sm:gap-6 min-w-0">
                        {/* Gospodarz / Drużyna A (Wyrównanie do prawej na desktopie) */}
                        <div className="flex items-center justify-end gap-2.5 sm:gap-3.5 flex-1 min-w-0 text-right">
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider block">
                              Gospodarz
                            </span>
                            <h4 className={`text-base sm:text-xl font-black ${isHomeAngels ? 'text-sky-950 font-athletic' : 'text-slate-900'} group-hover:text-amber-700 transition tracking-tight truncate`}>
                              {homeTeam}
                            </h4>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-sky-400 shadow-sm shrink-0 bg-slate-900 flex items-center justify-center ring-2 ring-sky-100">
                            {isHomeAngels ? (
                              <img src="/logo.jpg" alt={homeTeam} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-black text-base uppercase">{(homeTeam[0] || '?').toUpperCase()}</span>
                            )}
                          </div>
                        </div>

                        {/* Środkowa tablica: Wynik meczu / VS */}
                        <div className="shrink-0 flex flex-col items-center justify-center min-w-[90px] sm:min-w-[140px] px-2 text-center">
                          {isFinished && event.result ? (
                            <>
                              <div className="px-4 sm:px-6 py-1 sm:py-1.5 rounded-2xl bg-slate-950 text-white font-mono font-black text-xl sm:text-2xl tracking-widest text-center shadow-md border border-slate-800">
                                {event.result.teamSetsWon} : {event.result.opponentSetsWon}
                              </div>
                              {event.result.sets && event.result.sets.length > 0 ? (
                                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 mt-1 tracking-tight truncate max-w-[160px]">
                                  ({event.result.sets.map(s => `${s.teamScore}:${s.opponentScore}`).join(', ')})
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                  Wynik końcowy
                                </span>
                              )}
                            </>
                          ) : event.liveScore?.isLive ? (
                            <>
                              <div className="px-4 py-1.5 rounded-2xl bg-rose-600 text-white font-mono font-black text-lg sm:text-xl tracking-wider text-center shadow-md animate-pulse">
                                {event.liveScore.teamSetsWon || 0} : {event.liveScore.opponentSetsWon || 0}
                              </div>
                              <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider mt-1">
                                Set {event.liveScore.currentSet} ({event.liveScore.teamCurrentScore}:{event.liveScore.opponentCurrentScore})
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-amber-300 shadow-sm font-athletic tracking-wider">
                                VS
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-600 mt-1">
                                {new Date(event.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Gość / Drużyna B (Wyrównanie do lewej na desktopie) */}
                        <div className="flex items-center justify-start gap-2.5 sm:gap-3.5 flex-1 min-w-0 text-left">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-sm shrink-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white font-black text-base uppercase ring-2 ring-slate-100">
                            {isAwayAngels ? (
                              <img src="/logo.jpg" alt={awayTeam} className="w-full h-full object-cover" />
                            ) : (
                              (awayTeam[0] || '?').toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block">
                              Gość
                            </span>
                            <h4 className={`text-base sm:text-xl font-black ${isAwayAngels ? 'text-sky-950 font-athletic' : 'text-slate-900'} group-hover:text-amber-700 transition tracking-tight truncate`}>
                              {awayTeam}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Mobilny wiersz lokalizacji */}
                      {event.location && (
                        <div className="flex md:hidden items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Rozwijana Zawartość Karty Sparingowej */}
                    {isExpanded && (
                      <div className="p-6 sm:p-7 border-t border-slate-200 space-y-6 animate-fadeIn bg-white">
                        {/* Coach & Captain Management Controls */}
                        {canManage && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
                            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                              Zarządzanie Sparingiem:
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => setShareModalEvent(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition flex items-center gap-1.5 shadow-xs"
                                title="Wygeneruj i skopiuj gotowy raport na WhatsApp / Messenger"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Na Czat</span>
                              </button>

                              <button
                                onClick={() => handleOpenAutoLineup(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1.5 shadow-xs"
                                title="Automatycznie wygeneruj wyjściową szóstkę"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-600" />
                                <span>Szóstka</span>
                              </button>

                              <button
                                onClick={() => handleOpenLiveScorekeeper(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 transition flex items-center gap-1.5 shadow-xs"
                                title="Opcjonalnie: klikaj punkt po punkcie na żywo w trakcie sparingu"
                              >
                                <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                <span>Live Score (opcjonalnie)</span>
                              </button>

                              {isFinished && (
                                <button
                                  onClick={() => setSocialModalEvent(event)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 transition flex items-center gap-1.5 shadow-xs"
                                  title="Wygeneruj post do Social Mediów"
                                >
                                  <Award className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Social Post</span>
                                </button>
                              )}

                              <button
                                onClick={() => openResultModal(event)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 shadow-xs"
                                title="Wpisz wynik po sparingu (bez klikania każdego punktu)"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                {isFinished ? 'Edytuj wynik' : 'Wpisz wynik po sparingu'}
                              </button>

                              <button
                                onClick={() => handleDeleteEvent(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 shadow-xs"
                                title="Usuń sparing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Usuń Sparing</span>
                              </button>
                            </div>
                          </div>
                        )}

                    {/* Step 1: Ankieta Dostępności (RSVP) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                            1
                          </span>
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                            Ankieta Dostępności Zawodników
                          </h4>
                        </div>

                        {/* Player Vote Buttons OR Coach Banner */}
                        {user && (
                          user.role === 'TRENER' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
                              <Flame className="w-3.5 h-3.5 text-sky-600" />
                              <span>Sztab trenerski (Obecność stała)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAttendance(event.id, 'BEDE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs ${
                                  myAttendance?.status === 'BEDE'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Będę
                              </button>
                              <button
                                onClick={() => handleAttendance(event.id, 'NIEPEWNE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs ${
                                  myAttendance?.status === 'NIEPEWNE'
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
                                }`}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                Niepewny
                              </button>
                              <button
                                onClick={() => handleAttendance(event.id, 'NIE_BEDE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs ${
                                  myAttendance?.status === 'NIE_BEDE'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
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
                      <div className="flex items-center gap-4 text-xs pt-1">
                        <span className="font-bold text-emerald-700">🟢 Będą: {yesCount}</span>
                        <span className="font-bold text-amber-700">🟡 Niepewni: {maybeCount}</span>
                        <span className="font-bold text-rose-700">🔴 Nieobecni: {noCount}</span>
                      </div>

                      {/* Declared players list */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {event.attendees.map(a => (
                          <span
                            key={a.userId}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 shadow-2xs ${
                              a.status === 'BEDE'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : a.status === 'NIEPEWNE'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <span>{a.userName}</span>
                            {a.note && <span className="text-[10px] text-slate-500">({a.note})</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Wyjściowa Szóstka Meczu */}
                    {event.lineup && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                              ⚡
                            </span>
                            <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider">
                              Oficjalna Wyjściowa Szóstka Meczu
                            </h4>
                          </div>
                          {canManage && (
                            <button
                              onClick={() => handleOpenAutoLineup(event)}
                              className="text-xs text-amber-800 hover:text-amber-900 hover:underline font-bold"
                            >
                              Zmień szóstkę
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold block">Rozgrywający (R)</span>
                            <span className="font-bold text-sky-800">{event.lineup.setter}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold block">Atakujący (A)</span>
                            <span className="font-bold text-rose-800">{event.lineup.opposite}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold block">Przyjmujący (P1, P2)</span>
                            <span className="font-bold text-emerald-800">{event.lineup.outsideHitters?.join(', ')}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold block">Środkowi (Ś1, Ś2)</span>
                            <span className="font-bold text-purple-800">{event.lineup.middleBlockers?.join(', ')}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold block">Libero (L)</span>
                            <span className="font-bold text-amber-900">{event.lineup.libero}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold block">Rezerwowi</span>
                            <span className="font-medium text-slate-600 truncate block">{event.lineup.reserves?.slice(0, 3).join(', ') || 'Brak'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Wynik Sparingi (Score & Sets) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                            2
                          </span>
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                            Wynik Sparingi (Podsumowanie pomeczowe)
                          </h4>
                        </div>

                        {canManage && (
                          <button
                            onClick={() => openResultModal(event)}
                            className="text-xs text-amber-800 hover:text-amber-900 hover:underline font-bold"
                          >
                            {isFinished ? 'Edytuj wynik' : 'Wpisz wynik'}
                          </button>
                        )}
                      </div>

                      {isFinished ? (
                        <div className="space-y-4 pt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="text-3xl font-black font-mono text-slate-900 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 self-start">
                              {event.result!.teamSetsWon} : {event.result!.opponentSetsWon}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-500 uppercase">
                                Wyniki setów:
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {event.result!.sets.map(s => (
                                  <span
                                    key={s.setNumber}
                                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-800"
                                  >
                                    Set {s.setNumber}: {s.teamScore}-{s.opponentScore}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {event.result!.mvp && (
                            <div className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                              <Trophy className="w-4 h-4 text-amber-600" />
                              <span>MVP Sparingi: <strong>{event.result!.mvp}</strong></span>
                            </div>
                          )}

                          {event.result!.notes && (
                            <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200">
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
                        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-sky-600" />
                              <h4 className="text-xs font-black uppercase text-sky-900 tracking-wider">
                                📸 Zrzuty Taktyczne & Wytyczne Trenera na ten Mecz ({linkedTactics.length})
                              </h4>
                            </div>
                            <a
                              href={`/taktyka?eventId=${event.id}&type=SPARING`}
                              className="text-xs text-sky-700 hover:text-sky-900 hover:underline font-bold flex items-center gap-1"
                            >
                              <span>Otwórz w Tablicy Taktycznej</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {linkedTactics.map(tac => {
                              const acceptedPosts = (tac.posts || []).filter(p => p.status === 'ZAAKCEPTOWANY');
                              return (
                                <div key={tac.id} className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
                                  {tac.drawingData && (
                                    <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                                      <img src={tac.drawingData} alt={tac.title} className="w-full h-full object-contain" />
                                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white text-[10px] font-black text-amber-800 border border-slate-300 shadow-2xs">
                                        {tac.rotation} • {tac.phase}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="font-black text-xs text-slate-900">{tac.title}</h5>
                                    {tac.description && (
                                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                                        {tac.description}
                                      </p>
                                    )}
                                    <a
                                      href={`/taktyka?eventId=${event.id}&tacticId=${tac.id}`}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 mt-1.5"
                                    >
                                      <span>Załaduj ten zrzut na tablicę →</span>
                                    </a>
                                  </div>

                                  {/* Accepted player posts */}
                                  {acceptedPosts.length > 0 && (
                                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                                      <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        Zaakceptowane uwagi zawodników do meczu:
                                      </span>
                                      {acceptedPosts.map(p => (
                                        <div key={p.id} className="text-[11px] text-slate-700 pl-1">
                                          • <strong className="text-slate-900">{p.authorName}:</strong> {p.content}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-lg">
              <span className="text-xs text-slate-500 font-medium">
                Wyświetlanie <span className="text-slate-900 font-bold">{((sparringsPage - 1) * SPARRINGS_PER_PAGE) + 1}</span>–<span className="text-slate-900 font-bold">{Math.min(sparringsPage * SPARRINGS_PER_PAGE, sparringsList.length)}</span> z <span className="text-slate-900 font-bold">{sparringsList.length}</span> sparingów
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSparringsPage(p => Math.max(1, p - 1))}
                  disabled={sparringsPage === 1}
                  className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                          : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSparringsPage(p => Math.min(totalSparringsPages, p + 1))}
                  disabled={sparringsPage === totalSparringsPages}
                  className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
          {/* Liga Subtabs (Tabela, Wyniki, Statystyki) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setLigaSubTab('tabela')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition whitespace-nowrap ${
                  ligaSubTab === 'tabela'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Tabela Ligowa</span>
              </button>
              <button
                onClick={() => setLigaSubTab('wyniki')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition whitespace-nowrap ${
                  ligaSubTab === 'wyniki'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Volleyball className="w-3.5 h-3.5" />
                <span>Wyniki & Terminarz</span>
              </button>
              <button
                onClick={() => setLigaSubTab('statystyki')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition whitespace-nowrap ${
                  ligaSubTab === 'statystyki'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Statystyki VolleyStation</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 py-0.5">
              {ligaSubTab === 'tabela' && (
                <>
                  {canManageMatches && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenCreatePhase}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm whitespace-nowrap shrink-0"
                        title="Utwórz nowy etap / nową tabelę (np. Faza Finałowa) i wklej zestawienie"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Nowa Tabela</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditTable(currentLeaguePhase?.id || 'faza_1', 'text')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-sky-800 border border-slate-200 transition shadow-sm whitespace-nowrap shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>Import Tabeli</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditTable(currentLeaguePhase?.id || 'faza_1')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm whitespace-nowrap shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edytuj Tabelę</span>
                      </button>
                    </>
                  )}
                  <a
                    href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-sky-700 border border-slate-200 transition shadow-sm whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>VolleyStation ↗</span>
                  </a>
                </>
              )}
              {ligaSubTab === 'wyniki' && (
                <>
                  {canManageMatches && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowImportScheduleModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-sky-800 border border-slate-200 transition shadow-sm whitespace-nowrap shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>Import Terminarza</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMatchModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dodaj Wynik</span>
                      </button>
                    </>
                  )}
                  <a
                    href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-sky-700 border border-slate-200 transition shadow-sm whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>VolleyStation ↗</span>
                  </a>
                </>
              )}
              {ligaSubTab === 'statystyki' && (
                <>
                  {canManageMatches && (
                    <button
                      type="button"
                      onClick={() => setShowVolleyStationImportModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm whitespace-nowrap shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import Statystyk</span>
                    </button>
                  )}
                  <a
                    href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-sky-700 border border-slate-200 transition shadow-sm whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>VolleyStation ↗</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* SubTab 1: TABELA LIGOWA */}
          {ligaSubTab === 'tabela' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5 text-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-slate-50 border border-slate-200 shadow-sm shrink-0 overflow-hidden">
                    <img
                      src="/lals_logo.png"
                      alt="Logo LALS"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                        Lubońska Amatorska Liga Siatkówki (LALS)
                      </h3>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {currentLeaguePhase?.shortName || 'Tabela Ligowa'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Oficjalne rozgrywki LALS • Klasyfikacja punktowa, bilans setów i małych punktów.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                {/* Przełącznik tabel ligowych i przycisk Nowa Tabela */}
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 overflow-x-auto scrollbar-none">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider px-2 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-sky-600" /> Tabela:
                  </span>
                  {leaguePhases.map((phase: any) => {
                    const isSelected = (phase.id === activeLeaguePhaseId);
                    return (
                      <div key={phase.id} className="inline-flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSwitchPhase(phase.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {phase.shortName || phase.name}
                        </button>
                        {canManageMatches && leaguePhases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePhase(phase.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                            title={`Usuń tabelę "${phase.name}"`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {canManageMatches && (
                    <button
                      type="button"
                      onClick={handleOpenCreatePhase}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1 shrink-0"
                      title="Utwórz nowy etap / nową tabelę ligową (nie gryzie się z Faza I)"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>+ Nowa tabela</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-600 font-medium">
                    Drużyn w tabeli: <strong className="text-slate-900 font-mono font-bold">{leagueTable.length}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-sky-800 border border-slate-200 shadow-2xs">
                    <span>Oficjalna Tabela VolleyStation</span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-black bg-sky-600 text-white">LIVE</span>
                  </span>
                </div>
              </div>

              {/* Mobile Swipe Hint */}
              <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-medium">
                <span>Tabela ligowa LALS</span>
                <span className="text-sky-600 font-bold flex items-center gap-1">Przesuń tabelę w prawo &rarr;</span>
              </div>

              {/* Responsive Table Container */}
              <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-2xl border border-slate-200 bg-white shadow-sm scrollbar-thin">
                <table className="w-full text-xs text-left whitespace-nowrap min-w-[960px]">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-200 text-center sticky left-0 bg-slate-50 z-20 w-12 min-w-[48px] max-w-[48px]">Poz.</th>
                      <th rowSpan={2} className="py-2.5 px-4 border-r border-slate-200 sticky left-[48px] bg-slate-50 z-20 min-w-[190px]">Drużyna</th>
                      <th rowSpan={2} className="py-2.5 px-3 text-center font-black text-slate-900 border-r border-slate-200">Punkty</th>
                      <th colSpan={3} className="py-1 px-2 text-center border-b border-r border-slate-200 bg-slate-100/70 text-slate-700 font-bold">Mecze</th>
                      <th colSpan={2} className="py-1 px-2 text-center border-b border-r border-slate-200 bg-slate-100/70 text-slate-700 font-bold">Sety</th>
                      <th colSpan={2} className="py-1 px-2 text-center border-b border-r border-slate-200 bg-slate-100/70 text-slate-700 font-bold">Punkty</th>
                      <th colSpan={2} className="py-1 px-2 text-center border-b border-r border-slate-200 bg-slate-100/70 text-slate-700 font-bold">Stosunek</th>
                      <th colSpan={6} className="py-1 px-2 text-center border-b border-r border-slate-200 bg-slate-100/70 text-slate-700 font-bold">Wynik</th>
                      <th rowSpan={2} className="py-2.5 px-3 text-center">Forma</th>
                    </tr>
                    <tr className="border-b border-slate-200 text-[9px]">
                      {/* Mecze */}
                      <th className="py-1.5 px-2 text-center text-slate-500">Rozegr.</th>
                      <th className="py-1.5 px-2 text-center text-emerald-700">Wygr.</th>
                      <th className="py-1.5 px-2 text-center text-rose-600 border-r border-slate-200">Przegr.</th>

                      {/* Sety */}
                      <th className="py-1.5 px-2 text-center text-emerald-700">Wygr.</th>
                      <th className="py-1.5 px-2 text-center text-rose-600 border-r border-slate-200">Przegr.</th>

                      {/* Punkty */}
                      <th className="py-1.5 px-2 text-center text-emerald-700">Wygr.</th>
                      <th className="py-1.5 px-2 text-center text-rose-600 border-r border-slate-200">Przegr.</th>

                      {/* Stosunek */}
                      <th className="py-1.5 px-2 text-center text-sky-700">Sety</th>
                      <th className="py-1.5 px-2 text-center text-sky-700 border-r border-slate-200">Punkty</th>

                      {/* Wynik */}
                      <th className="py-1.5 px-1.5 text-center text-slate-700 font-mono">3-0</th>
                      <th className="py-1.5 px-1.5 text-center text-slate-700 font-mono">3-1</th>
                      <th className="py-1.5 px-1.5 text-center text-slate-700 font-mono">3-2</th>
                      <th className="py-1.5 px-1.5 text-center text-slate-500 font-mono">2-3</th>
                      <th className="py-1.5 px-1.5 text-center text-slate-500 font-mono">1-3</th>
                      <th className="py-1.5 px-1.5 text-center text-slate-500 font-mono border-r border-slate-200">0-3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                    {leagueTable.map((team, idx) => {
                      const isAngels = team.teamName.toLowerCase().includes('angels');
                      const advSpots = currentLeaguePhase?.advancementSpots ?? 0;
                      const isAdvancing = advSpots > 0 && team.position <= advSpots;
                      const isGoldMedalist = advSpots === 0 && team.position === 1;
                      const isMedalist = advSpots === 0 && team.position <= 3;

                      const mWon = team.matchesWon !== undefined
                        ? team.matchesWon
                        : (team.form ? team.form.filter(f => f === 'W').length : '-');
                      const mLost = team.matchesLost !== undefined
                        ? team.matchesLost
                        : (team.form ? team.form.filter(f => f === 'P').length : '-');
                      const setRatioStr = team.setRatio !== undefined
                        ? (typeof team.setRatio === 'number' ? team.setRatio.toFixed(4) : team.setRatio)
                        : (team.setsLost > 0 ? (team.setsWon / team.setsLost).toFixed(4) : (team.setsWon > 0 ? 'MAX' : '-'));
                      const pointRatioStr = team.pointRatio !== undefined
                        ? (typeof team.pointRatio === 'number' ? team.pointRatio.toFixed(4) : team.pointRatio)
                        : (team.pointsLost > 0 ? (team.pointsWon / team.pointsLost).toFixed(4) : (team.pointsWon > 0 ? 'MAX' : '-'));

                      const rowBg = isAngels ? 'bg-sky-50 font-bold' : isAdvancing ? 'bg-emerald-50/20' : 'bg-white';
                      const stickyCellBg = isAngels ? 'bg-sky-50' : isAdvancing ? 'bg-emerald-50/30' : 'bg-white';

                      return (
                        <React.Fragment key={team.id || idx}>
                          <tr className={`hover:bg-slate-50 transition ${rowBg}`}>
                            <td className={`py-3 px-2 text-center sticky left-0 ${stickyCellBg} z-10 border-r border-slate-100 w-12 min-w-[48px] max-w-[48px]`}>
                              <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center font-black text-xs ${
                                isAdvancing
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isGoldMedalist
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : isMedalist && team.position === 2
                                  ? 'bg-slate-200 text-slate-800 font-bold'
                                  : isMedalist && team.position === 3
                                  ? 'bg-amber-100 text-amber-800 font-bold'
                                  : 'bg-slate-100 text-slate-600 font-bold'
                              }`}>
                                {team.position}
                              </span>
                            </td>

                            <td className={`py-3 px-4 font-sans font-bold text-slate-900 text-sm sticky left-[48px] ${stickyCellBg} z-10 border-r border-slate-200 min-w-[190px]`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                {team.teamUrl ? (
                                  <a
                                    href={team.teamUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline hover:text-sky-600 transition flex items-center gap-1.5"
                                    title="Otwórz profil drużyny na VolleyStation"
                                  >
                                    <span>{team.teamName}</span>
                                  </a>
                                ) : (
                                  <span>{team.teamName}</span>
                                )}
                                {isAngels && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-300">
                                    Nasz Klub
                                  </span>
                                )}
                                {isAdvancing && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 hidden md:inline-flex">
                                    🟢 Awans
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center text-sm font-black text-slate-900 border-r border-slate-200">{team.points}</td>
                            
                            {/* Mecze */}
                            <td className="py-3 px-2 text-center text-slate-700">{team.matchesPlayed}</td>
                            <td className="py-3 px-2 text-center text-emerald-700 font-bold">{mWon}</td>
                            <td className="py-3 px-2 text-center text-rose-600 border-r border-slate-200">{mLost}</td>

                            {/* Sety */}
                            <td className="py-3 px-2 text-center text-emerald-700 font-bold">{team.setsWon}</td>
                            <td className="py-3 px-2 text-center text-rose-600 border-r border-slate-200">{team.setsLost}</td>

                            {/* Punkty */}
                            <td className="py-3 px-2 text-center text-emerald-700">{team.pointsWon}</td>
                            <td className="py-3 px-2 text-center text-rose-600 border-r border-slate-200">{team.pointsLost}</td>

                            {/* Stosunek */}
                            <td className="py-3 px-2 text-center text-sky-700">{setRatioStr}</td>
                            <td className="py-3 px-2 text-center text-sky-700 border-r border-slate-200">{pointRatioStr}</td>

                            {/* Wyniki */}
                            <td className="py-3 px-1.5 text-center text-slate-700">{team.w3_0 ?? 0}</td>
                            <td className="py-3 px-1.5 text-center text-slate-700">{team.w3_1 ?? 0}</td>
                            <td className="py-3 px-1.5 text-center text-slate-700">{team.w3_2 ?? 0}</td>
                            <td className="py-3 px-1.5 text-center text-slate-500">{team.p2_3 ?? 0}</td>
                            <td className="py-3 px-1.5 text-center text-slate-500">{team.p1_3 ?? 0}</td>
                            <td className="py-3 px-1.5 text-center text-slate-500 border-r border-slate-200">{team.p0_3 ?? 0}</td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {(team.form || []).map((f, i) => (
                                  <span
                                    key={i}
                                    className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                                      f === 'W' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>

                          {/* Dynamiczna linia oddzielająca strefę awansu */}
                          {advSpots > 0 && team.position === advSpots && (
                            <tr className="bg-emerald-50 border-y-2 border-emerald-300">
                              <td colSpan={19} className="py-2.5 px-4">
                                <div className="flex items-center justify-between gap-3 text-xs font-black uppercase text-emerald-800">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                    <span>▲ STREFA AWANSU: {advSpots} {advSpots === 1 ? 'DRUŻYNA AWANSUJE' : advSpots < 5 ? 'DRUŻYNY AWANSUJĄ' : 'DRUŻYN AWANSUJE'} DO: {currentLeaguePhase?.advancementTargetName || 'KOLEJNEJ FAZY'} ▲</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-emerald-600 lowercase hidden sm:inline">
                                    miejsca 1–{advSpots} &rarr; {currentLeaguePhase?.advancementTargetName || 'kolejny etap'}
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
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    <strong>Format grupy:</strong> W tej grupie występuje <strong>{leagueTable.length} zespołów</strong>.{' '}
                    {currentLeaguePhase?.advancementSpots && currentLeaguePhase.advancementSpots > 0 ? (
                      <>
                        Zgodnie z regulaminem, <strong>{currentLeaguePhase.advancementSpots} {currentLeaguePhase.advancementSpots === 1 ? 'najlepsza drużyna' : currentLeaguePhase.advancementSpots < 5 ? 'najlepsze drużyny' : 'najlepszych drużyn'} (miejsca 1–{currentLeaguePhase.advancementSpots})</strong> uzyskuje bezpośredni awans do: <strong>{currentLeaguePhase.advancementTargetName || 'Grupy Finałowej'}</strong>.
                      </>
                    ) : (
                      <>
                        Faza medalowa / ostateczna – walka systemem ligowym o końcowe pozycje oraz medale mistrzostw.
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
            <div className="space-y-5">
              {/* Filter Toolbar for Matches & Schedule */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                {/* Row 1: Scope & Status Toggles */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl overflow-x-auto scrollbar-none shrink-0">
                    <button
                      type="button"
                      onClick={() => setLeagueScheduleScope('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        leagueScheduleScope === 'ALL'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🌐 Cała Liga LALS ({unifiedLeagueSchedule.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeagueScheduleScope('ANGELS')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                        leagueScheduleScope === 'ANGELS'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>👼 Tylko Angels ZTP</span>
                      <span className="font-mono text-[11px]">({unifiedLeagueSchedule.filter(m => m.isAngels).length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs overflow-x-auto scrollbar-none shrink-0">
                    <button
                      type="button"
                      onClick={() => setLeagueScheduleStatus('ALL')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                        leagueScheduleStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Wszystkie ({filteredUnifiedSchedule.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeagueScheduleStatus('UPCOMING')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1 ${
                        leagueScheduleStatus === 'UPCOMING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>📅 Terminarz</span>
                      <span className="text-[10px] opacity-75 font-mono">({unifiedLeagueSchedule.filter(m => !m.isFinished && (leagueScheduleScope === 'ALL' || m.isAngels)).length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeagueScheduleStatus('FINISHED')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1 ${
                        leagueScheduleStatus === 'FINISHED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🏆 Wyniki</span>
                      <span className="text-[10px] opacity-75 font-mono">({unifiedLeagueSchedule.filter(m => m.isFinished && (leagueScheduleScope === 'ALL' || m.isAngels)).length})</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Phase filter pills & match counts */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0 mr-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-sky-600" /> Faza:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPhaseFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 border ${
                        selectedPhaseFilter === 'ALL'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                      }`}
                    >
                      Wszystkie fazy
                    </button>
                    {(leaguePhases.length > 0 ? leaguePhases : [
                      { id: 'faza_1', name: 'Faza I: Grupa Eliminacyjna', shortName: 'Faza I' },
                      { id: 'faza_2', name: 'Faza II: Grupa Finałowa', shortName: 'Faza II' }
                    ]).map((p: any) => {
                      const isSel = selectedPhaseFilter === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPhaseFilter(p.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 border ${
                            isSel
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                          }`}
                        >
                          {p.shortName || p.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Pokazano: <strong className="text-slate-900 font-mono font-bold">{filteredUnifiedSchedule.length}</strong> spotkań w <strong className="text-slate-900 font-mono font-bold">{groupedScheduleByDate.length}</strong> terminach
                  </div>
                </div>
              </div>

              {/* Grouped Matches by Date (VolleyStation Format) */}
              {groupedScheduleByDate.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 shadow-sm space-y-2">
                  <Volleyball className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
                  <p className="font-bold text-slate-700">Brak spotkań spełniających wybrane kryteria.</p>
                  <p className="text-xs text-slate-500">Zmień filtry lub zaimportuj terminarz i wyniki za pomocą przycisku &quot;Import Terminarza / Wyników&quot; powyżej.</p>
                </div>
              ) : (
                groupedScheduleByDate.map(group => (
                  <div key={group.dateHeader} className="space-y-2.5">
                    {/* Date Header Pill */}
                    <div className="flex items-center gap-2 px-1 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">
                      <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{group.dateHeader}</span>
                      <span className="text-[11px] font-mono text-slate-500 lowercase font-normal">
                        ({group.matches.length} {group.matches.length === 1 ? 'mecz' : group.matches.length < 5 ? 'mecze' : 'meczów'})
                      </span>
                    </div>

                    {/* Card container for this date */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100">
                      {group.matches.map(m => {
                        const isExpanded = Boolean(expandedMatches[m.id]);
                        const isOurTeamHome = m.homeTeam.toLowerCase().includes('angel');
                        const isOurTeamAway = m.awayTeam.toLowerCase().includes('angel');
                        const isAngels = isOurTeamHome || isOurTeamAway;

                        return (
                          <div
                            key={m.id}
                            className={`transition ${isAngels ? 'bg-sky-50/40 hover:bg-sky-50/70' : 'hover:bg-slate-50/70'}`}
                          >
                            {/* Desktop / Tablet Match Row */}
                            <div
                              onClick={() => toggleMatch(m.id)}
                              className="hidden sm:flex items-center justify-between p-3.5 sm:px-5 cursor-pointer select-none group"
                            >
                              {/* Left: Round & Match Number */}
                              <div className="w-20 lg:w-24 shrink-0 border-r border-slate-200 pr-3 mr-3 text-left leading-tight">
                                <span className="text-[11px] text-slate-600 font-mono block">
                                  {m.round ? `Runda: ${m.round}` : 'LALS'}
                                </span>
                                <span className="text-[11px] text-slate-700 font-mono font-bold block">
                                  {m.matchNumber ? `Nr ${m.matchNumber}` : 'Mecz'}
                                </span>
                              </div>

                              {/* Center: Team A, Crest, Center Pill, Crest, Team B */}
                              <div className="flex-1 flex items-center justify-between gap-3 px-2 min-w-0">
                                {/* Home Team (Right-aligned) */}
                                <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                                  <span className={`text-sm truncate font-bold ${isOurTeamHome ? 'text-sky-700 font-black' : 'text-slate-900'}`}>
                                    {m.homeTeam}
                                  </span>
                                  <TeamShieldBadge name={m.homeTeam} isAngels={isOurTeamHome} />
                                </div>

                                {/* Center Pill: Score or Time */}
                                <div className="shrink-0 flex items-center justify-center min-w-[76px]">
                                  {m.isFinished && m.homeSetsWon !== undefined && m.awaySetsWon !== undefined ? (
                                    <div className="px-3.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-black text-sm tracking-widest text-center shadow-sm">
                                      {m.homeSetsWon} : {m.awaySetsWon}
                                    </div>
                                  ) : (
                                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs text-center border border-slate-200 whitespace-nowrap">
                                      {m.timeStr || '18:00'}
                                    </div>
                                  )}
                                </div>

                                {/* Away Team (Left-aligned) */}
                                <div className="flex items-center justify-start gap-2.5 flex-1 min-w-0 text-left">
                                  <TeamShieldBadge name={m.awayTeam} isAngels={isOurTeamAway} />
                                  <span className={`text-sm truncate font-bold ${isOurTeamAway ? 'text-sky-700 font-black' : 'text-slate-900'}`}>
                                    {m.awayTeam}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Actions / Links / Chevron */}
                              <div className="shrink-0 flex items-center gap-2 pl-3">
                                {m.url && (
                                  <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition"
                                    title="Zobacz oficjalny mecz w VolleyStation"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 transition duration-200 ${
                                    isExpanded ? 'rotate-180 bg-sky-50 text-sky-600' : 'group-hover:text-slate-800'
                                  }`}
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>

                            {/* Mobile Match Card */}
                            <div
                              onClick={() => toggleMatch(m.id)}
                              className="sm:hidden flex flex-col gap-2 p-3.5 cursor-pointer select-none"
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                                  {m.round ? `Runda ${m.round}` : 'LALS'} • {m.matchNumber ? `Nr ${m.matchNumber}` : 'Oficjalny mecz'}
                                </span>
                                {m.isFinished && m.homeSetsWon !== undefined && m.awaySetsWon !== undefined ? (
                                  <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-xs tracking-wider">
                                    {m.homeSetsWon} : {m.awaySetsWon}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                                    {m.timeStr || '18:00'}
                                  </span>
                                )}
                              </div>

                              {/* Team Rows */}
                              <div className="space-y-1.5 pt-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <TeamShieldBadge name={m.homeTeam} isAngels={isOurTeamHome} />
                                    <span className={`text-xs truncate font-bold ${isOurTeamHome ? 'text-sky-700 font-black' : 'text-slate-900'}`}>
                                      {m.homeTeam}
                                    </span>
                                  </div>
                                  {m.isFinished && m.homeSetsWon !== undefined && (
                                    <span className="font-mono font-black text-slate-900 text-sm shrink-0">
                                      {m.homeSetsWon}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <TeamShieldBadge name={m.awayTeam} isAngels={isOurTeamAway} />
                                    <span className={`text-xs truncate font-bold ${isOurTeamAway ? 'text-sky-700 font-black' : 'text-slate-900'}`}>
                                      {m.awayTeam}
                                    </span>
                                  </div>
                                  {m.isFinished && m.awaySetsWon !== undefined && (
                                    <span className="font-mono font-black text-slate-900 text-sm shrink-0">
                                      {m.awaySetsWon}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details Accordion */}
                            {isExpanded && (
                              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 space-y-3.5 text-xs animate-fadeIn">
                                {m.sets && m.sets.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                                      Wyniki setów:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {m.sets.map(s => (
                                        <span
                                          key={s.setNumber}
                                          className="px-2.5 py-1 rounded-lg font-mono font-bold bg-white border border-slate-200 text-slate-800 shadow-sm"
                                        >
                                          Set {s.setNumber}: <strong>{s.teamScore}</strong>:<strong>{s.opponentScore}</strong>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {m.mvp && (
                                  <div className="text-xs text-amber-900 font-bold flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                                    <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>MVP meczu: <strong className="text-slate-900">{m.mvp}</strong></span>
                                  </div>
                                )}

                                {m.notes && (
                                  <div className="text-xs text-slate-600 p-2.5 rounded-xl bg-white border border-slate-200">
                                    <span className="text-[10px] font-black uppercase text-slate-600 block mb-1">Uwagi meczowe:</span>
                                    {m.notes}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                                  {m.url ? (
                                    <a
                                      href={m.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1.5"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                                      <span>Otwórz oficjalny protokół na VolleyStation ↗</span>
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-slate-600">Oficjalny terminarz rozgrywek ligowych LALS</span>
                                  )}

                                  {isAngels && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                      👼 Mecz z udziałem Angels ZTP
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SubTab 3: STATYSTYKI & VOLLEYSTATION */}
          {ligaSubTab === 'statystyki' && (
            <div className="space-y-6">
              {/* Header with Title and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sky-600" />
                    <span>Statystyki VolleyStation & Liderzy Ligi</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Oficjalne dane meczowe, protokoły punktowe i rankingi indywidualne z ligi LALS.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {canManageMatches && (
                    <button
                      type="button"
                      onClick={() => setShowVolleyStationImportModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>Importuj z VolleyStation</span>
                    </button>
                  )}

                  <a
                    href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-sky-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>Terminarz LALS (VolleyStation) ↗</span>
                  </a>
                </div>
              </div>

              {/* 4 Summary KPI Cards for Angels ZTP */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Mecze w LALS</span>
                    <Volleyball className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-athletic">
                    {leagueReports.length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Zaimportowane protokoły
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Lider Punktowy (ABS)</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 truncate font-athletic">
                    {leaderboards?.angelsScorers?.[0]?.name || 'Brak danych'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {leaderboards?.angelsScorers?.[0]
                      ? `${leaderboards.angelsScorers[0].totalPoints} pkt (${leaderboards.angelsScorers[0].matchesPlayed} mecze)`
                      : 'Zaimportuj protokoły'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Król Bloku (Blk)</span>
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 truncate font-athletic">
                    {leaderboards?.angelsBlockers?.[0]?.name || 'Brak danych'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {leaderboards?.angelsBlockers?.[0]
                      ? `${leaderboards.angelsBlockers[0].totalBlock} punktowych bloków`
                      : 'Brak danych'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">As Serwisowy (Ser)</span>
                    <Zap className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 truncate font-athletic">
                    {leaderboards?.angelsServers?.[0]?.name || 'Brak danych'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {leaderboards?.angelsServers?.[0]
                      ? `${leaderboards.angelsServers[0].totalServe} asów serwisowych`
                      : 'Brak danych'}
                  </div>
                </div>
              </div>

              {/* Leaderboards Section (Liderzy Ligi / Zespołu) */}
              {leaderboards && (
                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        Rankingi Indywidualne
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setLeaderboardScope('ANGELS')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition ${
                          leaderboardScope === 'ANGELS'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        👼 Tylko Angels ZTP
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeaderboardScope('LIGA')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition ${
                          leaderboardScope === 'LIGA'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🌐 Cała Liga LALS
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* 1. Najwięcej Punktów */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-amber-700 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-500" /> Punkty (ABS)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsScorers : leaderboards.topScorers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-amber-600 font-black' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-slate-900 truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-amber-700 shrink-0">{p.totalPoints} pkt</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Punkty z Ataku */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-sky-700 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-sky-600" /> Atak (Ata)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsAttackers : leaderboards.topAttackers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-sky-700 font-black' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-slate-900 truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-sky-700 shrink-0">{p.totalAttack} pkt</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Bloki Punktowe */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" /> Blok (Blk)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsBlockers : leaderboards.topBlockers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-emerald-700 font-black' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-slate-900 truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-emerald-700 shrink-0">{p.totalBlock} blk</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. Asy Serwisowe */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-rose-700 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-rose-500" /> Zagrywka (Ser)
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {((leaderboardScope === 'ANGELS' ? leaderboards.angelsServers : leaderboards.topServers) || []).slice(0, 5).map((p: any, idx: number) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 text-center font-bold font-mono ${idx === 0 ? 'text-rose-700 font-black' : 'text-slate-500'}`}>{idx + 1}.</span>
                              <span className="font-bold text-slate-900 truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-black text-rose-700 shrink-0">{p.totalServe} asów</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full VolleyStation Player Rankings Table (76 Zawodników) */}
              {playerRankings.length > 0 && (
                <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight font-athletic">
                          Oficjalny Ranking Punktowy Zawodników LALS
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Statystyki indywidualne VolleyStation • Wszystkie drużyny i zawodnicy ligi ({playerRankings.length} sklasyfikowanych)
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Przełącznik Wszyscy / Angels */}
                      <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                        <button
                          type="button"
                          onClick={() => setRankingFilterTeam('ALL')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition ${
                            rankingFilterTeam === 'ALL'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🌐 Cała Liga ({playerRankings.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRankingFilterTeam('ANGELS')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition ${
                            rankingFilterTeam === 'ANGELS'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          👼 Angels ZTP ({playerRankings.filter((p: any) => p.isAngels).length})
                        </button>
                      </div>

                      {/* Wyszukiwarka */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={rankingSearch}
                          onChange={e => setRankingSearch(e.target.value)}
                          placeholder="Szukaj gracza lub klubu..."
                          className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition w-44 sm:w-52"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabela Zawodników */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 text-center">#</th>
                          <th className="py-2.5 px-3">Zawodnik</th>
                          <th className="py-2.5 px-3">Pozycja</th>
                          <th className="py-2.5 px-3">Drużyna</th>
                          <th className="py-2.5 px-3 text-center font-black text-amber-700 bg-amber-50/60">Punkty (ABS)</th>
                          <th className="py-2.5 px-3 text-center text-sky-700">Atak (Ata)</th>
                          <th className="py-2.5 px-3 text-center text-emerald-700">Blok (Blk)</th>
                          <th className="py-2.5 px-3 text-center text-rose-700">Zagrywka (Ser)</th>
                          <th className="py-2.5 px-3 text-center text-slate-500">% Drużyny</th>
                          <th className="py-2.5 px-3 text-center text-slate-500">Wygr. / Rozegr.</th>
                          <th className="py-2.5 px-3 text-center text-slate-500">% Wygranych</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {playerRankings
                          .filter((p: any) => rankingFilterTeam === 'ALL' || p.isAngels)
                          .filter((p: any) => !rankingSearch.trim() || 
                            p.name.toLowerCase().includes(rankingSearch.toLowerCase()) ||
                            p.team.toLowerCase().includes(rankingSearch.toLowerCase()) ||
                            p.teamCode.toLowerCase().includes(rankingSearch.toLowerCase()) ||
                            p.position.toLowerCase().includes(rankingSearch.toLowerCase())
                          )
                          .map((p: any) => (
                            <tr
                              key={`${p.rank}_${p.name}`}
                              className={`transition hover:bg-slate-50/80 ${
                                p.isAngels ? 'bg-sky-50/50 font-medium' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                                {p.rank <= 3 ? (
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-black text-[11px] ${
                                    p.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-xs' :
                                    p.rank === 2 ? 'bg-slate-300 text-slate-900' :
                                    'bg-amber-700/20 text-amber-900'
                                  }`}>
                                    {p.rank}
                                  </span>
                                ) : (
                                  p.rank
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${p.isAngels ? 'text-sky-950 font-black' : 'text-slate-900'}`}>
                                    {p.name}
                                  </span>
                                  {p.isAngels && p.number && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-sky-100 text-sky-800 border border-sky-300">
                                      #{p.number}
                                    </span>
                                  )}
                                  {p.isAngels && (
                                    <span className="text-xs" title="Zawodnik Angels ZTP">👼</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 capitalize">
                                {p.position}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  p.isAngels
                                    ? 'bg-sky-100 text-sky-900 border border-sky-300 font-black'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {p.team}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-black text-amber-700 text-sm bg-amber-50/40">
                                {p.totalPoints}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-700">
                                {p.totalAttack}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                                {p.totalBlock}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                                {p.totalServe}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                {p.teamPointsPercent}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                {p.ralliesWon} / {p.ralliesPlayed}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-bold">
                                {p.ralliesWonPercent}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Match Reports List (Protokoły Meczowe) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Protokoły Meczowe VolleyStation ({leagueReports.length})</span>
                  </h4>
                </div>

                {leagueReports.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                    <BarChart3 className="w-12 h-12 text-slate-400 mx-auto" />
                    <h5 className="text-base font-bold text-slate-900">Brak zapisanych protokołów</h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Użyj przycisku &quot;Importuj z VolleyStation&quot; powyżej, aby wkleić statystyki lub terminarz skopiowany bezpośrednio ze strony ligi.
                    </p>
                    {canManageMatches && (
                      <button
                        type="button"
                        onClick={() => setShowVolleyStationImportModal(true)}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
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
                        className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden transition"
                      >
                        {/* Header Row */}
                        <div
                          onClick={() => toggleReport(rep.id)}
                          className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                              <Volleyball className="w-5 h-5 text-sky-600" />
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {(rep.round || rep.matchNumber) && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-sky-800 border border-slate-200">
                                    {rep.round ? `Runda ${rep.round}` : ''} {rep.matchNumber ? `Nr ${rep.matchNumber}` : ''}
                                  </span>
                                )}
                                <span className="text-[11px] font-mono text-slate-500">
                                  {new Date(rep.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {ourSets !== undefined && oppSets !== undefined && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isWin
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300'
                                  }`}>
                                    {isWin ? '✓ Wygrana' : '✗ Przegrana'}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-base font-black text-slate-900 truncate">
                                {rep.matchTitle}
                              </h4>
                            </div>
                          </div>

                          {/* Sets, Meta Badges & Actions */}
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Sets score breakdown */}
                            {rep.sets && rep.sets.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                                {rep.sets.map((s, idx) => (
                                  <span key={s.setNumber}>
                                    {idx > 0 && <span className="text-slate-400">, </span>}
                                    <span className={s.homeScore > s.awayScore ? 'text-sky-700 font-black' : 'text-slate-600'}>{s.homeScore}</span>
                                    :<span className={s.awayScore > s.homeScore ? 'text-sky-700 font-black' : 'text-slate-600'}>{s.awayScore}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {rep.duration && (
                              <span className="px-2 py-1 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-200 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-600" />
                                <span>{rep.duration}</span>
                              </span>
                            )}

                            {rep.mvp && (
                              <span className="px-2 py-1 rounded-xl bg-amber-50 text-[10px] font-bold text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>MVP: {rep.mvp.name}</span>
                              </span>
                            )}

                            {rep.volleyStationUrl && (
                              <a
                                href={rep.volleyStationUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-sky-700 border border-slate-200 transition"
                                title="Otwórz oficjalny protokół w VolleyStation"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {canManageMatches && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteReport(rep.id);
                                }}
                                className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
                                title="Usuń ten raport"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <div className="p-1 text-slate-500">
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Detailed Stats Tables */}
                        {isExpanded && (
                          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-6 animate-fadeIn">
                            {/* Meta Bar: Sędzia, Widzowie, Czas */}
                            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-200 gap-2">
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
                                        ? 'bg-sky-50 border-sky-300 shadow-sm'
                                        : 'bg-white border-slate-200 shadow-xs'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                      <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                        {isAngels && <span className="w-2 h-2 rounded-full bg-sky-600" />}
                                        {team.teamName}
                                      </h5>
                                      <span className="text-xs font-mono font-black text-amber-800">
                                        {team.totals?.points || 0} pkt
                                      </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[9px] tracking-wider">
                                          <tr>
                                            <th className="p-1.5 w-7 text-center">#</th>
                                            <th className="p-1.5">Zawodnik</th>
                                            <th className="p-1.5 text-center font-black text-amber-700">ABS</th>
                                            <th className="p-1.5 text-center">Ata</th>
                                            <th className="p-1.5 text-center">Blk</th>
                                            <th className="p-1.5 text-center">Ser</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40 font-mono">
                                          {(team.players || []).map(p => (
                                            <tr key={p.name} className="hover:bg-slate-50 transition">
                                              <td className="p-1.5 text-center text-sky-400 font-bold">{p.number}</td>
                                              <td className="p-1.5 font-sans font-bold text-slate-900 truncate max-w-[140px]">
                                                {p.name}
                                                {rep.mvp?.name && rep.mvp.name.toLowerCase() === p.name.toLowerCase() && (
                                                  <span className="ml-1 text-[9px] text-amber-400 font-black">⭐ MVP</span>
                                                )}
                                              </td>
                                              <td className="p-1.5 text-center font-black text-amber-400">{p.points}</td>
                                              <td className="p-1.5 text-center text-slate-600">{p.attack}</td>
                                              <td className="p-1.5 text-center text-slate-600">{p.block}</td>
                                              <td className="p-1.5 text-center text-slate-600">{p.serve}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        {team.totals && (
                                          <tfoot className="bg-slate-50 font-mono font-black text-slate-900 border-t border-slate-300">
                                            <tr>
                                              <td colSpan={2} className="p-2 font-sans font-black uppercase text-[10px] text-slate-500">
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
                                                  Błędy przeciwnika: <strong className="text-slate-600">{team.totals.opponentErrors}</strong>
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



      {/* 3. TAB: TURNIEJE */}
      {activeTab === 'turnieje' && (
        <div className="space-y-6">
          {/* Turniej Actions Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                Turnieje & Drabinki ({tournamentsList.length})
              </span>
            </div>

            {canManage && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 self-start sm:self-auto py-0.5">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition shadow-sm whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>Dodaj Wynik</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEventTypeToCreate('TURNIEJ');
                    setEventTitle('Turniej Siatkarski');
                    setShowAddEventModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm whitespace-nowrap shrink-0"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Utwórz Turniej</span>
                </button>
              </div>
            )}
          </div>

          {turniejSubTab === 'drabinki' && (
            <div className="space-y-6">

          <div className="space-y-6">
            {tournamentsList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500">
                Brak zaplanowanych turniejów.
              </div>
            ) : (
              paginatedTournaments.map(event => {
                const yesCount = event.attendees.filter(a => a.status === 'BEDE').length;
                const myAttendance = event.attendees.find(a => a.userId === user?.id);
                const isFinished = Boolean(event.result);
                const isExpanded = Boolean(expandedTournaments[event.id]);

                const matches = event.tournamentMatches || [];
                const totalMatches = matches.length;
                const finishedMatches = matches.filter(m => m.isFinished);
                const wins = finishedMatches.filter(m => (m.scoreA ?? 0) > (m.scoreB ?? 0)).length;
                const losses = finishedMatches.filter(m => (m.scoreA ?? 0) < (m.scoreB ?? 0)).length;
                const setsWon = finishedMatches.reduce((acc, m) => acc + (m.scoreA || 0), 0);
                const setsLost = finishedMatches.reduce((acc, m) => acc + (m.scoreB || 0), 0);

                const currentPhaseFilter = tournamentPhaseFilter[event.id] || 'ALL';
                const filteredMatches = currentPhaseFilter === 'ALL'
                  ? matches
                  : matches.filter(m => m.phase === currentPhaseFilter);

                const availablePhases = TOURNAMENT_PHASES.filter(ph => matches.some(m => m.phase === ph.id));

                // Obliczanie czy do turnieju przypisana jest taktyka
                const tournamentTactics = tactics.filter(
                  t => t.eventId === event.id ||
                       t.matchId === event.id ||
                       (t.scope === 'TURNIEJ' && t.eventId === event.id)
                );
                const hasTournamentTactic = tournamentTactics.length > 0;

                return (
                  <div
                    key={event.id}
                    className={`bg-white border ${
                      isExpanded ? 'border-purple-400 shadow-md' : 'border-slate-200 hover:border-purple-300 shadow-sm'
                    } border-l-[6px] border-l-purple-500 rounded-2xl overflow-hidden transition-all duration-200`}
                  >
                    {/* Zwijany Nagłówek Turnieju */}
                    <div
                      onClick={() => toggleTournament(event.id)}
                      className="p-4 sm:p-5 cursor-pointer flex flex-col gap-3.5 select-none hover:bg-purple-50/10 transition group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Lewa strona: Data Box + Tytuł + Szczegóły */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {/* Compact Date Box */}
                          <div className="w-fit sm:w-28 shrink-0 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center sm:flex-col sm:justify-center text-left sm:text-center gap-2 sm:gap-0.5 transition shadow-2xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                              {new Date(event.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-xs font-mono font-bold flex items-center gap-1 sm:justify-center text-purple-950">
                              <Calendar className="w-3 h-3 text-purple-600" />
                              {new Date(event.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Title and details */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                                🏆 TURNIEJ
                              </span>
                              {isFinished ? (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Rozegrany
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                  Zgłoszenia otwarte
                                </span>
                              )}
                              {totalMatches > 0 && (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {totalMatches} {totalMatches === 1 ? 'mecz' : totalMatches < 5 ? 'mecze' : 'meczów'}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-700 transition tracking-tight truncate">
                              {event.title}
                            </h3>

                            <div className="flex items-center gap-3 text-xs text-slate-500 truncate">
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </span>
                              {event.costPerPerson && (
                                <span className="text-slate-400">• 💰 {event.costPerPerson} zł / os.</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Prawa strona nagłówka turnieju: Wynik/Puchar, Taktyka, Terminarz, Obecność, Chevron */}
                        <div 
                          onClick={e => e.stopPropagation()} 
                          className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-slate-100 lg:border-t-0"
                        >
                          {event.result?.tournamentRank && (
                            <div className="text-right px-3.5 py-1 rounded-xl bg-purple-900 text-white shadow-xs">
                              <span className="text-sm font-black text-white block leading-tight">
                                {event.result.tournamentRank}
                              </span>
                              <span className="text-[9px] font-black text-purple-200 uppercase tracking-widest block">
                                Puchar / Miejsce
                              </span>
                            </div>
                          )}

                          {/* Przycisk Taktyki – podświetlony gdy jest taktyka, wyszarzony gdy jej brak */}
                          {hasTournamentTactic ? (
                            <Link
                              href={`/taktyka?eventId=${event.id}&type=TURNIEJ`}
                              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition"
                              title={`Założenia taktyczne turnieju (${tournamentTactics.length})`}
                            >
                              <Target className="w-4 h-4 text-sky-600" />
                              <span>Taktyka 🎯</span>
                            </Link>
                          ) : canManage ? (
                            <Link
                              href={`/taktyka?eventId=${event.id}&type=TURNIEJ`}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border border-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition opacity-60 hover:opacity-100"
                              title="Brak taktyki – kliknij, aby utworzyć założenia dla tego turnieju"
                            >
                              <Target className="w-4 h-4 text-slate-400" />
                              <span>Taktyka</span>
                            </Link>
                          ) : (
                            <div
                              className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 opacity-40 cursor-not-allowed select-none"
                              title="Brak taktyki dla tego turnieju"
                            >
                              <Target className="w-4 h-4 text-slate-400" />
                              <span>Taktyka</span>
                            </div>
                          )}

                          {/* Przycisk przejścia do Terminarza & Frekwencji */}
                          <Link
                            href="/events"
                            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition"
                            title="Otwórz w terminarzu zespołu"
                          >
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            <span className="hidden sm:inline">Terminarz</span>
                          </Link>

                          {/* Badge obecności */}
                          <span className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-purple-600" />
                            <span>{yesCount} chętnych</span>
                          </span>

                          {/* Chevron Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTournament(event.id);
                            }}
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                              isExpanded ? 'rotate-180 bg-purple-100 text-purple-900 border-purple-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
                            }`}
                            title={isExpanded ? 'Zwiń szczegóły' : 'Rozwiń szczegóły'}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rozwijana Zawartość Turnieju */}
                    {isExpanded && (
                      <div className="p-5 sm:p-7 border-t border-slate-200 space-y-6 animate-fadeIn bg-white">
                        {/* Pasek Podsumowania Turnieju */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-purple-800 uppercase block">Mecze Turnieju</span>
                            <span className="text-base font-black text-slate-900">
                              {finishedMatches.length} / {totalMatches} <span className="text-xs font-normal text-slate-500">rozegranych</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-purple-800 uppercase block">Bilans Spotkań</span>
                            <span className="text-base font-black text-slate-900">
                              <span className="text-emerald-700">{wins}W</span> - <span className="text-rose-700">{losses}P</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-purple-800 uppercase block">Bilans Setów</span>
                            <span className="text-base font-black text-slate-900 font-mono">
                              {setsWon} : {setsLost}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-purple-800 uppercase block">Puchar / Osiągnięcie</span>
                            <span className="text-xs font-black text-purple-950 truncate block mt-0.5">
                              {event.result?.tournamentRank || 'W trakcie / Do ustalenia'}
                            </span>
                          </div>
                        </div>

                        {/* Pasek Narzędzi Zarządzania Sztabu */}
                        {canManage && (
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
                            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                              Panel Sztabu Turnieju:
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleOpenAddMatch(event)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                + Dodaj Mecz Turnieju
                              </button>
                              <button
                                onClick={() => setShowTournamentRankModal(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1"
                              >
                                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                                <span>Ustaw Miejsce Końcowe</span>
                              </button>
                              <button
                                onClick={() => openResultModal(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                              >
                                Pełny Protokół Wyniku
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 shadow-xs"
                                title="Usuń ten turniej"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Usuń Turniej</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 1: Ankieta zgłoszeń na turniej */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <span className="text-xs font-black uppercase text-slate-900 tracking-wider block">
                                1. Deklaracja udziału ({yesCount} chętnych zawodników)
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Dyspozycyjność składu Angels ZTP na cały turniej
                              </span>
                            </div>
                            {user && (
                              user.role === 'TRENER' ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold">
                                  <Flame className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Sztab trenerski (Prowadzący turniej)</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAttendance(event.id, 'BEDE')}
                                    className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                                      myAttendance?.status === 'BEDE'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    ✓ Jadę na turniej
                                  </button>
                                  <button
                                    onClick={() => handleAttendance(event.id, 'NIE_BEDE')}
                                    className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                                      myAttendance?.status === 'NIE_BEDE'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    ✕ Nie jadę
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Step 2: Harmonogram & Mecze Turnieju (Faza grupowa, 1/8, 1/4, 1/2, Finał) */}
                        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                  2. Mecze Turnieju & Drabinka ({totalMatches})
                                </span>
                                {finishedMatches.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                    Bilans: {wins}W - {losses}P ({setsWon}:{setsLost} sety)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Faza grupowa, ćwierćfinały (1/4), półfinały (1/2), mecz o 3. miejsce oraz finał
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {canManage && (
                                <button
                                  onClick={() => handleOpenAddMatch(event)}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Dodaj mecz turnieju</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Filtry Faz (Wszystkie, Faza grupowa, 1/4, 1/2, Finał) */}
                          {totalMatches > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                onClick={() => setTournamentPhaseFilter(prev => ({ ...prev, [event.id]: 'ALL' }))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                  currentPhaseFilter === 'ALL'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                Wszystkie ({totalMatches})
                              </button>
                              {availablePhases.map(ph => {
                                const count = matches.filter(m => m.phase === ph.id).length;
                                if (count === 0) return null;
                                return (
                                  <button
                                    key={ph.id}
                                    onClick={() => setTournamentPhaseFilter(prev => ({ ...prev, [event.id]: ph.id }))}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                      currentPhaseFilter === ph.id
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{ph.icon}</span>
                                    <span>{ph.label}</span>
                                    <span className="opacity-75 font-mono text-[10px]">({count})</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Lista Kafelków Meczowych */}
                          {filteredMatches.length === 0 ? (
                            <div className="py-8 px-4 rounded-2xl bg-white border border-slate-200 text-center">
                              <Trophy className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-700">
                                Brak wprowadzonych spotkań {currentPhaseFilter !== 'ALL' ? 'w tej fazie' : 'w tym turnieju'}.
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Sztab może wprowadzić harmonogram meczów grupowych oraz fazy pucharowej.
                              </p>
                              {canManage && (
                                <button
                                  onClick={() => handleOpenAddMatch(event)}
                                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Wprowadź pierwszy mecz turnieju</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {filteredMatches.map(match => {
                                const isWin = match.isFinished && (match.scoreA ?? 0) > (match.scoreB ?? 0);
                                const isLoss = match.isFinished && (match.scoreA ?? 0) < (match.scoreB ?? 0);

                                return (
                                  <div
                                    key={match.id}
                                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-sm transition space-y-3"
                                  >
                                    {/* Header meczu */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {getPhaseBadge(match.phase)}
                                        <span className="text-xs font-black text-slate-700">{match.round}</span>
                                      </div>

                                      {match.isFinished ? (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                          isWin
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : 'bg-rose-50 text-rose-800 border-rose-300'
                                        }`}>
                                          {isWin ? '✓ Zwycięstwo' : 'Porażka'}
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200">
                                          Zaplanowany
                                        </span>
                                      )}
                                    </div>

                                    {/* Drużyny i Wynik */}
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs font-black ${isWin ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {match.teamA}
                                          </span>
                                          {match.teamA.includes('Angels') && (
                                            <span className="text-[9px] px-1 rounded bg-sky-100 text-sky-800 font-bold border border-sky-200">
                                              MY
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs font-bold text-slate-600">
                                          {match.teamB}
                                        </div>
                                      </div>

                                      {/* Wynik w setach */}
                                      <div className="text-right">
                                        {match.isFinished ? (
                                          <div>
                                            <span className="font-mono text-lg font-black text-slate-900 tracking-wider">
                                              {match.scoreA ?? 0} : {match.scoreB ?? 0}
                                            </span>
                                            {match.setScores && (
                                              <div className="text-[10px] font-mono text-slate-500">
                                                ({match.setScores})
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-xs font-bold text-slate-400">vs</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Informacje dodatkowe / time / notatki */}
                                    {(match.time || match.notes) && (
                                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        {match.time && (
                                          <span className="flex items-center gap-1 text-slate-600">
                                            <Clock className="w-3 h-3 text-purple-500" />
                                            <span>{match.time}</span>
                                          </span>
                                        )}
                                        {match.notes && (
                                          <span className="italic truncate max-w-[200px]" title={match.notes}>
                                            💬 {match.notes}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Narzędzia sztabu */}
                                    {canManage && (
                                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleOpenEditMatch(event, match)}
                                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span>Edytuj</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTournamentMatch(event, match.id)}
                                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                                          title="Usuń mecz z turnieju"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Step 3: Wynik turnieju & Puchar */}
                        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-purple-900 tracking-wider block">
                              3. Wynik Turnieju & Miejsce Końcowe
                            </span>
                            {canManage && (
                              <button
                                onClick={() => setShowTournamentRankModal(event)}
                                className="text-xs font-bold text-purple-700 hover:text-purple-900 underline"
                              >
                                {event.result?.tournamentRank ? 'Zmień miejsce' : '+ Wpisz miejsce końcowe'}
                              </button>
                            )}
                          </div>
                          <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <span>🏆</span>
                            <span>{event.result?.tournamentRank || 'W trakcie / Brak wpisanego miejsca'}</span>
                          </div>
                          {event.result?.notes && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-purple-100">
                              {event.result.notes}
                            </p>
                          )}
                        </div>

                        {/* Auto-Linked Tactical Snapshots to Tournament */}
                        {(() => {
                          const linked = tactics.filter(t => t.eventId === event.id);
                          if (linked.length === 0) return null;
                          return (
                            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-sky-800 flex items-center gap-1.5">
                                  <Compass className="w-3.5 h-3.5 text-sky-600" />
                                  <span>📸 Zrzut Taktyczny na Turniej: {linked[0].title}</span>
                                </span>
                                <a href={`/taktyka?eventId=${event.id}&tacticId=${linked[0].id}`} className="text-xs text-sky-700 font-bold hover:underline">
                                  Otwórz w Tablicy →
                                </a>
                              </div>
                              {linked[0].drawingData && (
                                <div className="aspect-[21/9] bg-white rounded-xl overflow-hidden border border-slate-200 max-h-36">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-lg">
              <span className="text-xs text-slate-500 font-medium">
                Wyświetlanie <span className="text-slate-900 font-bold">{((tournamentsPage - 1) * TOURNAMENTS_PER_PAGE) + 1}</span>–<span className="text-slate-900 font-bold">{Math.min(tournamentsPage * TOURNAMENTS_PER_PAGE, tournamentsList.length)}</span> z <span className="text-slate-900 font-bold">{tournamentsList.length}</span> turniejów
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTournamentsPage(p => Math.max(1, p - 1))}
                  disabled={tournamentsPage === 1}
                  className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                          : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setTournamentsPage(p => Math.min(totalTournamentsPages, p + 1))}
                  disabled={tournamentsPage === totalTournamentsPages}
                  className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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



      {/* Modal: Wprowadzanie / Edycja Wyniku */}
      {resultModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Wynik Spotkania: {resultModalEvent.title}
              </h3>
              <button onClick={() => setResultModalEvent(null)} className="text-slate-400 hover:text-slate-700 font-black">✕</button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4">
              {/* Szybki wybór meczu sparingowego jeśli jest ich więcej */}
              {resultModalEvent.type === 'SPARING' && sparringsList.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Wybierz sparing do edycji:
                  </label>
                  <select
                    value={resultModalEvent.id}
                    onChange={(e) => {
                      const found = sparringsList.find(s => s.id === e.target.value);
                      if (found) openResultModal(found);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                  >
                    {sparringsList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.opponent ? `vs ${s.opponent}` : s.title} ({new Date(s.date).toLocaleDateString('pl-PL')}) {s.result ? `[${s.result.teamSetsWon}:${s.result.opponentSetsWon}]` : '[Oczekuje na wynik]'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Informacyjny banner */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Wpisz końcowy rezultat sparingu (sety oraz małe punkty). Dane zaktualizują się w terminarzu i statystykach.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sety Angels ZTP</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={resTeamSets}
                    onChange={e => setResTeamSets(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-xl font-mono font-black text-emerald-600 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sety Rywala</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={resOppSets}
                    onChange={e => setResOppSets(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-xl font-mono font-black text-rose-600 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Set by set inputs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Małe punkty w setach:</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum = resSetsList.length + 1;
                        setResSetsList([...resSetsList, { setNumber: nextNum, teamScore: 25, opponentScore: 20 }]);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-[11px] font-bold transition"
                    >
                      + Dodaj set
                    </button>
                    {resSetsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setResSetsList(resSetsList.slice(0, -1))}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold transition"
                      >
                        - Usuń set
                      </button>
                    )}
                  </div>
                </div>
                {resSetsList.map((set, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-14 font-bold text-slate-600">Set {idx + 1}:</span>
                    <input
                      type="number"
                      value={set.teamScore}
                      onChange={e => {
                        const copy = [...resSetsList];
                        copy[idx].teamScore = Number(e.target.value);
                        setResSetsList(copy);
                      }}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="number"
                      value={set.opponentScore}
                      onChange={e => {
                        const copy = [...resSetsList];
                        copy[idx].opponentScore = Number(e.target.value);
                        setResSetsList(copy);
                      }}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">MVP Meczu</label>
                <select
                  value={resMvp}
                  onChange={e => setResMvp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Miejsce końcowe w turnieju</label>
                  <input
                    type="text"
                    value={resTournamentRank}
                    onChange={e => setResTournamentRank(e.target.value)}
                    placeholder="np. 1. miejsce (Złoty puchar)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notatki trenera / wnioski</label>
                <textarea
                  rows={2}
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)}
                  placeholder="Kluczowe zagrania, elementy do poprawy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResultModalEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingResult}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
                >
                  {submittingResult ? 'Zapisywanie...' : 'Zapisz Wynik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal: Dodaj Wydarzenie (Sparing / Turniej) */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  eventTypeToCreate === 'SPARING' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {eventTypeToCreate === 'SPARING' ? <Swords className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    {eventTypeToCreate === 'SPARING' ? 'Nowy Sparing Kontrolny' : 'Nowy Turniej Siatkarski'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {eventTypeToCreate === 'SPARING' ? 'Mecz towarzyski zespołu Angels ZTP' : 'Wprowadź dane turnieju'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-700 font-black">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              {eventTypeToCreate === 'SPARING' ? (
                <>
                  {/* Przeciwnik */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Przeciwnik (drużyna rywali) *</label>
                    <input
                      type="text"
                      required
                      placeholder="np. KS Siatkarz, Trefl II, Volley Team"
                      value={eventOpponent}
                      onChange={e => {
                        const val = e.target.value;
                        setEventOpponent(val);
                        setEventTitle(val ? `Sparing vs ${val}` : 'Sparing kontrolny');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  {/* Data & Miejsce */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Data i godzina *</label>
                      <input
                        type="datetime-local"
                        required
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Miejsce / Hala *</label>
                      <input
                        type="text"
                        required
                        value={eventLocation}
                        onChange={e => setEventLocation(e.target.value)}
                        placeholder="Hala Sportowa OSiR, ul. Sportowa 5"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Szybkie wpisanie wyniku jeśli sparing już rozegrany */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={eventIncludeResult}
                        onChange={e => setEventIncludeResult(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Sparing już rozegrany – wpisz wynik od razu (sety)
                      </span>
                    </label>
                    {eventIncludeResult && (
                      <div className="pt-2 border-t border-amber-200/60 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Sety Angels ZTP</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={eventResultSetsTeam}
                            onChange={e => setEventResultSetsTeam(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-center text-lg font-mono font-black text-emerald-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Sety Rywala</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={eventResultSetsOpp}
                            onChange={e => setEventResultSetsOpp(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-center text-lg font-mono font-black text-rose-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informacje dodatkowe */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Informacje dodatkowe / zbiórka (opcjonalne)</label>
                    <textarea
                      rows={2}
                      value={eventDescription}
                      onChange={e => setEventDescription(e.target.value)}
                      placeholder="Godzina zbiórki, stroje, rozgrzewka..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nazwa turnieju *</label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      placeholder="np. Puchar Burmistrza Lubonia"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Zaproszone zespoły</label>
                    <input
                      type="text"
                      placeholder="np. Angels ZTP, KS Poznań, Volley Team..."
                      value={eventOpponent}
                      onChange={e => setEventOpponent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Data rozpoczęcia *</label>
                      <input
                        type="datetime-local"
                        required
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Miejsce / Hala *</label>
                      <input
                        type="text"
                        required
                        value={eventLocation}
                        onChange={e => setEventLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Opis / Zasady turnieju</label>
                    <textarea
                      rows={2}
                      value={eventDescription}
                      onChange={e => setEventDescription(e.target.value)}
                      placeholder="System rozgrywek, harmonogram, nagrody..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 transition shadow-sm ${
                    eventTypeToCreate === 'SPARING'
                      ? 'bg-amber-500 hover:bg-amber-400'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {submittingEvent ? 'Tworzenie...' : eventTypeToCreate === 'SPARING' ? 'Utwórz Sparing' : 'Utwórz Turniej'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal: Dodaj Serię Zdjęć do Galerii */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black uppercase text-slate-900">
                  Dodaj Serię Zdjęć / Fotorelację
                </h3>
              </div>
              <button onClick={() => setShowAddPhotoModal(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-4">
              {/* Wybór kategorii dopasowany do aktywnej zakładki */}
              {activeTab === 'liga' ? (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-600" />
                    <span className="font-bold text-slate-900">Galeria Ligowa LALS</span>
                    <span className="text-slate-500 text-[11px] hidden sm:inline">(Zdjęcia trafią wyłącznie do sekcji ligowej)</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-800 font-bold px-2.5 py-0.5 rounded-lg bg-sky-100 border border-sky-300">
                    MECZ LIGOWY
                  </span>
                </div>
              ) : activeTab === 'sparingi' ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-slate-900">Fotorelacje ze Sparingów</span>
                    <span className="text-slate-500 text-[11px] hidden sm:inline">(Zdjęcia trafią wyłącznie do sekcji sparingowej)</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-900 font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 border border-amber-300">
                    SPARING
                  </span>
                </div>
              ) : activeTab === 'turnieje' ? (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span className="font-bold text-slate-900">Fotorelacje Turniejowe</span>
                    <span className="text-slate-500 text-[11px] hidden sm:inline">(Zdjęcia trafią wyłącznie do sekcji turniejowej)</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-900 font-bold px-2.5 py-0.5 rounded-lg bg-purple-100 border border-purple-300">
                    TURNIEJ
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Typ Wydarzenia *</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('MECZ')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'MECZ'
                          ? 'bg-sky-100 text-sky-900 border-sky-400 font-black shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Mecz LALS
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('SPARING')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'SPARING'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-black shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Sparing
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('TURNIEJ')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'TURNIEJ'
                          ? 'bg-purple-100 text-purple-900 border-purple-400 font-black shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Turniej
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoCategory('INNE')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                        photoCategory === 'INNE'
                          ? 'bg-slate-800 text-white border-slate-900 font-black shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Inne
                    </button>
                  </div>
                </div>
              )}

              {/* Szybkie powiązanie z konkretnym meczem lub wydarzeniem */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Powiąż z konkretnym meczem / wydarzeniem</label>
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
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-400"
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

              {/* Wybór wielu zdjęć (seria) & Drag and Drop */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Wybierz lub przeciągnij zdjęcia (Drag & Drop) *</span>
                  </label>
                  {photoSeriesList.length > 0 && (
                    <span className="text-[11px] font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Gotowe do wgrania: {photoSeriesList.length} {photoSeriesList.length === 1 ? 'zdjęcie' : photoSeriesList.length < 5 ? 'zdjęcia' : 'zdjęć'}
                    </span>
                  )}
                </div>
                
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(true);
                  }}
                  onDragEnter={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(true);
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(false);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processPhotoFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed transition duration-200 cursor-pointer text-center mb-2.5 ${
                    isDraggingPhotos
                      ? 'border-amber-500 bg-amber-50/90 text-amber-950 scale-[1.01] shadow-md ring-4 ring-amber-200'
                      : 'border-slate-300 hover:border-amber-500 bg-slate-50/70 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="modal-photos-multi-upload"
                    className="hidden"
                    onChange={handleMultiplePhotosUpload}
                  />
                  <label htmlFor="modal-photos-multi-upload" className="cursor-pointer w-full flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition ${
                      isDraggingPhotos ? 'bg-amber-500 text-slate-950 scale-110 shadow-md' : 'bg-white border border-slate-200 text-amber-600 shadow-2xs'
                    }`}>
                      <Upload className="w-6 h-6 stroke-[2.5]" />
                    </div>

                    <span className="text-sm font-black text-slate-900 block">
                      {isDraggingPhotos 
                        ? '👉 Upuść zdjęcia tutaj teraz!' 
                        : 'Przeciągnij tutaj kilkanaście zdjęć naraz (Drag & Drop)'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      lub kliknij, aby zaznaczyć serię plików z telefonu / komputera (JPG, PNG, WebP)
                    </span>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ⚡ Obsługa wielu zdjęć naraz
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                        🔍 Automatyczna optymalizacja wagi
                      </span>
                    </div>
                  </label>

                  {processingPhotos && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center z-10 space-y-2 p-4 shadow-inner">
                      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-black text-slate-900 font-mono">
                        Wczytywanie i optymalizacja {processingCount} zdjęć...
                      </span>
                      <span className="text-[10px] text-slate-500">Kompresujemy zdjęcia w locie, aby nie obciążały telefonu</span>
                    </div>
                  )}
                </div>

                {/* Podgląd miniatur wczytanej serii */}
                {photoSeriesList.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 mb-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Miniatury wczytanej serii ({photoSeriesList.length} szt.):
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhotoSeriesList([])}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 transition underline underline-offset-2"
                      >
                        Wyczyść wszystkie
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                      {photoSeriesList.map((item, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-300 bg-white shadow-2xs">
                          <img src={item.url} alt={`Podgląd ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSeries(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center opacity-85 hover:opacity-100 transition shadow"
                            title="Usuń to zdjęcie z serii"
                          >
                            ✕
                          </button>
                          <span className="absolute bottom-1 left-1 text-[9px] font-mono font-bold text-white bg-slate-950/70 px-1 py-0.2 rounded">
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
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              {/* Tytuł serii / meczu */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tytuł serii / wydarzenia *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Mecz ligowy LALS vs KS Metro Poznań - sety 1-4"
                  value={photoSeriesTitle || photoTitle}
                  onChange={e => {
                    setPhotoSeriesTitle(e.target.value);
                    setPhotoTitle(e.target.value);
                  }}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mecz / Rywal (opcjonalnie)</label>
                <input
                  type="text"
                  placeholder="np. Angels ZTP vs KS Metro Poznań"
                  value={photoMatch}
                  onChange={e => setPhotoMatch(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Opis / Notatka do serii</label>
                <input
                  type="text"
                  placeholder="Krótki opis akcji, fotografa lub momentu meczu..."
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900"
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



      {/* MODAL 1: Eksport Powiadomienia na Czat (WhatsApp / Messenger / Discord) */}
      {shareModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black uppercase text-slate-900">Eksport Raportu na Czat</h3>
              </div>
              <button onClick={() => setShareModalEvent(null)} className="text-slate-500 hover:text-slate-900 font-black">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Gotowy, sformatowany komunikat do wysłania na grupę drużyny (WhatsApp, Messenger, Discord, SMS):
            </p>

            <textarea
              readOnly
              rows={11}
              value={generateChatAnnouncementText(shareModalEvent)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 font-mono leading-relaxed select-all focus:outline-none focus:border-emerald-500"
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
                      : 'bg-slate-100 hover:bg-slate-100 text-emerald-300 border border-emerald-200'
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



      {/* MODAL 2: Automatyczny Generator Wyjściowej Szóstki */}
      {lineupModalEvent && generatedLineup && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black uppercase text-slate-900">Generator Wyjściowej Szóstki</h3>
              </div>
              <button onClick={() => setLineupModalEvent(null)} className="text-slate-500 hover:text-slate-900 font-black">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              System automatycznie przypisał optymalną szóstkę na podstawie graczy, którzy potwierdzili obecność (1xR, 1xA, 2xP, 2xŚ, 1xL):
            </p>

            {/* Warnings if missing positions */}
            {generatedLineup.missingWarnings && generatedLineup.missingWarnings.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Uwagi do składu:</span>
                </div>
                {generatedLineup.missingWarnings.map((w: string, i: number) => (
                  <p key={i} className="text-[11px] text-amber-800 font-medium pl-5">• {w}</p>
                ))}
              </div>
            )}

            {/* Starting Lineup Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-sky-400 font-black uppercase block">Rozgrywający (R)</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{generatedLineup.setter}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-rose-400 font-black uppercase block">Atakujący (A)</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{generatedLineup.opposite}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-emerald-400 font-black uppercase block">Przyjmujący (P1, P2)</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{generatedLineup.outsideHitters.join(' oraz ')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-purple-400 font-black uppercase block">Środkowi Bloku (Ś1, Ś2)</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{generatedLineup.middleBlockers.join(' oraz ')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[10px] text-amber-400 font-black uppercase block">Libero (L)</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{generatedLineup.libero}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[10px] text-slate-500 font-black uppercase block">Ławka Rezerwowych ({generatedLineup.reserves.length})</span>
                <span className="text-xs text-slate-600 mt-0.5 block">{generatedLineup.reserves.join(', ') || 'Brak rezerwowych'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setLineupModalEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900"
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



      {/* MODAL 3: Live Scorekeeper na Telefon */}
      {liveModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-900">Live Scorekeeper</h3>
                  <span className="text-[10px] text-slate-500">Wynik na żywo: {liveModalEvent.opponent || 'Mecz'}</span>
                </div>
              </div>
              <button onClick={() => setLiveModalEvent(null)} className="text-slate-500 hover:text-slate-900 font-black text-lg">✕</button>
            </div>

            {/* Set info & Set score indicator */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Aktualny Set:</span>
                <span className="text-base font-black text-amber-400">SET {liveCurrentSet}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Stan Setów:</span>
                <span className="text-base font-black text-slate-900 font-mono">{liveSetsWonTeam} : {liveSetsWonOpp}</span>
              </div>
              <button
                onClick={() => setIsServingTeam(!isServingTeam)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition flex items-center gap-1.5 ${
                  isServingTeam ? 'bg-sky-500/20 text-sky-300 border-sky-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                <span>🏐 Serwis: {isServingTeam ? 'Angels ZTP' : 'Rywal'}</span>
              </button>
            </div>

            {/* Previous sets chips */}
            {liveFinishedSets.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {liveFinishedSets.map(s => (
                  <span key={s.setNumber} className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-slate-600">
                    S{s.setNumber}: {s.teamScore}-{s.opponentScore}
                  </span>
                ))}
              </div>
            )}

            {/* Main Scoreboard: Big Touch Buttons */}
            <div className="grid grid-cols-2 gap-4 select-none">
              {/* Angels ZTP Column */}
              <div className="bg-slate-50 border border-sky-200 rounded-3xl p-4 sm:p-5 text-center space-y-3 shadow-inner">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 block truncate">
                  Angels ZTP
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono text-slate-900 py-1">
                  {liveTeamScore}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleScoreChange(-1, 0)}
                    className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-100 border border-slate-200 text-slate-500 font-black text-base"
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
              <div className="bg-slate-50 border border-rose-200 rounded-3xl p-4 sm:p-5 text-center space-y-3 shadow-inner">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400 block truncate">
                  {liveModalEvent.opponent || 'Rywal'}
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono text-slate-900 py-1">
                  {liveOppScore}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleScoreChange(0, -1)}
                    className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-100 border border-slate-200 text-slate-500 font-black text-base"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleScoreChange(0, 1)}
                    className="py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-slate-900 font-black text-lg shadow-lg shadow-rose-500/20"
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
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-900 transition text-center"
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
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 text-[11px]">Nie chcesz klikać punkt po punkcie?</span>
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



      {/* MODAL 4: Social Media Post Generator */}
      {socialModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black uppercase text-slate-900">Generator Posta na Social Media</h3>
              </div>
              <button onClick={() => setSocialModalEvent(null)} className="text-slate-500 hover:text-slate-900 font-black">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Uzupełnij szczegóły i skopiuj gotowy, widowiskowy post na Instagram, Facebook lub stronę klubu:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Akcja Meczu (Highlights)</label>
                <input
                  type="text"
                  placeholder="np. Pojedynczy blok Bartka na środku w końcówce 3. seta!"
                  value={socialBestAction}
                  onChange={e => setSocialBestAction(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Komentarz Trenera / Sztabu</label>
                <input
                  type="text"
                  placeholder="np. Znakomite przyjęcie i pełna realizacja taktyki."
                  value={socialNotes}
                  onChange={e => setSocialNotes(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Podgląd posta:</label>
                <textarea
                  readOnly
                  rows={9}
                  value={generateSocialPostText(socialModalEvent)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 font-mono leading-relaxed select-all focus:outline-none"
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
                  copiedSocialText ? 'bg-purple-500 text-slate-900 shadow-md' : 'bg-purple-600 hover:bg-purple-500 text-slate-900'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSocialText ? 'Skopiowano!' : 'Kopiuj Post na IG/FB'}</span>
              </button>
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
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer select-none"
          >
            <div className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhotoPreview(null)}
                className="absolute top-2 right-2 sm:-top-10 sm:right-0 w-9 h-9 rounded-full bg-white/15 hover:bg-rose-600 text-white flex items-center justify-center border border-white/30 transition z-20 shadow-lg text-sm"
                title="Zamknij podgląd"
              >
                ✕
              </button>

              {/* Prev Navigation Arrow */}
              {hasPrev && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center border border-white/30 transition z-20 shadow-lg"
                  title="Poprzednie zdjęcie w serii"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Navigation Arrow */}
              {hasNext && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center border border-white/30 transition z-20 shadow-lg"
                  title="Następne zdjęcie w serii"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Photo Display */}
              <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-black max-h-[75vh] flex items-center justify-center shadow-2xl">
                <img
                  src={selectedPhotoPreview.url}
                  alt={selectedPhotoPreview.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>

              {/* Bottom Info Bar */}
              <div className="mt-3.5 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/20 backdrop-blur-md shadow-2xl text-white">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/30">
                      {selectedPhotoPreview.matchName || (selectedPhotoPreview.category === 'TURNIEJ' ? 'Turniej' : selectedPhotoPreview.category === 'SPARING' ? 'Sparing' : 'Mecz LALS')}
                    </span>
                    {selectedPhotoPreview.seriesTitle && (
                      <span className="text-[10px] text-slate-300 font-bold">
                        • {selectedPhotoPreview.seriesTitle}
                      </span>
                    )}
                    {activeIdx >= 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
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
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-bold text-white hover:text-amber-300 transition flex items-center gap-1.5 shadow"
                    title="Pobierz pełny plik zdjęcia"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Pobierz</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL IMPORTU TERMINARZA & WYNIKÓW (TEKST / ZDJĘCIE OCR) */}
      {showImportScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-100 border border-slate-300 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-200 flex items-center justify-center text-sky-400 shrink-0">
                  <Calendar className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    Import Terminarza & Wyników LALS
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-200">
                      Tekst / Zdjęcie OCR
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Wgraj zdjęcie terminarza ze strony LALS lub wklej tekst, a system rozpozna daty, mecze i sety.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportScheduleModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zakładki Tekst vs Zdjęcie */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setScheduleImportTab('text')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                    scheduleImportTab === 'text'
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Wklej Tekst</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleImportTab('image')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                    scheduleImportTab === 'image'
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Wgraj Zdjęcie / Screen (OCR)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const example = `14.11.2026 19:30 Angels ZTP vs Gladiatorzy BUD-WENT 3:1 (25:21, 23:25, 25:18, 25:20)\n21.11.2026 18:00 Angels ZTP vs Volleyboars\n28.11.2026 20:00 Afera Volley vs Angels ZTP`;
                  setRawScheduleInput(example);
                  handleParseScheduleText(example);
                }}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold underline"
              >
                + Wstaw przykład
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {scheduleImportTab === 'text' ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Wklej linie terminarza lub wyników (jedna linia na mecz):
                  </p>
                  <textarea
                    rows={6}
                    value={rawScheduleInput}
                    onChange={e => {
                      setRawScheduleInput(e.target.value);
                      handleParseScheduleText(e.target.value);
                    }}
                    placeholder={`Obsługuje bezpośrednie wklejenie z VolleyStation, np.:
15 listopada 2026, Niedziela
[Runda: 11Nr 1972AAngels ZTP6:30 po południuCCoco Jumbo](https://...)
(lub tradycyjnie: 15.11.2026 18:30 Angels ZTP vs Coco Jumbo)`}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-xs font-mono text-slate-700 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleParseScheduleText(rawScheduleInput)}
                      className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition"
                    >
                      Przetwórz tekst
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Wybierz zdjęcie, zrzut ekranu lub zdjęcie telefonu z terminarzem LALS:
                  </p>
                  <label className="cursor-pointer p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-sky-500 transition flex flex-col items-center justify-center gap-2 group">
                    <Camera className="w-8 h-8 text-slate-500 group-hover:text-sky-400 transition" />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">
                      Kliknij, aby wybrać plik zdjęcia lub zrzut ekranu
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Obsługiwane formaty: PNG, JPG, WEBP • Polski słownik OCR
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleScheduleImageOcr(file);
                      }}
                    />
                  </label>

                  {scheduleOcrLoading && (
                    <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-sky-800 font-bold">
                        <span>{scheduleOcrStatus || 'Rozpoznawanie tekstu ze zdjęcia...'}</span>
                        <span className="font-mono">{scheduleOcrProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(5, scheduleOcrProgress)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {rawScheduleInput && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-bold text-slate-500">
                        Rozpoznany tekst z OCR (możesz edytować przed zatwierdzeniem):
                      </span>
                      <textarea
                        rows={4}
                        value={rawScheduleInput}
                        onChange={e => {
                          setRawScheduleInput(e.target.value);
                          handleParseScheduleText(e.target.value);
                        }}
                        className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Podgląd rozpoznanych meczów */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Podgląd rozpoznanych jednostek (Łącznie: {parsedMatchesToImport.length + parsedFixturesToImport.length}):
                </h4>

                {parsedMatchesToImport.length === 0 && parsedFixturesToImport.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Wklej tekst lub wgraj zdjęcie, aby zobaczyć rozpoznane spotkania.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Rozegrane mecze */}
                    {parsedMatchesToImport.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Rozegrane mecze z wynikiem ({parsedMatchesToImport.length}):
                        </span>
                        <div className="space-y-1.5">
                          {parsedMatchesToImport.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">
                                  {m.title || (m.isHome ? 'Angels ZTP' : m.opponent) + ' vs ' + (m.isHome ? m.opponent : 'Angels ZTP')}
                                </span>
                                <span className="text-slate-500 block text-[11px]">
                                  {m.date.replace('T', ' ')} • {m.sets?.map((s: any) => `${s.teamScore}:${s.opponentScore}`).join(', ')}
                                </span>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs font-mono shadow-xs">
                                {m.teamSetsWon}:{m.opponentSetsWon}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Przyszłe mecze terminarza */}
                    {parsedFixturesToImport.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-black uppercase text-sky-800 tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          Przyszłe mecze do terminarza ({parsedFixturesToImport.length}):
                        </span>
                        <div className="space-y-1.5">
                          {parsedFixturesToImport.map((f, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{f.title}</span>
                                <span className="text-slate-500 block text-[11px]">
                                  {f.date.replace('T', ' ')} • {f.location}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                Terminarz
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stopka */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Gotowe do zapisu: <strong className="text-slate-900">{parsedMatchesToImport.length + parsedFixturesToImport.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowImportScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-600 transition"
                  disabled={submittingScheduleImport}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveImportedSchedule}
                  disabled={submittingScheduleImport || (parsedMatchesToImport.length === 0 && parsedFixturesToImport.length === 0)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-sky-500/20"
                >
                  {submittingScheduleImport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Zapisywanie meczów...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Zapisz do Terminarza & Wyników</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORTU Z VOLLEYSTATION */}
      {showVolleyStationImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-100 border border-slate-300 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek modalu */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-200 flex items-center justify-center text-sky-400 shrink-0">
                  <Upload className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    Import Danych z VolleyStation
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-200">
                      Auto-Parser LALS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Wklej skopiowany terminarz lub szczegółowy raport meczu (sety, MVP, statystyki)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVolleyStationImportModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Treść modalu */}
            <form onSubmit={handleImportVolleyStation} className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Pasek z bezpośrednim linkiem do oficjalnego terminarza */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-sky-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900">Oficjalny terminarz ligowy LALS:</span>
                </div>
                <a
                  href="https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/schedule/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                  <span>Otwórz: panel.volleystation.com/schedule ↗</span>
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-sky-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  Jak zaimportować dane w 5 sekund:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Otwórz powyższy link do terminarza w nowej karcie.</li>
                  <li>Zaznacz mecze i wyniki (lub cały raport ze statystykami zawodników) i skopiuj (<code className="text-slate-900 bg-slate-100 px-1 rounded">Ctrl+C</code>).</li>
                  <li>Wklej poniżej (<code className="text-slate-900 bg-slate-100 px-1 rounded">Ctrl+V</code>) i kliknij <em>Zaimportuj dane</em>.</li>
                </ol>
              </div>

              {/* Wybór fazy rozgrywek dla importu */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
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
                            ? 'bg-sky-500/15 border-sky-500/60 text-slate-900 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/30'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
                        <span className="text-[11px] text-slate-500">
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
                  <label className="font-bold uppercase tracking-wider text-slate-600">
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
                  placeholder="Wklej tutaj treść skopiowaną z VolleyStation: oficjalny ranking punktowy zawodników ligi, terminarz lub protokół meczu..."
                  rows={9}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-xs font-mono text-slate-700 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition resize-y"
                  required
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  checked={volleyStationAutoCreate}
                  onChange={e => setVolleyStationAutoCreate(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 bg-slate-100 text-sky-500 focus:ring-0 focus:ring-offset-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Automatycznie synchronizuj z terminarzem ligowym LALS
                  </span>
                  <span className="text-slate-500">
                    Tworzy lub aktualizuje wpisy meczów z przeciwnikami, wynikiem, setami i nagrodą MVP.
                  </span>
                </div>
              </label>

              {/* Stopka z przyciskami */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowVolleyStationImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-600 transition"
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
          <div className="bg-slate-100 border border-slate-300 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-200 flex items-center justify-center text-sky-400 shrink-0">
                  <Volleyball className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Dodaj Wynik Meczu Ligowego</h3>
                  <p className="text-xs text-slate-500">Wprowadź oficjalny rezultat meczu LALS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMatchModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLeagueMatch} className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Faza rozgrywek */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Faza rozgrywek:</label>
                <div className="grid grid-cols-2 gap-2">
                  {leaguePhases.map(phase => (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => setMatchPhaseId(phase.id)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition flex items-center justify-between ${
                        matchPhaseId === phase.id
                          ? 'bg-sky-500/20 border-sky-500 text-slate-900 shadow'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
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
                <label className="block text-xs font-bold text-slate-600">Przeciwnik (Drużyna rywali):</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Gladiatorzy BUD-WENT', 'Afera Volley', 'Coco Jumbo', 'Volleyboars', 'Koty Broniszewice', 'Czelendż'].map(team => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => setMatchOpponent(team)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        matchOpponent === team
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Data i Lokalizacja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">Data i godzina:</label>
                  <input
                    type="datetime-local"
                    value={matchDate}
                    onChange={e => setMatchDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">Hala / Miejsce:</label>
                  <input
                    type="text"
                    value={matchLocation}
                    onChange={e => setMatchLocation(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Dom / Wyjazd */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                  <input
                    type="radio"
                    name="isHome"
                    checked={matchIsHome}
                    onChange={() => setMatchIsHome(true)}
                    className="text-sky-500 bg-slate-100 border-slate-300 focus:ring-0"
                  />
                  <span>🏠 Gospodarz (Angels ZTP)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                  <input
                    type="radio"
                    name="isHome"
                    checked={!matchIsHome}
                    onChange={() => setMatchIsHome(false)}
                    className="text-sky-500 bg-slate-100 border-slate-300 focus:ring-0"
                  />
                  <span>🚌 Wyjazd</span>
                </label>
              </div>

              {/* Punkty w setach */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
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
                      <span className="text-xs font-mono font-bold text-slate-500 w-14">Set {s.setNumber}:</span>
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
                          className="w-16 bg-slate-100 border border-slate-300 rounded-lg p-1.5 text-center text-xs font-bold text-slate-900"
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
                          className="w-16 bg-slate-100 border border-slate-300 rounded-lg p-1.5 text-center text-xs font-bold text-slate-900"
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
                  <label className="block text-xs font-bold text-slate-600">MVP Meczu:</label>
                  <input
                    type="text"
                    value={matchMvp}
                    onChange={e => setMatchMvp(e.target.value)}
                    placeholder="np. Karol Ordon, Łukasz Kremer..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">Notatki / Komentarz:</label>
                  <input
                    type="text"
                    value={matchNotes}
                    onChange={e => setMatchNotes(e.target.value)}
                    placeholder="np. Kluczowa seria asów w 3. secie"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Przyciski */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-600 transition"
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

      {/* MODAL TWORZENIA NOWEJ TABELI / FAZY LIGOWEJ */}
      {showCreatePhaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Nowa Tabela / Nowy Etap Ligi LALS
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Utwórz nowy etap. Poprzednie dane Fazy I pozostaną bezpieczne i nie będą się gryźć.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreatePhaseModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pełna nazwa etapu / tabeli *
                </label>
                <input
                  type="text"
                  value={newPhaseName}
                  onChange={e => setNewPhaseName(e.target.value)}
                  placeholder="np. Faza II: Grupa Finałowa (7 zespołów)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Krótka nazwa na zakładce
                  </label>
                  <input
                    type="text"
                    value={newPhaseShortName}
                    onChange={e => setNewPhaseShortName(e.target.value)}
                    placeholder="np. Faza II lub Finały"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Strefa awansu / medali (miejsca)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newPhaseAdvSpots}
                    onChange={e => setNewPhaseAdvSpots(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cel / opis awansu
                </label>
                <input
                  type="text"
                  value={newPhaseAdvTarget}
                  onChange={e => setNewPhaseAdvTarget(e.target.value)}
                  placeholder="np. Mistrz Ligi LALS 2026/2027"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 flex items-start gap-2">
                <span className="text-base">💡</span>
                <span>
                  Po kliknięciu <strong>„Utwórz i wklej tabelę”</strong> natychmiast otworzy się okno, w którym wkleisz nowe zestawienie (ze strony VolleyStation lub Excela). Do tej nowej tabeli będziesz mógł też przypisać nowy terminarz spotkań!
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePhaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleCreatePhase}
                  disabled={creatingPhase}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creatingPhase ? 'Tworzenie...' : 'Utwórz i wklej tabelę'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI TABELI LIGOWEJ */}
      {showEditTableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-100 border border-slate-300 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Nagłówek */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-200 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    Edycja Tabeli Ligowej
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-200">
                      {leaguePhases.find(p => p.id === editingTablePhaseId)?.name || 'Faza I'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {leaguePhases.find(ph => ph.id === editingTablePhaseId)?.name || 'Tabela ligowa'} • {tableRows.length} zespołów • Wklej dane bezpośrednio ze strony ligi lub Excela
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTableModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faza wybór */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {leaguePhases.length > 1 ? (
                  <>
                    <span className="text-xs font-bold text-slate-500">Edytowana tabela:</span>
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
                              : 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200'
                          }`}
                        >
                          {ph.shortName}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-xs font-bold text-slate-700">Tabela ligowa ({tableRows.length} drużyn)</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddTableRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-200 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj zespół</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sekcja szybkiego importu tabeli: Tekst / Zdjęcie OCR */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                      Szybki Import Tabeli LALS
                    </span>
                  </div>
                  {/* Przełącznik Wklej Tekst vs Wgraj Zdjęcie */}
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setTableImportTab('text')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                        tableImportTab === 'text'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      📋 Wklej Tekst
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableImportTab('image')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                        tableImportTab === 'image'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      📸 Zdjęcie / Screenshot (OCR)
                    </button>
                  </div>
                </div>

                {tableImportTab === 'text' ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-500">
                      Wklej tabelę skopiowaną ze strony LALS / VolleyStation (zaznacz całą tabelę na stronie lub wklej z Excela):
                    </p>
                    <textarea
                      rows={5}
                      value={rawTableInput}
                      onChange={e => setRawTableInput(e.target.value)}
                      placeholder={`Możesz wkleić bezpośrednio z VolleyStation, np.:
Drużyna
Punkty
...
1
[Gladiatorzy BUD-WENT](...)
8
3
3
0
9
2
258
218...
(lub wierszami: 1 Gladiatorzy 8 3 3 0 9 2...)`}
                      className="w-full rounded-xl bg-slate-100 border border-slate-300 p-2.5 text-xs font-mono text-slate-700 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleParseRawTable()}
                        disabled={!rawTableInput.trim()}
                        className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider transition shadow-md shadow-sky-500/20"
                      >
                        Przetwórz i wstaw do tabeli
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-slate-500">
                      Wybierz zdjęcie lub zrzut ekranu tabeli ze strony LALS. System automatycznie rozpozna tekst i wypełni tabelę:
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="w-full sm:w-auto cursor-pointer px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 hover:border-sky-500 text-sky-400 hover:text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition">
                        <Camera className="w-4 h-4" />
                        <span>Wybierz zdjęcie / screen tabeli</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleTableImageOcr(file);
                          }}
                        />
                      </label>
                      {tableImagePreview && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Zdjęcie załadowane
                        </span>
                      )}
                    </div>

                    {tableOcrLoading && (
                      <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-sky-800">
                          <span className="font-bold">{tableOcrStatus || 'Rozpoznawanie tekstu ze zdjęcia...'}</span>
                          <span className="font-mono font-bold">{tableOcrProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${Math.max(5, tableOcrProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {rawTableInput && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                          <span>Rozpoznany tekst tabeli (możesz skorygować przed zatwierdzeniem):</span>
                        </div>
                        <textarea
                          rows={3}
                          value={rawTableInput}
                          onChange={e => setRawTableInput(e.target.value)}
                          className="w-full rounded-xl bg-slate-100 border border-slate-300 p-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-sky-500"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleParseRawTable()}
                            className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition"
                          >
                            Zastosuj do tabeli
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edycja wierszy tabeli */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center justify-between px-1">
                  <span>Wiersze tabeli ({tableRows.length} zespołów):</span>
                  {editingTablePhaseId === 'faza_1' && (
                    <span className="text-emerald-400 font-bold lowercase tracking-normal">
                      🟢 top 3 ma awans (linia odcięcia pod 3. miejscem)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tableRows.map((row, idx) => {
                    const currentEditingPhase = leaguePhases.find(p => p.id === editingTablePhaseId);
                    const advSpots = currentEditingPhase?.advancementSpots ?? 0;
                    const isAdvancing = advSpots > 0 && idx < advSpots;
                    const isCutoff = advSpots > 0 && idx === advSpots - 1;
                    return (
                      <React.Fragment key={row.id || idx}>
                        <div
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isAdvancing
                              ? 'bg-slate-50 border-emerald-200 ring-1 ring-emerald-500/20'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTableRow(idx, 'up')}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-100 disabled:opacity-30 text-slate-500 hover:text-slate-900 flex items-center justify-center text-[10px]"
                                title="Przesuń wyżej"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === tableRows.length - 1}
                                onClick={() => handleMoveTableRow(idx, 'down')}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-100 disabled:opacity-30 text-slate-500 hover:text-slate-900 flex items-center justify-center text-[10px]"
                                title="Przesuń niżej"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position */}
                            <span className={`w-7 text-center font-mono font-black text-sm ${isAdvancing ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {idx + 1}.
                            </span>

                            {/* Team Name */}
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={e => handleUpdateTableRow(idx, 'teamName', e.target.value)}
                              className="w-48 sm:w-56 bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                              placeholder="Nazwa zespołu"
                            />

                            {isAdvancing && (
                              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-200">
                                AWANS
                              </span>
                            )}
                          </div>

                          {/* Stats Inputs */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-mono">M:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.matchesPlayed}
                                onChange={e => handleUpdateTableRow(idx, 'matchesPlayed', parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-100 border border-slate-300 rounded-lg p-1 text-center text-xs font-mono text-slate-900"
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
                                className="w-14 bg-slate-100 border border-amber-500/40 rounded-lg p-1 text-center text-xs font-mono font-black text-amber-300"
                                title="Punkty ligowe"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-mono">Sety:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsWon}
                                onChange={e => handleUpdateTableRow(idx, 'setsWon', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-100 border border-slate-300 rounded-lg p-1 text-center text-xs font-mono text-slate-900"
                                title="Sety wygrane"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.setsLost}
                                onChange={e => handleUpdateTableRow(idx, 'setsLost', parseInt(e.target.value) || 0)}
                                className="w-10 bg-slate-100 border border-slate-300 rounded-lg p-1 text-center text-xs font-mono text-slate-900"
                                title="Sety przegrane"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-mono">Małe pkt:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsWon}
                                onChange={e => handleUpdateTableRow(idx, 'pointsWon', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-100 border border-slate-300 rounded-lg p-1 text-center text-xs font-mono text-slate-900"
                                title="Małe punkty zdobyte"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="number"
                                min="0"
                                value={row.pointsLost}
                                onChange={e => handleUpdateTableRow(idx, 'pointsLost', parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-100 border border-slate-300 rounded-lg p-1 text-center text-xs font-mono text-slate-900"
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
                          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-300 shadow">
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
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Liczba zespołów w grupie: <strong className="text-slate-900">{tableRows.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-600 transition"
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
      {/* MODAL DODAWANIA / EDYCJI MECZU TURNIEJOWEGO */}
      {showAddTournamentMatchModal && selectedTournamentForMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  {editingMatchId ? 'Edytuj Mecz Turniejowy' : 'Dodaj Mecz do Turnieju'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                  {selectedTournamentForMatch.title}
                </p>
              </div>
              <button
                onClick={() => setShowAddTournamentMatchModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTournamentMatch} className="space-y-3.5">
              {/* Faza i Runda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Faza turnieju *
                  </label>
                  <select
                    value={matchFormPhase}
                    onChange={e => setMatchFormPhase(e.target.value as TournamentPhase)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                  >
                    {TOURNAMENT_PHASES.map(ph => (
                      <option key={ph.id} value={ph.id}>
                        {ph.icon} {ph.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Oznaczenie rundy / meczu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Grupa A - Mecz 1, Ćwierćfinał 1/4"
                    value={matchFormRound}
                    onChange={e => setMatchFormRound(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Drużyny */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Drużyna A (np. Angels ZTP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={matchFormTeamA}
                    onChange={e => setMatchFormTeamA(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Przeciwnik / Drużyna B *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. KPS Radom, Sparta Warszawa"
                    value={matchFormTeamB}
                    onChange={e => setMatchFormTeamB(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Godzina i Boisko */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Godzina meczu / Boisko
                </label>
                <input
                  type="text"
                  placeholder="np. 11:30 · Boisko B"
                  value={matchFormTime}
                  onChange={e => setMatchFormTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Wynik meczu */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Wynik spotkania (w setach)</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={matchFormIsFinished}
                      onChange={e => setMatchFormIsFinished(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-0"
                    />
                    <span>Mecz zakończony</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Sety: {matchFormTeamA || 'Drużyna A'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={matchFormScoreA}
                      onChange={e => setMatchFormScoreA(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-sm font-bold text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Sety: {matchFormTeamB || 'Drużyna B'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={matchFormScoreB}
                      onChange={e => setMatchFormScoreB(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-sm font-bold text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Punkty w małych setach (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    placeholder="np. 21:18, 19:21, 15:11"
                    value={matchFormSetScores}
                    onChange={e => setMatchFormSetScores(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Notatki / MVP */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Notatki / MVP meczu
                </label>
                <input
                  type="text"
                  placeholder="np. MVP: Bartek Wójcik, świetny serwis w końcówce tie-breaka"
                  value={matchFormNotes}
                  onChange={e => setMatchFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Przyciski */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTournamentMatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={savingMatch}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-md transition disabled:opacity-50"
                >
                  {savingMatch ? 'Zapisywanie...' : (editingMatchId ? 'Zapisz zmiany' : 'Dodaj mecz')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SZYBKIEGO WYBORU MIEJSCA KOŃCOWEGO TURNIEJU */}
      {showTournamentRankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Miejsce Końcowe w Turnieju
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                  {showTournamentRankModal.title}
                </p>
              </div>
              <button
                onClick={() => setShowTournamentRankModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600">
                Wybierz gotowy wynik lub wpisz własny:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  '🥇 1. Miejsce / Złoty Puchar',
                  '🥈 2. Miejsce / Finał',
                  '🥉 3. Miejsce / Brąz',
                  '4. Miejsce / Półfinał',
                  'Ćwierćfinał (1/4 Finału)',
                  'Faza Grupowa'
                ].map(rank => (
                  <button
                    key={rank}
                    type="button"
                    onClick={() => {
                      handleQuickSetTournamentRank(showTournamentRankModal, rank);
                      setShowTournamentRankModal(null);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition ${
                      showTournamentRankModal.result?.tournamentRank === rank
                        ? 'bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-200'
                        : 'bg-slate-50 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-200 border-slate-200 text-slate-800'
                    }`}
                  >
                    {rank}
                  </button>
                ))}
              </div>

              {/* Opcja wpisania własnego miejsca */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Własna nazwa osiągnięcia / miejsca:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="np. 5. miejsce (Puchar Pocieszenia)"
                    defaultValue={showTournamentRankModal.result?.tournamentRank || ''}
                    id="custom-tournament-rank-input"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('custom-tournament-rank-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleQuickSetTournamentRank(showTournamentRankModal, input.value.trim());
                        setShowTournamentRankModal(null);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Zapisz
                  </button>
                </div>
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
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Ładowanie Rozgrywek...</div>}>
      <RozgrywkiContent />
    </Suspense>
  );
}
