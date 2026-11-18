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
  ChevronRight,
  Camera
} from 'lucide-react';
import { User, Role, PlayerPosition, PlayerStats } from '@/lib/types';

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
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleEditAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
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
          setEditAvatar(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    setEditAvatar(user.avatar || '');
  };

  const openProfile = (user: User) => {
    setProfileUser(user);
    setIsEditingStats(false);
    setStatsForm({
      matchesPlayed: user.stats?.matchesPlayed ?? 0,
      sparringsPlayed: user.stats?.sparringsPlayed ?? 0,
      totalPoints: user.stats?.totalPoints ?? 0,
      attackPoints: user.stats?.attackPoints ?? 0,
      blockPoints: user.stats?.blockPoints ?? 0,
      acePoints: user.stats?.acePoints ?? 0,
      mvpCount: user.stats?.mvpCount ?? 0,
      attendanceRate: user.stats?.attendanceRate ?? 90,
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
          isCaptain: editIsCaptain,
          avatar: editAvatar || ''
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
  const PLAYERS_PER_PAGE = 30; // Więcej zawodników na jednej stronie (pełna kadra bez uciążliwego stronicowania)

  useEffect(() => {
    setPlayersPage(1);
  }, [positionFilter, searchQuery]);

  const totalPlayersPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE) || 1;
  const paginatedPlayers = filteredPlayers.slice((playersPage - 1) * PLAYERS_PER_PAGE, playersPage * PLAYERS_PER_PAGE);

  const getPositionColor = (pos?: string) => {
    switch (pos) {
      case 'Rozgrywający': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Przyjmujący': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Atakujący': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Środkowy': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Libero': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 pb-24 md:pb-16 space-y-6 sm:space-y-8">
      {/* Header - Pro Cyber Athletic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-athletic">
              Kadra <span className="text-sky-600">Drużyny</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Angels ZTP • Sezon LALS 2026/2027</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
            Zawodnicy: <strong className="text-sky-600 font-mono text-sm ml-1">{players.length}</strong>
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
            Sztab: <strong className="text-amber-600 font-mono text-sm ml-1">{staff.length}</strong>
          </span>
        </div>
      </div>

      {/* Staff Section */}
      <div>
        <h2 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          Sztab Trenerski i Zarząd
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(member => (
            <div
              key={member.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm relative flex items-start justify-between group hover:border-amber-400 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3.5">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md shrink-0 border transition-transform group-hover:scale-105 ${
                    member.role === 'KIEROWNIK' ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 shadow-amber-500/20' : 'bg-gradient-to-br from-sky-500 to-blue-700 border-sky-300 shadow-sky-500/20'
                  }`}>
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">{member.name}</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border font-mono ${
                      member.role === 'KIEROWNIK' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {member.role === 'KIEROWNIK' ? (member.isCaptain ? '👑 Kapitan & Kierownik' : '👔 Zarząd / Kierownik') : 'Trener'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">· {member.position || 'Sztab'}</span>
                  </div>
                  {member.phone && (
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1 font-mono font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isArchiveMode && (currentUser?.role === 'KIEROWNIK' || currentUser?.isCaptain || currentUser?.id === member.id) && (
                <button
                  onClick={() => startEdit(member)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
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
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Volleyball className="w-4 h-4 text-sky-600" />
            Zawodnicy ({players.length})
          </h2>
          <span className="text-xs text-slate-500 font-bold">
            {players.filter(p => p.status === 'Aktywny').length} gotowych do gry
          </span>
        </div>

        {/* Collapsible Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span>Filtry</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black text-[10px]">
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
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2 ml-1"
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          {showFilters && (
            <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Pozycja:</span>
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    positionFilter === pos.id
                      ? 'bg-sky-600 text-white font-black border-sky-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {paginatedPlayers.map(player => {
            const stats = player.stats || {};
            const isPlayerCaptain = Boolean(player.isCaptain);
            const totalMatches = (stats.matchesPlayed || 0) + (stats.sparringsPlayed || 0);

            return (
              <div
                key={player.id}
                className={`rounded-3xl p-4 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 ${
                  isPlayerCaptain
                    ? 'bg-gradient-to-b from-amber-50/50 via-white to-white border-2 border-amber-300 hover:border-amber-400'
                    : 'bg-white border border-slate-200/90 hover:border-sky-400'
                }`}
              >
                <div>
                  {/* Top Bar with Number & Position */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      {player.avatar ? (
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-md shrink-0">
                          <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                          {player.number && (
                            <span className="absolute bottom-0 right-0 bg-slate-950/90 text-white font-mono font-black text-[10px] px-1.5 py-0.5 rounded-tl-lg shadow">
                              #{player.number}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-2xl shadow-md shrink-0 border transition-transform group-hover:scale-105 ${
                          isPlayerCaptain
                            ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border-amber-300 text-slate-950 shadow-amber-500/20'
                            : player.position === 'Libero'
                            ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-500 border-yellow-300 text-slate-950 shadow-amber-500/20'
                            : 'bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 border-sky-400/50 text-white shadow-sky-500/20'
                        }`}>
                          {player.number ? `#${player.number}` : '-'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 tracking-tight">{player.name}</h3>
                          {player.isCaptain && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-mono">
                              <Crown className="w-3 h-3 text-amber-600" />
                              {player.role === 'KIEROWNIK' ? 'Kapitan & Kierownik' : 'Kapitan'}
                            </span>
                          )}
                        </div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black border mt-1 shadow-2xs ${getPositionColor(player.position)}`}>
                          {player.position || 'Zawodnik'}
                        </span>
                      </div>
                    </div>

                    {!isArchiveMode && (currentUser?.role === 'KIEROWNIK' || currentUser?.isCaptain || currentUser?.role === 'TRENER' || currentUser?.id === player.id) && (
                      <button
                        onClick={() => startEdit(player)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                        title="Edytuj dane zawodnika"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Podstawowe Statystyki Zawodnika (3 proste wskaźniki) */}
                  <div className="grid grid-cols-3 gap-2 my-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Punkty</div>
                      <div className="font-mono font-black text-slate-900 text-base">
                        {stats.totalPoints ?? 0}
                      </div>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Mecze</div>
                      <div className="font-mono font-black text-sky-600 text-base">
                        {totalMatches}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Obecność</div>
                      <div className="font-mono font-black text-emerald-700 text-base">
                        {stats.attendanceRate ? `${stats.attendanceRate}%` : '90%'}
                      </div>
                    </div>
                  </div>

                  {/* Informacje klubowe: Wzrost i Status */}
                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span>Wzrost:</span>
                      <strong className="text-slate-800 font-mono">{player.height ? `${player.height} cm` : '-'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        player.status === 'Aktywny' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          player.status === 'Aktywny' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`} />
                        {player.status || 'Aktywny'}
                      </span>
                    </div>
                    {stats.mvpCount && stats.mvpCount > 0 ? (
                      <div className="flex justify-between items-center text-amber-800 font-bold pt-1">
                        <span>Nagrody MVP:</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          {stats.mvpCount}x
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Profile Button */}
                <button
                  onClick={() => openProfile(player)}
                  className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm ${
                    isPlayerCaptain
                      ? 'bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-white border border-amber-300'
                      : 'bg-slate-50 hover:bg-sky-600 text-slate-700 hover:text-white border border-slate-200 hover:border-sky-600'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Szczegóły & Statystyki
                </button>
              </div>
            );
          })}
        </div>

        {/* Players Pagination Bar */}
        {totalPlayersPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <span className="text-xs text-slate-500 font-medium">
              Wyświetlanie <span className="text-slate-900 font-bold">{((playersPage - 1) * PLAYERS_PER_PAGE) + 1}</span>–<span className="text-slate-900 font-bold">{Math.min(playersPage * PLAYERS_PER_PAGE, filteredPlayers.length)}</span> z <span className="text-slate-900 font-bold">{filteredPlayers.length}</span> zawodników
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPlayersPage(p => Math.max(1, p - 1))}
                disabled={playersPage === 1}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPlayersPage(p => Math.min(totalPlayersPages, p + 1))}
                disabled={playersPage === totalPlayersPages}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Następna strona"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Uproszczony profil i podstawowe statystyki zawodnika */}
      {profileUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl relative max-h-[92vh] sm:max-h-[88vh] flex flex-col text-slate-800 my-auto">
            <button
              onClick={() => setProfileUser(null)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header (Fixed at top) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 shrink-0 pr-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 border-2 border-sky-300 flex items-center justify-center font-mono font-black text-xl sm:text-2xl text-sky-700 shadow-sm shrink-0">
                  {profileUser.number ? `#${profileUser.number}` : '-'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {profileUser.name}
                    </h2>
                    {profileUser.isCaptain && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        Kapitan
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${getPositionColor(profileUser.position)}`}>
                      {profileUser.position || 'Zawodnik'}
                    </span>
                    {profileUser.height ? (
                      <span className="text-xs text-slate-500">
                        • {profileUser.height} cm
                      </span>
                    ) : null}
                    <span className="text-xs text-emerald-700 font-bold">
                      • {profileUser.status || 'Aktywny'}
                    </span>
                  </div>
                </div>
              </div>

              {isManagerOrCoach && (
                <button
                  onClick={() => setIsEditingStats(!isEditingStats)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition self-start sm:self-auto shadow-sm cursor-pointer"
                >
                  {isEditingStats ? 'Podgląd' : 'Edytuj statystyki'}
                </button>
              )}
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto min-h-0 flex-1 pt-4 pr-1 space-y-5 overscroll-contain">

            {/* Podstawowe Statystyki */}
            {!isEditingStats ? (
              <div className="space-y-5">
                {/* 4 Podstawowe wskaźniki */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Mecze Łącznie</div>
                    <div className="text-2xl font-black font-mono text-sky-700 mt-1">
                      {(profileUser.stats?.matchesPlayed || 0) + (profileUser.stats?.sparringsPlayed || 0)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      liga: {profileUser.stats?.matchesPlayed || 0} • sparingi: {profileUser.stats?.sparringsPlayed || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Zdobyte Punkty</div>
                    <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                      {profileUser.stats?.totalPoints ?? 0}
                    </div>
                    <span className="text-[10px] text-slate-400">w całym sezonie</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Frekwencja</div>
                    <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                      {profileUser.stats?.attendanceRate ? `${profileUser.stats.attendanceRate}%` : '90%'}
                    </div>
                    <span className="text-[10px] text-slate-400">treningi & mecze</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Tytuły MVP</div>
                    <div className="text-2xl font-black font-mono text-amber-700 mt-1 flex items-center justify-center gap-1">
                      <Trophy className="w-5 h-5 text-amber-600" />
                      {profileUser.stats?.mvpCount ?? 0}
                    </div>
                    <span className="text-[10px] text-slate-400">statuetki</span>
                  </div>
                </div>

                {/* Rozbicie punktów na elementy siatkarskie */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Volleyball className="w-4 h-4 text-sky-600" />
                    Rozbicie Punktów na Elementy Gry
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                      <span className="text-[11px] text-rose-600 font-bold uppercase">Atak</span>
                      <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                        {profileUser.stats?.attackPoints ?? 0} <span className="text-xs font-normal text-slate-400">pkt</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                      <span className="text-[11px] text-purple-600 font-bold uppercase">Blok</span>
                      <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                        {profileUser.stats?.blockPoints ?? 0} <span className="text-xs font-normal text-slate-400">pkt</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                      <span className="text-[11px] text-amber-600 font-bold uppercase">Asy Serwisowe</span>
                      <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                        {profileUser.stats?.acePoints ?? 0} <span className="text-xs font-normal text-slate-400">pkt</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dane kontaktowe i klubowe */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                    Informacje o Zawodniku
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Wzrost:</span>
                      <strong className="text-slate-900 font-mono">{profileUser.height ? `${profileUser.height} cm` : '-'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Numer:</span>
                      <strong className="text-slate-900 font-mono">{profileUser.number ? `#${profileUser.number}` : '-'}</strong>
                    </div>
                    {profileUser.phone && (
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Telefon:</span>
                        <strong className="text-slate-900 font-mono">{profileUser.phone}</strong>
                      </div>
                    )}
                    {profileUser.email && (
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Email:</span>
                        <strong className="text-slate-900 font-mono">{profileUser.email}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notatka Trenerska (jeśli istnieje) */}
                {profileUser.stats?.coachNotes && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                    <h4 className="font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5 mb-1">
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                      Notatka Trenerska
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {profileUser.stats.coachNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Prosty formularz edycji statystyk */
              <form onSubmit={handleSaveStats} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Punkty łączne</label>
                    <input
                      type="number"
                      value={statsForm.totalPoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, totalPoints: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Punkty z ataku</label>
                    <input
                      type="number"
                      value={statsForm.attackPoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, attackPoints: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Punkty z bloku</label>
                    <input
                      type="number"
                      value={statsForm.blockPoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, blockPoints: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Asy serwisowe</label>
                    <input
                      type="number"
                      value={statsForm.acePoints || 0}
                      onChange={e => setStatsForm({ ...statsForm, acePoints: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Liczba MVP</label>
                    <input
                      type="number"
                      value={statsForm.mvpCount || 0}
                      onChange={e => setStatsForm({ ...statsForm, mvpCount: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Frekwencja (%)</label>
                    <input
                      type="number"
                      value={statsForm.attendanceRate || 90}
                      onChange={e => setStatsForm({ ...statsForm, attendanceRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Mecze ligowe</label>
                    <input
                      type="number"
                      value={statsForm.matchesPlayed || 0}
                      onChange={e => setStatsForm({ ...statsForm, matchesPlayed: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Sparingi</label>
                    <input
                      type="number"
                      value={statsForm.sparringsPlayed || 0}
                      onChange={e => setStatsForm({ ...statsForm, sparringsPlayed: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Notatka trenerska i wskazówki
                  </label>
                  <textarea
                    rows={2}
                    value={statsForm.coachNotes || ''}
                    onChange={e => setStatsForm({ ...statsForm, coachNotes: e.target.value })}
                    placeholder="Wprowadź uwagi taktyczne, mocne strony, zadania..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingStats(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
                  >
                    {saving ? 'Zapisywanie...' : 'Zapisz Statystyki'}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Basic Info Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black uppercase text-slate-900 mb-4">
              Edytuj Profil: {editingUser.name}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Zdjęcie profilowe */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white shrink-0 flex items-center justify-center">
                  {editAvatar ? (
                    <img src={editAvatar} alt="Podgląd" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 text-slate-600 font-black text-xl flex items-center justify-center">
                      {editName ? editName.charAt(0) : '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="team-edit-avatar-file"
                      className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Wybierz zdjęcie
                    </label>
                    <input
                      type="file"
                      id="team-edit-avatar-file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditAvatarFileChange}
                    />
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar('')}
                        className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition"
                      >
                        Usuń
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={editAvatar.startsWith('data:') ? '' : editAvatar}
                    onChange={e => setEditAvatar(e.target.value)}
                    placeholder="Lub podaj URL zdjęcia..."
                    className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Imię i Nazwisko</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Numer koszulki</label>
                  <input
                    type="number"
                    value={editNumber}
                    onChange={e => setEditNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wzrost (cm)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={e => setEditHeight(e.target.value)}
                    placeholder="np. 192 (opcjonalnie)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pozycja</label>
                <select
                  value={editPosition}
                  onChange={e => setEditPosition(e.target.value as PlayerPosition)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs focus:bg-white"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editIsCaptain}
                    onChange={e => setEditIsCaptain(e.target.checked)}
                    className="rounded bg-slate-50 border-slate-300 text-amber-500 focus:ring-0"
                  />
                  <span>👑 Oznacz jako Kapitana Drużyny</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
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
