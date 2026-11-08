'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { 
  Users, 
  ShieldCheck, 
  Phone, 
  Edit2, 
  Volleyball,
  Crown,
  Flame,
  Sparkles,
  Trophy,
  BarChart3,
  Target,
  Zap,
  CheckCircle2,
  Calendar,
  X,
  Save,
  Activity,
  Award,
  Lock,
  Shield,
  Filter,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { User, Role, PlayerPosition, PlayerStats } from '@/lib/types';

// ==========================================
// RADAR CHART SVG (WYKRES PAJĘCZYNOWY 6 CECH)
// ==========================================
interface RadarMetric {
  label: string;
  value: number; // 0-100
  color: string;
}

function RadarChartSVG({ metrics, size = 280 }: { metrics: RadarMetric[]; size?: number }) {
  const center = size / 2;
  const radius = size * 0.36;
  const total = metrics.length;
  const angleSlice = (Math.PI * 2) / total;

  // Levels: 20%, 40%, 60%, 80%, 100%
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, factor: number) => {
    // Start at top (-PI/2)
    const angle = index * angleSlice - Math.PI / 2;
    const x = center + radius * factor * Math.cos(angle);
    const y = center + radius * factor * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = metrics
    .map((m, i) => {
      const factor = Math.max(0.12, Math.min(1, m.value / 100));
      const { x, y } = getCoordinates(i, factor);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Concentric Polygons */}
        {levels.map((level, lvlIdx) => {
          const gridPoints = metrics
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvlIdx}
              points={gridPoints}
              fill={lvlIdx === levels.length - 1 ? 'rgba(15, 23, 42, 0.5)' : 'none'}
              stroke={lvlIdx === levels.length - 1 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(71, 85, 105, 0.3)'}
              strokeWidth={lvlIdx === levels.length - 1 ? '1.5' : '1'}
            />
          );
        })}

        {/* Radial Axis Lines */}
        {metrics.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(71, 85, 105, 0.4)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Data Shape */}
        <polygon
          points={polygonPoints}
          fill="url(#radarGrad)"
          stroke="#38bdf8"
          strokeWidth="2.5"
          className="filter drop-shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-300"
        />

        {/* Vertices & Labels */}
        {metrics.map((m, i) => {
          const factor = Math.max(0.12, Math.min(1, m.value / 100));
          const pt = getCoordinates(i, factor);
          const labelPt = getCoordinates(i, 1.28);

          return (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <text
                x={labelPt.x}
                y={labelPt.y - 4}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#e2e8f0"
                fontSize="11"
                fontWeight="900"
                className="font-sans tracking-wide"
              >
                {m.label}
              </text>
              <text
                x={labelPt.x}
                y={labelPt.y + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#38bdf8"
                fontSize="10"
                fontWeight="900"
                className="font-mono"
              >
                {m.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ==========================================
// BADGES & ACHIEVEMENTS (GRYWALIZACJA)
// ==========================================
interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  requirement: string;
}

function getPlayerBadges(player: User): PlayerBadge[] {
  const stats = player.stats || {};
  const isCaptain = Boolean(player.isCaptain);
  const aceCount = stats.acePoints || 0;
  const serveRat = stats.serveRating || 0;
  const blockCount = stats.blockPoints || 0;
  const blockRat = stats.blockRating || 0;
  const attackCount = stats.attackPoints || 0;
  const attackRat = stats.attackRating || 0;
  const defRat = stats.defenseRating || 0;
  const recRat = stats.receptionRating || 0;
  const setRat = stats.settingRating || 0;
  const attRate = stats.attendanceRate || 0;
  const mvp = stats.mvpCount || 0;

  return [
    {
      id: 'captain',
      name: 'Kapitan Drużyny',
      description: 'Oficjalny lider zespołu, głos na parkiecie i łącznik ze sztabem',
      icon: '👑',
      color: 'from-amber-500/20 to-yellow-600/10 border-amber-500/50 text-amber-300',
      unlocked: isCaptain,
      requirement: 'Opaska kapitana drużyny'
    },
    {
      id: 'ace_king',
      name: 'Król Asów',
      description: 'Zabójcza zagrywka punktowa siejąca postrach w linii przyjęcia rywali',
      icon: '⚡',
      color: 'from-yellow-500/20 to-amber-600/10 border-yellow-500/50 text-yellow-300',
      unlocked: aceCount >= 5 || serveRat >= 82,
      requirement: 'Min. 5 asów lub jakość zagrywki 82+'
    },
    {
      id: 'wall',
      name: 'Ściana Nie Do Przebicia',
      description: 'Dominacja na siatce: bezlitosne czapy i skuteczne wybloki',
      icon: '🛡️',
      color: 'from-purple-500/20 to-indigo-600/10 border-purple-500/50 text-purple-300',
      unlocked: blockCount >= 8 || blockRat >= 80,
      requirement: 'Min. 8 bloków lub ocena bloku 80+'
    },
    {
      id: 'thunder_attack',
      name: 'Grom w Ataku',
      description: 'Główna armata zespołu kończąca najważniejsze piłki sytuacyjne',
      icon: '🚀',
      color: 'from-rose-500/20 to-red-600/10 border-rose-500/50 text-rose-300',
      unlocked: attackCount >= 25 || attackRat >= 85,
      requirement: 'Min. 25 punktów z ataku lub ocena ataku 85+'
    },
    {
      id: 'floor_cleaner',
      name: 'Czyszczący Parkiet',
      description: 'Niemożliwe obrony w parterze i perfekcyjne dogranie piłki do siatki',
      icon: '🧹',
      color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/50 text-emerald-300',
      unlocked: player.position === 'Libero' || defRat >= 80 || recRat >= 80,
      requirement: 'Pozycja Libero lub ocena obrony/przyjęcia 80+'
    },
    {
      id: 'setting_sniper',
      name: 'Mózg Rozegrania',
      description: 'Precyzja co do milimetra gubiąca blok rywali na pojedynczej siatce',
      icon: '🎯',
      color: 'from-sky-500/20 to-blue-600/10 border-sky-500/50 text-sky-300',
      unlocked: player.position === 'Rozgrywający' || setRat >= 75,
      requirement: 'Pozycja Rozgrywający lub ocena rozegrania 75+'
    },
    {
      id: 'iron_attendance',
      name: 'Żelazna Frekwencja',
      description: '100% oddania i gotowości na każdym treningu i meczu sezonu',
      icon: '💎',
      color: 'from-cyan-500/20 to-teal-600/10 border-cyan-500/50 text-cyan-300',
      unlocked: attRate >= 90,
      requirement: 'Frekwencja na zajęciach min. 90%'
    },
    {
      id: 'mvp_award',
      name: 'MVP Meczu',
      description: 'Oficjalny zdobywca statuetki Najlepszego Zawodnika Meczu',
      icon: '🏆',
      color: 'from-amber-400/20 to-orange-500/10 border-amber-400/50 text-amber-200',
      unlocked: mvp >= 1,
      requirement: 'Minimum 1 oficjalny tytuł MVP'
    }
  ];
}

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Player Profile Modal
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [statsForm, setStatsForm] = useState<PlayerStats>({});

  // Edit user basic info state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('ZAWODNIK');
  const [editNumber, setEditNumber] = useState<string>('');
  const [editPosition, setEditPosition] = useState<PlayerPosition>('Przyjmujący');
  const [editHeight, setEditHeight] = useState<string>('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'Aktywny' | 'Kontuzjowany' | 'Nieobecny'>('Aktywny');
  const [editIsCaptain, setEditIsCaptain] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditNumber(user.number ? String(user.number) : '');
    setEditPosition(user.position || 'Przyjmujący');
    setEditHeight(user.height ? String(user.height) : '');
    setEditPhone(user.phone || '');
    setEditStatus(user.status || 'Aktywny');
    setEditIsCaptain(Boolean(user.isCaptain));
  };

  const openProfile = (user: User) => {
    setProfileUser(user);
    setIsEditingStats(false);
    setStatsForm({
      matchesPlayed: user.stats?.matchesPlayed ?? 8,
      sparringsPlayed: user.stats?.sparringsPlayed ?? 5,
      tournamentsPlayed: user.stats?.tournamentsPlayed ?? 2,
      totalPoints: user.stats?.totalPoints ?? 50,
      attackPoints: user.stats?.attackPoints ?? 35,
      blockPoints: user.stats?.blockPoints ?? 10,
      acePoints: user.stats?.acePoints ?? 5,
      mvpCount: user.stats?.mvpCount ?? 0,
      attendanceRate: user.stats?.attendanceRate ?? 90,
      attackRating: user.stats?.attackRating ?? 82,
      blockRating: user.stats?.blockRating ?? 76,
      serveRating: user.stats?.serveRating ?? 80,
      receptionRating: user.stats?.receptionRating ?? 78,
      defenseRating: user.stats?.defenseRating ?? 76,
      settingRating: user.stats?.settingRating ?? 68,
      coachNotes: user.stats?.coachNotes ?? ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          role: editRole,
          number: editNumber ? Number(editNumber) : undefined,
          position: editPosition,
          height: editHeight ? Number(editHeight) : undefined,
          phone: editPhone,
          status: editStatus,
          isCaptain: editIsCaptain
        })
      });

      if (res.ok) {
        setEditingUser(null);
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu danych');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profileUser.id,
          stats: statsForm
        })
      });

      if (res.ok) {
        setIsEditingStats(false);
        const updated = { ...profileUser, stats: statsForm };
        setProfileUser(updated);
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu statystyk');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const { isArchiveMode } = useSeasonArchive();
  const isManagerOrCoach = !isArchiveMode && Boolean(currentUser?.role === 'KIEROWNIK' || currentUser?.role === 'TRENER' || currentUser?.isCaptain);

  const staff = users.filter(u => u.role === 'KIEROWNIK' || u.role === 'TRENER');
  const players = users.filter(u => u.role === 'ZAWODNIK' || (u.role === 'KIEROWNIK' && Boolean(u.number)));

  // Collapsible Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const activeFiltersCount = (positionFilter !== 'ALL' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const filteredPlayers = players.filter(p => {
    if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.number && p.number.toString().includes(q))) return false;
    }
    return true;
  });

  const [playersPage, setPlayersPage] = useState(1);
  const PLAYERS_PER_PAGE = 8;

  useEffect(() => {
    setPlayersPage(1);
  }, [positionFilter, searchQuery]);

  const totalPlayersPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE) || 1;
  const paginatedPlayers = filteredPlayers.slice((playersPage - 1) * PLAYERS_PER_PAGE, playersPage * PLAYERS_PER_PAGE);

  const getPositionColor = (pos?: string) => {
    switch (pos) {
      case 'Rozgrywający': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Przyjmujący': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Atakujący': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Środkowy': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Libero': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 pb-24 md:pb-16 space-y-6 sm:space-y-8">
      {/* Header - Pro Cyber Athletic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 shadow-lg shadow-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-athletic">
              Kadra <span className="text-gradient-cyan">Drużyny</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Angels ZTP • Sezon LALS 2026/2027</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/30 text-xs font-bold text-slate-300 shadow-sm">
            Zawodnicy: <strong className="text-sky-400 font-mono text-sm ml-1">{players.length}</strong>
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs font-bold text-slate-300 shadow-sm">
            Sztab: <strong className="text-amber-400 font-mono text-sm ml-1">{staff.length}</strong>
          </span>
        </div>
      </div>

      {/* Official Team Photo Hero Card */}
      <div className="cyber-card rounded-3xl overflow-hidden shadow-2xl relative group border-sky-500/30 hover:border-sky-400/60 transition-all duration-300">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full max-h-[460px] overflow-hidden bg-slate-950">
          <img
            src="/angels_team.jpg"
            alt="Angels ZTP - Oficjalne Zdjęcie Drużyny"
            className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-black/30 pointer-events-none" />
          
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-sky-400/50 text-xs font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
              <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full" />
              Lubońska Amatorska Liga Siatkówki (LALS)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-xs font-bold text-amber-300 uppercase tracking-wider">
              Sezon 2026/2027
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg font-athletic">
                  ANGELS ZTP
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                  1. Miejsce w Lidze
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 drop-shadow mt-1">
                Oficjalna kadra zespołu Angels ZTP • Sponsor główny: <strong className="text-amber-300 font-bold">ARPOL</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/rozgrywki?tab=liga"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-sky-500/30 flex items-center gap-1.5 font-athletic"
              >
                <span>Tabela LALS &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Section */}
      <div>
        <h2 className="text-sm font-black text-white mb-3 uppercase tracking-wider flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          Sztab Trenerski i Zarząd
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(member => (
            <div
              key={member.id}
              className="cyber-card rounded-2xl p-5 shadow-xl relative flex items-start justify-between group hover:border-amber-500/50 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg ${
                  member.role === 'KIEROWNIK' ? 'bg-amber-600 border border-amber-400/50 glow-gold' : 'bg-sky-600 border border-sky-400/50 glow-cyan'
                }`}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{member.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      member.role === 'KIEROWNIK' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {member.role === 'KIEROWNIK' ? '👑 Kapitan & Kierownik' : 'Trener'}
                    </span>
                    <span className="text-xs text-slate-400">· {member.position || 'Sztab'}</span>
                  </div>
                  {member.phone && (
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-2 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isArchiveMode && (currentUser?.role === 'KIEROWNIK' || currentUser?.isCaptain || currentUser?.id === member.id) && (
                <button
                  onClick={() => startEdit(member)}
                  className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-slate-800 transition"
                  title="Edytuj profil"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Players Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Volleyball className="w-4 h-4 text-sky-400" />
            Zawodnicy ({players.length})
          </h2>
          <span className="text-xs text-slate-400 font-bold">
            {players.filter(p => p.status === 'Aktywny').length} gotowych do gry
          </span>
        </div>

        {/* Collapsible Filters Bar */}
        <div className="cyber-card border-sky-500/20 rounded-2xl p-3 mb-6 shadow-md">
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
                    setPositionFilter('ALL');
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
                placeholder="Szukaj po nazwisku lub numerze..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {showFilters && (
            <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Pozycja:</span>
              {[
                { id: 'ALL', label: 'Wszyscy' },
                { id: 'Rozgrywający', label: 'Rozgrywający' },
                { id: 'Przyjmujący', label: 'Przyjmujący' },
                { id: 'Środkowy', label: 'Środkowy' },
                { id: 'Atakujący', label: 'Atakujący' },
                { id: 'Libero', label: 'Libero' }
              ].map(pos => (
                <button
                  key={pos.id}
                  onClick={() => setPositionFilter(pos.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    positionFilter === pos.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
          {paginatedPlayers.map(player => {
            const stats = player.stats || {};
            const badges = getPlayerBadges(player);
            const unlockedBadges = badges.filter(b => b.unlocked);

            const isLukaszCaptain = player.isCaptain || player.role === 'KIEROWNIK';

            return (
              <div
                key={player.id}
                className={`rounded-3xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                  isLukaszCaptain
                    ? 'cyber-card-gold border-amber-500/50 glow-gold hover:border-amber-400'
                    : 'cyber-card border-sky-500/20 hover:border-sky-400/50 hover:shadow-sky-500/10'
                }`}
              >
                <div>
                  {/* Top Bar with Number & Position */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-xl shadow-inner ${
                        isLukaszCaptain
                          ? 'bg-gradient-to-br from-amber-500/20 to-amber-950/80 border border-amber-400/60 text-amber-300'
                          : 'bg-gradient-to-br from-sky-500/20 to-slate-950 border border-sky-500/40 text-sky-400'
                      }`}>
                        {player.number ? `#${player.number}` : '-'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-black text-white tracking-wide">{player.name}</h3>
                          {player.isCaptain && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/25 text-amber-300 border border-amber-500/50 glow-gold">
                              <Crown className="w-3 h-3 text-amber-400" />
                              {player.role === 'KIEROWNIK' ? 'Kapitan & Kierownik' : 'Kapitan'}
                            </span>
                          )}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border mt-1 ${getPositionColor(player.position)}`}>
                          {player.position || 'Zawodnik'}
                        </span>
                      </div>
                    </div>

                    {!isArchiveMode && (currentUser?.role === 'KIEROWNIK' || currentUser?.isCaptain || currentUser?.role === 'TRENER' || currentUser?.id === player.id) && (
                      <button
                        onClick={() => startEdit(player)}
                        className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        title="Edytuj podstawowe dane"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Mini Badges Ribbon */}
                  {unlockedBadges.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap my-2.5">
                      {unlockedBadges.slice(0, 3).map(b => (
                        <span
                          key={b.id}
                          title={`${b.name}: ${b.description}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10px] font-bold text-slate-300 shadow-sm"
                        >
                          <span>{b.icon}</span>
                          <span className="truncate max-w-[85px]">{b.name}</span>
                        </span>
                      ))}
                      {unlockedBadges.length > 3 && (
                        <span className="text-[10px] font-bold text-sky-400 font-mono px-1">
                          +{unlockedBadges.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Highlights Mini Stats Pills */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-slate-950/70 border border-sky-500/20 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Punkty</div>
                      <div className="font-mono font-black text-white text-sm">
                        {stats.totalPoints ?? '-'}
                      </div>
                    </div>
                    <div className="text-center border-x border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">MVP</div>
                      <div className="font-mono font-black text-amber-400 text-sm flex items-center justify-center gap-0.5">
                        <Trophy className="w-3 h-3" />
                        {stats.mvpCount ?? 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Obecność</div>
                      <div className="font-mono font-black text-emerald-400 text-sm">
                        {stats.attendanceRate ? `${stats.attendanceRate}%` : '90%'}
                      </div>
                    </div>
                  </div>

                  {/* Player Basic Info */}
                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Wzrost:</span>
                      <strong className="text-white font-mono">{player.height ? `${player.height} cm` : 'brak danych'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        player.status === 'Aktywny' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          player.status === 'Aktywny' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                        }`} />
                        {player.status || 'Aktywny'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile & Stats Button */}
                <button
                  onClick={() => openProfile(player)}
                  className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md ${
                    isLukaszCaptain
                      ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 hover:border-amber-400'
                      : 'bg-slate-900/80 hover:bg-sky-500 hover:text-slate-950 text-sky-400 border border-sky-500/30 hover:border-sky-400'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Profil, Radar & Odznaki
                </button>
              </div>
            );
          })}
        </div>

        {/* Players Pagination Bar */}
        {totalPlayersPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 p-4 bg-[#0b0e14] border border-slate-800 rounded-2xl shadow-lg">
            <span className="text-xs text-slate-400 font-medium">
              Wyświetlanie <span className="text-white font-bold">{((playersPage - 1) * PLAYERS_PER_PAGE) + 1}</span>–<span className="text-white font-bold">{Math.min(playersPage * PLAYERS_PER_PAGE, filteredPlayers.length)}</span> z <span className="text-white font-bold">{filteredPlayers.length}</span> zawodników
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPlayersPage(p => Math.max(1, p - 1))}
                disabled={playersPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Poprzednia strona"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPlayersPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPlayersPage(idx + 1)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                      playersPage === idx + 1
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPlayersPage(p => Math.min(totalPlayersPages, p + 1))}
                disabled={playersPage === totalPlayersPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Następna strona"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Player Profile & Stats Modal */}
      {profileUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl relative my-8">
            <button
              onClick={() => setProfileUser(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border-2 border-sky-400 flex items-center justify-center font-mono font-black text-2xl text-sky-400 shadow-xl">
                  {profileUser.number ? `#${profileUser.number}` : '-'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      {profileUser.name}
                    </h2>
                    {profileUser.isCaptain && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Kapitan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${getPositionColor(profileUser.position)}`}>
                      {profileUser.position || 'Zawodnik'}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {profileUser.height ? `${profileUser.height} cm` : 'Wzrost niepodany'}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      • {profileUser.status || 'Aktywny'}
                    </span>
                  </div>
                </div>
              </div>

              {isManagerOrCoach && (
                <button
                  onClick={() => setIsEditingStats(!isEditingStats)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 transition self-start sm:self-auto"
                >
                  {isEditingStats ? 'Podgląd' : 'Edytuj statystyki & Oceny'}
                </button>
              )}
            </div>

            {/* Content: View or Edit */}
            {!isEditingStats ? (
              <div className="mt-6 space-y-6">
                {/* 4 Key Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Punkty Zdobyte</div>
                    <div className="text-2xl font-black font-mono text-white mt-1">
                      {profileUser.stats?.totalPoints ?? 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Nagrody MVP</div>
                    <div className="text-2xl font-black font-mono text-amber-400 mt-1 flex items-center justify-center gap-1">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      {profileUser.stats?.mvpCount ?? 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Frekwencja</div>
                    <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                      {profileUser.stats?.attendanceRate ? `${profileUser.stats.attendanceRate}%` : '90%'}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Mecze / Sparingi</div>
                    <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                      {(profileUser.stats?.matchesPlayed || 0) + (profileUser.stats?.sparringsPlayed || 0)}
                    </div>
                  </div>
                </div>

                {/* Radar Chart & Detailed Skills Bars (2 COLUMNS) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Left: SVG Radar Chart */}
                  <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center">
                    <div className="w-full flex items-center justify-between px-2 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-sky-400" />
                        Radar Umiejętności
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Skala FIVB 0-100
                      </span>
                    </div>

                    <RadarChartSVG
                      size={270}
                      metrics={[
                        { label: 'Atak', value: profileUser.stats?.attackRating || 82, color: '#f43f5e' },
                        { label: 'Blok', value: profileUser.stats?.blockRating || 76, color: '#a855f7' },
                        { label: 'Zagrywka', value: profileUser.stats?.serveRating || 80, color: '#eab308' },
                        { label: 'Przyjęcie', value: profileUser.stats?.receptionRating || 78, color: '#10b981' },
                        { label: 'Obrona', value: profileUser.stats?.defenseRating || 76, color: '#06b6d4' },
                        { label: 'Rozegranie', value: profileUser.stats?.settingRating || 68, color: '#3b82f6' }
                      ]}
                    />
                  </div>

                  {/* Right: Points & Skills Progress */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Points Breakdown */}
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Punkty w Sezonie
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Atak</span>
                          <p className="text-sm font-black font-mono text-white mt-0.5">
                            {profileUser.stats?.attackPoints ?? 0} pkt
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Blok</span>
                          <p className="text-sm font-black font-mono text-white mt-0.5">
                            {profileUser.stats?.blockPoints ?? 0} pkt
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Asy</span>
                          <p className="text-sm font-black font-mono text-white mt-0.5">
                            {profileUser.stats?.acePoints ?? 0} pkt
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* All 6 Skill Progress Bars */}
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-sky-400" />
                        Oceny Parametrów Gry
                      </h4>

                      {[
                        { label: 'Atak (Siła i Kierunki)', val: profileUser.stats?.attackRating || 82, color: 'bg-rose-500' },
                        { label: 'Blok (Szczelność i Wyczucie)', val: profileUser.stats?.blockRating || 76, color: 'bg-purple-500' },
                        { label: 'Zagrywka (Rotacja i Agresja)', val: profileUser.stats?.serveRating || 80, color: 'bg-amber-500' },
                        { label: 'Przyjęcie Zagrywki', val: profileUser.stats?.receptionRating || 78, color: 'bg-emerald-500' },
                        { label: 'Obrona w Polu', val: profileUser.stats?.defenseRating || 76, color: 'bg-cyan-500' },
                        { label: 'Rozegranie i Wystawa', val: profileUser.stats?.settingRating || 68, color: 'bg-blue-500' }
                      ].map(s => (
                        <div key={s.label}>
                          <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-0.5">
                            <span>{s.label}</span>
                            <span className="font-mono text-white">{s.val} / 100</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                            <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ODZNAKI I OSIĄGNIĘCIA (GRYWALIZACJA) */}
                <div className="p-5 rounded-3xl bg-[#0c1016] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      Odznaki & Osiągnięcia Klubu ({getPlayerBadges(profileUser).filter(b => b.unlocked).length} / {getPlayerBadges(profileUser).length})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Grywalizacja Sezonu 2026/2027
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {getPlayerBadges(profileUser).map(badge => (
                      <div
                        key={badge.id}
                        className={`rounded-2xl p-3.5 border transition flex flex-col justify-between ${
                          badge.unlocked
                            ? `bg-gradient-to-br ${badge.color} shadow-lg`
                            : 'bg-slate-900/30 border-slate-800/80 opacity-40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{badge.icon}</span>
                            {badge.unlocked ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase border border-emerald-500/40">
                                Zdobyte
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-black uppercase flex items-center gap-1 border border-slate-700">
                                <Lock className="w-2.5 h-2.5" /> Zablokowane
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-black text-white">{badge.name}</h5>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                            {badge.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-slate-400 font-medium">
                          {badge.unlocked ? '✅ Warunek spełniony' : `Wymagania: ${badge.requirement}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coach Notes */}
                {profileUser.stats?.coachNotes && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                    <h4 className="font-black uppercase text-amber-300 tracking-wider flex items-center gap-2 mb-1.5">
                      <Target className="w-4 h-4" />
                      Notatka Trenerska & Scouting
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {profileUser.stats.coachNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Form with all 6 ratings */
              <form onSubmit={handleSaveStats} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Punkty łączne</label>
                    <input
                      type="number"
                      value={statsForm.totalPoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, totalPoints: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Punkty z ataku</label>
                    <input
                      type="number"
                      value={statsForm.attackPoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, attackPoints: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Punkty z bloku</label>
                    <input
                      type="number"
                      value={statsForm.blockPoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, blockPoints: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Asy serwisowe</label>
                    <input
                      type="number"
                      value={statsForm.acePoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, acePoints: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Liczba MVP</label>
                    <input
                      type="number"
                      value={statsForm.mvpCount || 0}
                      onChange={e => setStatsForm({ ...statsForm, mvpCount: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Frekwencja (%)</label>
                    <input
                      type="number"
                      value={statsForm.attendanceRate || 90}
                      onChange={e => setStatsForm({ ...statsForm, attendanceRate: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Mecze ligowe</label>
                    <input
                      type="number"
                      value={statsForm.matchesPlayed || 0}
                      onChange={e => setStatsForm({ ...statsForm, matchesPlayed: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Sparingi</label>
                    <input
                      type="number"
                      value={statsForm.sparringsPlayed || 0}
                      onChange={e => setStatsForm({ ...statsForm, sparringsPlayed: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                </div>

                {/* 6 Radar Skill Ratings */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block">
                    Oceny Umiejętności Radaru (0 - 100)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Atak</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={statsForm.attackRating || 80}
                        onChange={e => setStatsForm({ ...statsForm, attackRating: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Blok</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={statsForm.blockRating || 75}
                        onChange={e => setStatsForm({ ...statsForm, blockRating: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Zagrywka</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={statsForm.serveRating || 80}
                        onChange={e => setStatsForm({ ...statsForm, serveRating: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Przyjęcie</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={statsForm.receptionRating || 75}
                        onChange={e => setStatsForm({ ...statsForm, receptionRating: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Obrona</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={statsForm.defenseRating || 75}
                        onChange={e => setStatsForm({ ...statsForm, defenseRating: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">Rozegranie</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={statsForm.settingRating || 65}
                        onChange={e => setStatsForm({ ...statsForm, settingRating: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">
                    Notatka trenerska i wskazówki dla zawodnika
                  </label>
                  <textarea
                    rows={3}
                    value={statsForm.coachNotes || ''}
                    onChange={e => setStatsForm({ ...statsForm, coachNotes: e.target.value })}
                    placeholder="Wprowadź uwagi taktyczne, mocne strony, zadania..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingStats(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition shadow-lg shadow-sky-500/20"
                  >
                    {saving ? 'Zapisywanie...' : 'Zapisz Statystyki'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Basic Info Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black uppercase text-white mb-4">
              Edytuj Profil: {editingUser.name}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Imię i Nazwisko</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Numer koszulki</label>
                  <input
                    type="number"
                    value={editNumber}
                    onChange={e => setEditNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Wzrost (cm)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={e => setEditHeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Pozycja</label>
                <select
                  value={editPosition}
                  onChange={e => setEditPosition(e.target.value as PlayerPosition)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                >
                  <option value="Przyjmujący">Przyjmujący</option>
                  <option value="Atakujący">Atakujący</option>
                  <option value="Rozgrywający">Rozgrywający</option>
                  <option value="Środkowy">Środkowy</option>
                  <option value="Libero">Libero</option>
                  <option value="Sztab trenerski">Sztab trenerski</option>
                  <option value="Zarząd">Zarząd</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Telefon</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={editIsCaptain}
                    onChange={e => setEditIsCaptain(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>👑 Oznacz jako Kapitana Drużyny</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
