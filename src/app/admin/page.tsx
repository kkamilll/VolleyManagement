'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Crown, 
  Volleyball, 
  Calendar, 
  BarChart3, 
  Target,
  CreditCard, 
  Megaphone, 
  Vote, 
  Lock, 
  Check, 
  Save, 
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Archive,
  FolderArchive,
  RotateCcw,
  History,
  Eye,
  Download,
  AlertTriangle,
  Layers,
  Globe,
  Trash2,
  Compass,
  Image as ImageIcon,
  Database,
  Cloud,
  Server,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, Role, UserPermissions, SeasonArchive } from '@/lib/types';

function AdminCenterContent() {
  const { user: currentUser, loading: authLoading, quickSwitch } = useAuth();
  const { isArchiveMode, activeArchiveId, enterArchiveMode, exitArchiveMode } = useSeasonArchive();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const activeFiltersCount = (roleFilter !== 'ALL' ? 1 : 0) + (search.trim() ? 1 : 0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<'permissions' | 'seasons' | 'database'>(
    tabParam === 'seasons' ? 'seasons' : tabParam === 'database' ? 'database' : 'permissions'
  );
  const [mongoStatus, setMongoStatus] = useState<any>(null);
  const [loadingMongoStatus, setLoadingMongoStatus] = useState(false);
  const [syncingMongo, setSyncingMongo] = useState(false);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [seasonNameInput, setSeasonNameInput] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<SeasonArchive | null>(null);
  const [loadingArchiveDetail, setLoadingArchiveDetail] = useState(false);
  const [archiveDetailTab, setArchiveDetailTab] = useState<'roster' | 'matches' | 'events' | 'fees' | 'tactics' | 'photos' | 'announcements'>('roster');

  const [usersPage, setUsersPage] = useState(1);
  const USERS_PER_PAGE = 6;

  useEffect(() => {
    setUsersPage(1);
  }, [roleFilter, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/permissions');
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

  const fetchSeasons = async () => {
    try {
      setLoadingSeasons(true);
      const res = await fetch('/api/admin/seasons');
      if (res.ok) {
        const data = await res.json();
        setSeasons(data.seasons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSeasons(false);
    }
  };

  const fetchMongoStatus = async () => {
    try {
      setLoadingMongoStatus(true);
      const res = await fetch('/api/admin/mongo-status');
      if (res.ok) {
        const data = await res.json();
        setMongoStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMongoStatus(false);
    }
  };

  const handleMongoAction = async (action: 'PUSH_LOCAL_TO_MONGO' | 'PULL_MONGO_TO_LOCAL') => {
    if (!confirm(action === 'PUSH_LOCAL_TO_MONGO' 
      ? 'Czy na pewno chcesz nadpisać dane w MongoDB Atlas aktualnym stanem z pliku lokalnego db.json?'
      : 'Czy na pewno chcesz pobrać stan z MongoDB Atlas i nadpisać plik lokalny db.json?'
    )) return;

    setSyncingMongo(true);
    try {
      const res = await fetch('/api/admin/mongo-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Operacja zakończona sukcesem!');
        await fetchMongoStatus();
      } else {
        alert(data.error || 'Wystąpił błąd');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingMongo(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSeasons();
    fetchMongoStatus();
  }, [currentUser]);

  const handleArchiveSeason = async () => {
    if (isArchiveMode) {
      alert('Nie można archiwizować z poziomu trybu archiwalnego. Wróć do bieżącego sezonu.');
      return;
    }
    if (!seasonNameInput.trim()) {
      alert('Wpisz nazwę sezonu (np. Sezon 2025/2026)');
      return;
    }
    setArchiving(true);
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonName: seasonNameInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Sezon został pomyślnie zarchiwizowany!');
        setShowArchiveConfirm(false);
        setSeasonNameInput('');
        await fetchSeasons();
        await fetchUsers();
      } else {
        alert(data.error || 'Błąd archiwizacji');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas zapisywania archiwum');
    } finally {
      setArchiving(false);
    }
  };

  const handleViewArchive = async (archiveId: string) => {
    try {
      setLoadingArchiveDetail(true);
      const res = await fetch(`/api/admin/seasons/${archiveId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedArchive(data.season);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingArchiveDetail(false);
    }
  };

  const handleRestoreSeason = async (archiveId: string) => {
    try {
      setRestoring(true);
      const res = await fetch(`/api/admin/seasons/${archiveId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });
      if (res.ok) {
        alert('Sezon został pomyślnie przywrócony jako bieżący!');
        setShowRestoreConfirm(null);
        exitArchiveMode();
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd przywracania sezonu');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas przywracania');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteSeason = async (archiveId: string) => {
    if (!confirm('Czy na pewno chcesz trwale usunąć ten zarchiwizowany sezon? Ta operacja jest nieodwracalna.')) return;
    try {
      const res = await fetch(`/api/admin/seasons/${archiveId}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeArchiveId === archiveId) {
          exitArchiveMode();
        }
        await fetchSeasons();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd usuwania archiwum');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isManager = currentUser?.role === 'KIEROWNIK' || currentUser?.role === 'TRENER' || currentUser?.isCaptain || Boolean(currentUser?.permissions?.isAdmin);

  const handleTogglePermission = (userId: string, permKey: keyof UserPermissions) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const currentPerms = u.permissions || {};
        return {
          ...u,
          permissions: {
            ...currentPerms,
            [permKey]: !currentPerms[permKey]
          }
        };
      }
      return u;
    }));
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        let presetPerms: UserPermissions = {};
        if (newRole === 'KIEROWNIK') {
          presetPerms = {
            canManageMatches: true,
            canManageEvents: true,
            canManageStats: true,
            canManageTactics: true,
            canManageFees: true,
            canPostAnnouncements: true,
            canCreatePolls: true,
            isAdmin: true
          };
        } else if (newRole === 'TRENER') {
          presetPerms = {
            canManageMatches: true,
            canManageEvents: true,
            canManageStats: true,
            canManageTactics: true,
            canManageFees: false,
            canPostAnnouncements: true,
            canCreatePolls: true,
            isAdmin: false
          };
        } else {
          presetPerms = {
            canManageMatches: false,
            canManageEvents: false,
            canManageStats: false,
            canManageTactics: false,
            canManageFees: false,
            canPostAnnouncements: false,
            canCreatePolls: false,
            isAdmin: false
          };
        }
        return {
          ...u,
          role: newRole,
          permissions: presetPerms
        };
      }
      return u;
    }));
  };

  const applyPreset = (userId: string, preset: 'CAPTAIN' | 'ASSISTANT' | 'PLAYER_DEFAULT') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        let perms: UserPermissions = {};
        if (preset === 'CAPTAIN') {
          perms = {
            canManageMatches: false,
            canManageEvents: true,
            canManageStats: false,
            canManageTactics: true,
            canManageFees: false,
            canPostAnnouncements: true,
            canCreatePolls: true,
            isAdmin: false
          };
        } else if (preset === 'ASSISTANT') {
          perms = {
            canManageMatches: true,
            canManageEvents: true,
            canManageStats: true,
            canManageTactics: true,
            canManageFees: false,
            canPostAnnouncements: true,
            canCreatePolls: true,
            isAdmin: false
          };
        } else {
          perms = {
            canManageMatches: false,
            canManageEvents: false,
            canManageStats: false,
            canManageTactics: false,
            canManageFees: false,
            canPostAnnouncements: false,
            canCreatePolls: false,
            isAdmin: false
          };
        }
        return {
          ...u,
          permissions: perms
        };
      }
      return u;
    }));
  };

  const handleSaveUserPermissions = async (userToSave: User) => {
    if (isArchiveMode) {
      alert('W trybie archiwum edycja uprawnień jest zablokowana.');
      return;
    }
    setSavingId(userToSave.id);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToSave.id,
          role: userToSave.role,
          permissions: userToSave.permissions
        })
      });

      if (res.ok) {
        setSuccessMsg(`Zapisano uprawnienia dla: ${userToSave.name}`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu uprawnień');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas zapisywania');
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-athletic text-steel-400 uppercase tracking-widest animate-pulse">
          Weryfikacja uprawnień administracyjnych...
        </p>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-athletic">
              Wymagany Dostęp Administratora
            </h2>
            <p className="text-xs text-slate-400">
              Centrum administracji i archiwizacja sezonu dostępne są dla kont z rolą <strong>Kierownik</strong>, <strong>Trener</strong> lub uprawnieniem <strong>isAdmin</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              Bieżący stan sesji:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">
                {currentUser ? currentUser.name : 'Niezalogowany (Gość)'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                {currentUser?.role || 'BRAK'}
              </span>
            </div>
            {currentUser?.email && (
              <span className="text-slate-400 font-mono text-[11px] block">{currentUser.email}</span>
            )}
          </div>

          {/* Szybki przełącznik profilu w trybie testowym */}
          <div className="space-y-2 pt-1 text-left">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block text-center">
              Przełącz profil jednym kliknięciem (Dostęp do panelu):
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => quickSwitch('usr_kierownik')}
                className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-black text-white block">Kierownik (Łukasz)</span>
                    <span className="text-[10px] text-amber-300/80">Pełne uprawnienia administratora & Archiwum</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  Przełącz →
                </span>
              </button>

              <button
                type="button"
                onClick={() => quickSwitch('usr_trener')}
                className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="font-black text-white block">Trener (Hubert)</span>
                    <span className="text-[10px] text-sky-300/80">Sztab trenerski, mecze & uprawnienia</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
                  Przełącz →
                </span>
              </button>

              <button
                type="button"
                onClick={() => quickSwitch('usr_zawodnik_2')}
                className="p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Volleyball className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-black text-white block">Kamil Pujanek (Konto Główne)</span>
                    <span className="text-[10px] text-purple-300/80">Zawodnik #4 z pełnymi uprawnieniami Admina</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-400 group-hover:translate-x-0.5 transition-transform">
                  Przełącz →
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 text-xs">
            <a
              href="/login"
              className="text-slate-400 hover:text-white underline transition"
            >
              Strona logowania
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="/"
              className="text-slate-400 hover:text-white underline transition"
            >
              Powrót do pulpitu
            </a>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsersPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * USERS_PER_PAGE, usersPage * USERS_PER_PAGE);

  const PERMISSION_CONFIG: {
    key: keyof UserPermissions;
    label: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      key: 'canManageMatches',
      label: 'Mecze Ligowe',
      description: 'Wyniki, sety, MVP ligi',
      icon: Volleyball,
      color: 'text-sky-400'
    },
    {
      key: 'canManageEvents',
      label: 'Sparingi / Szóstka',
      description: 'Sparingi, turnieje, składy',
      icon: Calendar,
      color: 'text-amber-400'
    },
    {
      key: 'canManageStats',
      label: 'VolleyStation',
      description: 'Wklejanie i parsing protokołów',
      icon: BarChart3,
      color: 'text-emerald-400'
    },
    {
      key: 'canManageTactics',
      label: 'Taktyka & Scouting',
      description: 'Tablica boiskowa, playbook, scouting',
      icon: Target,
      color: 'text-sky-400'
    },
    {
      key: 'canManageFees',
      label: 'Składki & BLIK',
      description: 'Weryfikacja wpłat i bilans',
      icon: CreditCard,
      color: 'text-amber-300'
    },
    {
      key: 'canPostAnnouncements',
      label: 'Komunikaty',
      description: 'Ważne ogłoszenia zespołu',
      icon: Megaphone,
      color: 'text-rose-400'
    },
    {
      key: 'canCreatePolls',
      label: 'Ankiety',
      description: 'Głosowania i ankiety składu',
      icon: Vote,
      color: 'text-purple-400'
    },
    {
      key: 'isAdmin',
      label: 'Administrator',
      description: 'Dostęp do panelu uprawnień',
      icon: ShieldAlert,
      color: 'text-amber-500'
    }
  ];

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-steel-800/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-athletic text-bone-100 tracking-wider uppercase">
            Uprawnienia i Role
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-dark-950 border border-steel-800 text-xs font-bold text-steel-400">
            Użytkownicy: <strong className="text-bone-100 font-mono">{users.length}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-dark-950 border border-steel-800 text-xs font-bold text-steel-400">
            Sztab: <strong className="text-sky-400 font-mono">{users.filter(u => u.role !== 'ZAWODNIK').length}</strong>
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex border-b border-steel-800 gap-4 mb-6">
        <button
          onClick={() => setAdminTab('permissions')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 ${
            adminTab === 'permissions'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-steel-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Uprawnienia & Role Kadry</span>
        </button>

        <button
          onClick={() => setAdminTab('seasons')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 ${
            adminTab === 'seasons'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-steel-400 hover:text-white'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-amber-400" />
          <span>Archiwizacja & Historia Sezonów</span>
          {seasons.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40">
              {seasons.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setAdminTab('database');
            fetchMongoStatus();
          }}
          className={`pb-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 ${
            adminTab === 'database'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-steel-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Baza Danych & Chmura (MongoDB)</span>
          {mongoStatus?.connected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB 1: PERMISSIONS */}
      {adminTab === 'permissions' && (
        <>
          {isArchiveMode && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <FolderArchive className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-bone-100">Tryb archiwalny: Zarządzanie uprawnieniami zablokowane</p>
                  <p className="text-[11px] text-amber-300/80">Przeglądasz zamrożony stan ról z tego sezonu. Aby modyfikować uprawnienia kadry, wróć do obecnego sezonu.</p>
                </div>
              </div>
              <button
                onClick={exitArchiveMode}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shrink-0"
              >
                Wróć do obecnego
              </button>
            </div>
          )}

          {/* Collapsible Filters & Search */}
          <div className="angel-card rounded-2xl p-3 mb-6 border border-steel-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/40'
                  : 'bg-dark-900 text-steel-300 border-steel-800 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <span>Filtry</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white font-black text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-steel-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setRoleFilter('ALL');
                  setSearch('');
                }}
                className="text-[11px] font-bold text-steel-400 hover:text-rose-400 transition underline underline-offset-2 ml-1"
              >
                Wyczyść filtry
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Szukaj po nazwisku lub e-mailu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-950/80 border border-steel-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-bone-100 placeholder-steel-600 focus:outline-none focus:border-steel-400 transition"
            />
          </div>
        </div>

        {showFilters && (
          <div className="pt-3 mt-3 border-t border-steel-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-steel-400 mr-1">Rola:</span>
            {['ALL', 'KIEROWNIK', 'TRENER', 'ZAWODNIK'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-athletic transition whitespace-nowrap ${
                  roleFilter === role
                    ? 'bg-steel-600 text-bone-100 border border-steel-500 shadow'
                    : 'bg-dark-900 text-steel-400 hover:text-white border border-steel-800'
                }`}
              >
                {role === 'ALL' ? 'Wszyscy' : role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Users Permissions Matrix Cards */}
      <div className="space-y-5">
        {loading ? (
          <div className="angel-card rounded-2xl p-10 text-center text-steel-400">
            Wczytywanie uprawnień członków Angels ZTP...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="angel-card rounded-2xl p-10 text-center text-steel-400">
            Brak wyników wyszukiwania
          </div>
        ) : (
          paginatedUsers.map((member) => {
            const isTargetKierownik = member.role === 'KIEROWNIK';
            const userPerms = member.permissions || {};

            return (
              <div
                key={member.id}
                className="angel-card rounded-2xl p-4 sm:p-6 shadow-xl relative border border-steel-800/80 hover:border-steel-700/80 transition"
              >
                {/* User Info Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-steel-800/80">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-dark-900 border border-steel-700 flex items-center justify-center font-athletic text-bone-100 text-base shrink-0 shadow">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-athletic text-bone-100">{member.name}</h3>
                        {member.number && (
                          <span className="bg-steel-800 text-bone-100 text-[11px] px-2 py-0.5 rounded font-mono font-bold border border-steel-700">
                            #{member.number}
                          </span>
                        )}
                        <span className="text-xs text-steel-400 font-medium">{member.position}</span>
                      </div>
                      <div className="text-[11px] text-steel-500 mt-0.5">
                        {member.email} · Tel: {member.phone || 'Brak'}
                      </div>
                    </div>
                  </div>

                  {/* Role Selector & Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-xl border border-steel-800">
                      {(['KIEROWNIK', 'TRENER', 'ZAWODNIK'] as Role[]).map((r) => (
                        <button
                          key={r}
                          disabled={isArchiveMode}
                          onClick={() => handleRoleChange(member.id, r)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            member.role === r
                              ? r === 'KIEROWNIK'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                                : r === 'TRENER'
                                ? 'bg-sky-600 text-white font-bold shadow'
                                : 'bg-steel-700 text-white font-bold shadow'
                              : 'text-steel-400 hover:text-white'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1">
                      <button
                        disabled={isArchiveMode}
                        onClick={() => applyPreset(member.id, 'CAPTAIN')}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-athletic bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 border border-purple-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Nadaje uprawnienia kapitana (komunikaty, ankiety, sparingi)"
                      >
                        ⭐ Kapitan
                      </button>
                      <button
                        disabled={isArchiveMode}
                        onClick={() => applyPreset(member.id, 'ASSISTANT')}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-athletic bg-sky-950/40 text-sky-300 hover:bg-sky-900/60 border border-sky-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Nadaje uprawnienia asystenta trenera (mecze, statystyki, sparingi)"
                      >
                        📋 Asystent
                      </button>
                    </div>

                    <button
                      onClick={() => handleSaveUserPermissions(member)}
                      disabled={savingId === member.id || isArchiveMode}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-athletic bg-emerald-600 hover:bg-emerald-500 text-white shadow transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isArchiveMode ? 'Zablokowane' : savingId === member.id ? 'Zapis...' : 'Zapisz'}
                    </button>
                  </div>
                </div>

                {/* Granular Permissions Switcher Grid */}
                <div className="mt-4">
                  <span className="text-[10px] font-athletic uppercase tracking-wider text-steel-400 block mb-2.5">
                    Moduły i Uprawnienia Dostępowe:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {PERMISSION_CONFIG.map((cfg) => {
                      const Icon = cfg.icon;
                      const isGranted = isTargetKierownik ? true : Boolean(userPerms[cfg.key]);

                      return (
                        <div
                          key={cfg.key}
                          onClick={() => {
                            if (!isTargetKierownik && !isArchiveMode) {
                              handleTogglePermission(member.id, cfg.key);
                            }
                          }}
                          className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                            isGranted
                              ? 'bg-dark-900/90 border-steel-600/70 shadow-sm'
                              : 'bg-dark-950/60 border-steel-800/70 opacity-60 hover:opacity-100'
                          } ${isTargetKierownik || isArchiveMode ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg bg-dark-950 border border-steel-800 ${cfg.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-bone-100">{cfg.label}</span>
                            </div>

                            {/* Toggle Switch */}
                            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${
                              isGranted ? 'bg-emerald-500' : 'bg-steel-800'
                            }`}>
                              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                                isGranted ? 'translate-x-3.5' : 'translate-x-0'
                              }`} />
                            </div>
                          </div>

                          <p className="text-[10px] text-steel-400 mt-2">
                            {cfg.description}
                          </p>

                          <div className="mt-2 pt-2 border-t border-steel-800/60 flex items-center justify-between text-[10px]">
                            <span className="text-steel-500">Status:</span>
                            <span className={`font-mono font-bold ${isGranted ? 'text-emerald-400' : 'text-steel-600'}`}>
                              {isGranted ? 'AKTYWNY' : 'BLOKADA'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Users Pagination Bar */}
        {totalUsersPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 angel-card border border-steel-800 rounded-2xl shadow-lg">
            <span className="text-xs text-steel-400 font-medium">
              Wyświetlanie <span className="text-bone-100 font-bold">{((usersPage - 1) * USERS_PER_PAGE) + 1}</span>–<span className="text-bone-100 font-bold">{Math.min(usersPage * USERS_PER_PAGE, filteredUsers.length)}</span> z <span className="text-bone-100 font-bold">{filteredUsers.length}</span> użytkowników
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                disabled={usersPage === 1}
                className="p-1.5 rounded-lg bg-dark-900 border border-steel-800 text-steel-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Poprzednia strona"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalUsersPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUsersPage(idx + 1)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                      usersPage === idx + 1
                        ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                        : 'bg-dark-900 border border-steel-800 text-steel-400 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                disabled={usersPage === totalUsersPages}
                className="p-1.5 rounded-lg bg-dark-900 border border-steel-800 text-steel-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Następna strona"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* TAB 2: SEASONS ARCHIVE & RESET */}
      {adminTab === 'seasons' && (
        <div className="space-y-8">
          {/* Action Card: Zakończ i Zarchiwizuj Sezon */}
          <div className="bg-[#0b0e14] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-bl-full pointer-events-none" />

            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  Koniec Sezonu & Czysty Start
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <FolderArchive className="w-6 h-6 text-amber-400" />
                Zakończ i Zarchiwizuj Bieżący Sezon
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Funkcja pozwala zamknąć bieżący etap rozgrywek. Wszystkie mecze, wyniki ligowe, dziennik obecności na treningach, składki oraz bilans skarbca zostaną bezpiecznie zapisane w <strong className="text-amber-300">niezmiennym archiwum z pełnym wglądem historycznym</strong>. Bieżący system zostanie wyczyszczony do stanu zerowego na nowy sezon.
              </p>

              {/* Security guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase">
                    <Check className="w-4 h-4" />
                    Konta i Logowanie
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Konta zawodników, hasła, numery i uprawnienia pozostają aktywne bez konieczności ponownej rejestracji.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-400 text-xs font-black uppercase">
                    <History className="w-4 h-4" />
                    Pełny Podgląd Danych
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Zawsze możesz otworzyć dowolny zarchiwizowany sezon i przejrzeć jego statystyki, mecze i obecności.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase">
                    <RotateCcw className="w-4 h-4" />
                    Czysty Nowy Sezon
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Nowy terminarz, nowa tabela ligowa i nowe składki rozpoczynają się z czystą kartą.
                  </p>
                </div>
              </div>

              {/* Form Input */}
              {isArchiveMode ? (
                <div className="pt-4 border-t border-slate-800 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-amber-300 text-xs font-bold">
                    <FolderArchive className="w-5 h-5 shrink-0 text-amber-400" />
                    <span>Przeglądasz zarchiwizowany sezon. Archiwizowanie archiwum jest wyłączone — aby zakończyć obecny sezon, wróć do trybu bieżącego.</span>
                  </div>
                  <button
                    type="button"
                    onClick={exitArchiveMode}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shrink-0 transition"
                  >
                    Wróć do obecnego sezonu
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nazwa archiwizowanego sezonu
                    </label>
                    <input
                      type="text"
                      value={seasonNameInput}
                      onChange={e => setSeasonNameInput(e.target.value)}
                      placeholder="np. Sezon 2024/2025 (Jesień/Zima)"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!seasonNameInput.trim()) {
                        alert('Wpisz nazwę sezonu przed archiwizacją.');
                        return;
                      }
                      setShowArchiveConfirm(true);
                    }}
                    className="sm:self-end px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>Zakończ i Zarchiwizuj Sezon</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* List of Archived Seasons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-wide flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  Zarchiwizowane Sezony Angels ZTP
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lista zamkniętych sezonów z zachowaną pełną historią meczów, frekwencji i rozliczeń.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-400">
                Liczba archiwów: <strong className="text-white">{seasons.length}</strong>
              </span>
            </div>

            {loadingSeasons ? (
              <div className="p-8 text-center text-xs text-slate-500">Ładowanie archiwum sezonów...</div>
            ) : seasons.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#0b0e14] border border-slate-800 text-center space-y-2">
                <FolderArchive className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Brak zarchiwizowanych sezonów</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Obecnie pracujesz na aktywnym sezonie. Gdy nadejdzie moment zakończenia rozgrywek, użyj formularza powyżej, aby utworzyć pierwsze archiwum.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasons.map((s: any) => {
                  const isActiveViewing = isArchiveMode && activeArchiveId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`p-5 rounded-3xl transition shadow-xl space-y-4 flex flex-col justify-between ${
                        isActiveViewing
                          ? 'bg-amber-950/25 border-2 border-amber-500/80 glow-gold shadow-amber-500/10'
                          : 'bg-[#0b0e14] border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              Zarchiwizowano
                            </span>
                            {isActiveViewing && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
                                ● Aktywny podgląd
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(s.archivedAt).toLocaleDateString('pl-PL', { dateStyle: 'long' })}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                          <span>{s.name}</span>
                          {s.summary?.leagueStanding && (
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              🏆 {s.summary.leagueStanding}
                            </span>
                          )}
                        </h4>

                        <p className="text-xs text-slate-400">
                          Zarchiwizowane przez: <strong className="text-slate-300">{s.archivedByName}</strong>
                        </p>

                        {/* Top performers badge if available */}
                        {(s.summary?.mvpLeader || s.summary?.topScorer) && (
                          <div className="flex items-center gap-2 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                            {s.summary?.topScorer && <span>⚡ Armata: <strong>{s.summary.topScorer}</strong></span>}
                            {s.summary?.mvpLeader && <span>⭐ MVP: <strong>{s.summary.mvpLeader}</strong></span>}
                          </div>
                        )}

                        {/* Stat pills */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-center">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Mecze</span>
                            <span className="text-sm font-black text-amber-400 font-mono">
                              {s.summary?.totalMatches || 0}
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              ({s.summary?.matchesWon || 0}W - {s.summary?.matchesLost || 0}L)
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-center">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Jednostki</span>
                            <span className="text-sm font-black text-sky-400 font-mono">
                              {s.summary?.totalEvents || 0}
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              ~{s.summary?.averageAttendance || 0}% frekw.
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-center">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Składki</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              {s.summary?.totalFeesCollected || 0} zł
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              {s.summary?.totalPlayers || 0} w kadrze
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        {/* Live Browse in Entire App Button */}
                        {isActiveViewing ? (
                          <button
                            onClick={exitArchiveMode}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                          >
                            <span>✕ Zakończ podgląd (Wróć do bieżącego sezonu)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => enterArchiveMode(s.id)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 font-athletic"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Przeglądaj cały serwis w tym sezonie &rarr;</span>
                          </button>
                        )}

                        {/* Secondary utility actions */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleViewArchive(s.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5"
                              title="Szybki podgląd w oknie popup"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-400" />
                              <span>Szczegóły</span>
                            </button>

                            <button
                              onClick={() => setShowRestoreConfirm(s.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
                              title="Przywróć dane tego sezonu do bieżącego sezonu roboczego"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                              <span className="hidden sm:inline">Przywróć</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/api/admin/seasons/${s.id}`}
                              download={`${s.name.replace(/\s+/g, '_')}_archive.json`}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1"
                              title="Pobierz archiwum w formacie JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>JSON</span>
                            </a>

                            <button
                              onClick={() => handleDeleteSeason(s.id)}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-500 hover:text-rose-400 transition"
                              title="Usuń to archiwum"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: ARCHIVE SEASON */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-amber-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400 pb-3 border-b border-slate-800">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black uppercase text-white">
                Potwierdzenie Zakończenia Sezonu
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Czy na pewno chcesz zakończyć sezon <strong className="text-amber-300">&quot;{seasonNameInput}&quot;</strong>?
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                ⚠️ Co się stanie po zatwierdzeniu:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>Aktualne mecze, terminarz i składki zostaną przeniesione do archiwum.</li>
                <li>Panel aplikacji rozpocznie czysty, nowy sezon z zerowymi licznikami.</li>
                <li><strong>Konta wszystkich zawodników i uprawnienia pozostaną nienaruszone.</strong></li>
                <li>Będziesz mógł w każdej chwili przejrzeć zarchiwizowane dane.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={archiving}
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={archiving}
                onClick={handleArchiveSeason}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                {archiving ? 'Archiwizowanie...' : 'Tak, zarchiwizuj i zresetuj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESTORE SEASON */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-amber-500/40 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400 pb-3 border-b border-slate-800">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black uppercase text-white">
                Przywrócenie Danych Sezonu
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Czy na pewno chcesz przywrócić dane z tego sezonu jako bieżący sezon roboczy?
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                ⚠️ Informacja o przywróceniu:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>Bieżące mecze, terminarz i składki zostaną zastąpione stanem z tego zarchiwizowanego sezonu.</li>
                <li>Archiwum pozostanie bezpieczne na liście sezonów.</li>
                <li>Po przywróceniu będziesz mógł normalnie edytować i zarządzać danymi.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={restoring}
                onClick={() => setShowRestoreConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={() => handleRestoreSeason(showRestoreConfirm)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                {restoring ? 'Przywracanie...' : 'Tak, przywróć dane do obecnego sezonu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE & MONGODB ATLAS */}
      {adminTab === 'database' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Header Card */}
          <div className="bg-[#0b0e14] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-steel-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-athletic text-white uppercase tracking-wider">
                      Magazyn Danych & Chmura MongoDB
                    </h2>
                    {loadingMongoStatus ? (
                      <span className="text-xs text-steel-500 font-mono">Sprawdzanie...</span>
                    ) : mongoStatus?.connected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Chmura Aktywna (Atlas)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        Lokalny plik JSON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-steel-400 mt-1">
                    Aktualny silnik: <strong className="text-white">{mongoStatus?.mode || 'Lokalny plik JSON (data/db.json)'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={fetchMongoStatus}
                  disabled={loadingMongoStatus}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-steel-700 text-xs font-bold text-steel-300 hover:text-white transition flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-steel-400 ${loadingMongoStatus ? 'animate-spin' : ''}`} />
                  <span>Odśwież status</span>
                </button>

                {mongoStatus?.configured && (
                  <>
                    <button
                      type="button"
                      disabled={syncingMongo}
                      onClick={() => handleMongoAction('PUSH_LOCAL_TO_MONGO')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{syncingMongo ? 'Wysyłanie...' : 'Wyślij db.json do Atlasa'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={syncingMongo}
                      onClick={() => handleMongoAction('PULL_MONGO_TO_LOCAL')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-steel-200 border border-steel-700 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>{syncingMongo ? 'Pobieranie...' : 'Pobierz z Atlasa do db.json'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Informacje o bazie w chmurze */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-steel-800">
                <span className="text-[10px] uppercase font-bold text-steel-500 block">Status połączenia</span>
                <span className={`text-sm font-black font-mono mt-0.5 block ${mongoStatus?.connected ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {mongoStatus?.connected ? '✓ POŁĄCZONO' : 'Tryb lokalny'}
                </span>
                <span className="text-[11px] text-steel-400 mt-0.5 block">
                  {mongoStatus?.connected ? `Baza: ${mongoStatus.databaseName}` : 'Plik: data/db.json'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-steel-800">
                <span className="text-[10px] uppercase font-bold text-steel-500 block">Zsynchronizowane kolekcje</span>
                <span className="text-sm font-black font-mono text-white mt-0.5 block">
                  {mongoStatus?.stats?.usersCount ? `${mongoStatus.stats.usersCount} zawodników` : 'Kompletna baza'}
                </span>
                <span className="text-[11px] text-steel-400 mt-0.5 block">
                  Mecze, terminarz, składki, taktyka
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-steel-800">
                <span className="text-[10px] uppercase font-bold text-steel-500 block">Architektura hostingu</span>
                <span className="text-sm font-black font-mono text-amber-400 mt-0.5 block">
                  Vercel Serverless
                </span>
                <span className="text-[11px] text-steel-400 mt-0.5 block">
                  100% zgodne z chmurą Vercel
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-steel-800">
                <span className="text-[10px] uppercase font-bold text-steel-500 block">Bezpieczeństwo & Backup</span>
                <span className="text-sm font-black font-mono text-purple-400 mt-0.5 block">
                  Automatyczny
                </span>
                <span className="text-[11px] text-steel-400 mt-0.5 block">
                  Auto-seed przy 1. starcie
                </span>
              </div>
            </div>

            {mongoStatus?.error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mongoStatus.error}</span>
              </div>
            )}
          </div>

          {/* Poradnik integracji */}
          <div className="bg-[#0b0e14] border border-steel-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-steel-800">
              <Cloud className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Jak podpiąć MongoDB Atlas (Darmowy Cluster M0)
              </h3>
            </div>

            <p className="text-xs text-steel-300 leading-relaxed">
              Dzięki temu cała drużyna ma dostęp do aktualnych meczów, składek i obecności w sieci, a dane nigdy nie znikną przy restartach serwera:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-steel-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">1</span>
                  <span>Kroki w MongoDB Atlas:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-steel-300 pl-1 leading-relaxed">
                  <li>Zaloguj się na <strong className="text-white">mongodb.com/atlas</strong> i wybierz darmowy klaster <em>M0 (Free)</em>.</li>
                  <li>W zakładce <strong className="text-white">Database Access</strong> stwórz użytkownika (np. <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">angels_admin</code>) i ustaw hasło.</li>
                  <li>W zakładce <strong className="text-white">Network Access</strong> kliknij <em>Add IP Address</em> &rarr; wybierz <em>Allow Access from Anywhere</em> (<code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">0.0.0.0/0</code>).</li>
                  <li>Kliknij <strong className="text-white">Connect &rarr; Drivers (Node.js)</strong> i skopiuj link połączenia (np. <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 break-all">mongodb+srv://...</code>).</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-steel-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">2</span>
                  <span>Podpięcie do aplikacji:</span>
                </div>
                <div className="space-y-2 text-steel-300 leading-relaxed">
                  <p>
                    W pliku <strong className="text-white">.env</strong> (lub w panelu Vercel w <em>Settings &rarr; Environment Variables</em>) wklej skopiowany link jako zmienną:
                  </p>
                  <pre className="p-3 rounded-xl bg-black border border-steel-800 text-[11px] font-mono text-emerald-300 overflow-x-auto select-all">
                    MONGODB_URI=mongodb+srv://user:haslo@cluster0.xxx.mongodb.net/angels_ztp?retryWrites=true&w=majority
                  </pre>
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Gotowe! Przy pierwszym uruchomieniu system sam automatycznie wyśle wszystkich 11 zawodników, fazy LALS i mecze z pliku do klastra Atlas.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW ARCHIVED SEASON DATA */}
      {selectedArchive && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    📜 Archiwum Historyczne
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedArchive.archivedAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {selectedArchive.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const id = selectedArchive.id;
                    setSelectedArchive(null);
                    enterArchiveMode(id);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5 font-athletic"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Otwórz cały serwis w tym sezonie &rarr;</span>
                </button>

                <button
                  onClick={() => setSelectedArchive(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-tabs in modal */}
            <div className="flex border-b border-slate-800 gap-2 shrink-0 overflow-x-auto scrollbar-none">
              {[
                { id: 'roster', label: `Kadra (${selectedArchive.snapshot.rosterSnapshot?.length || 0})` },
                { id: 'matches', label: `Mecze (${selectedArchive.snapshot.matches?.length || 0})` },
                { id: 'events', label: `Jednostki (${selectedArchive.snapshot.events?.length || 0})` },
                { id: 'fees', label: `Składki (${selectedArchive.snapshot.fees?.length || 0})` },
                { id: 'tactics', label: `Taktyka (${selectedArchive.snapshot.tactics?.length || 0})` },
                { id: 'photos', label: `Zdjęcia (${selectedArchive.snapshot.leaguePhotos?.length || 0})` },
                { id: 'announcements', label: `Komunikaty (${selectedArchive.snapshot.announcements?.length || 0})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setArchiveDetailTab(t.id as any)}
                  className={`pb-2.5 px-3 text-xs font-bold uppercase transition border-b-2 whitespace-nowrap ${
                    archiveDetailTab === t.id
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content per sub-tab */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {archiveDetailTab === 'roster' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(selectedArchive.snapshot.rosterSnapshot || []).map(p => (
                    <div key={p.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-sky-400 text-xs">
                          {p.number ? `#${p.number}` : '🏐'}
                        </span>
                        <div>
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.position || 'Zawodnik'}</div>
                        </div>
                      </div>
                      {p.stats && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
                          <span>Mecze: {p.stats.matchesPlayed || 0}</span>
                          <span>Punkty: {p.stats.totalPoints || 0}</span>
                          <span>MVP: {p.stats.mvpCount || 0}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {archiveDetailTab === 'matches' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.matches || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak zarejestrowanych meczów w tym sezonie.</div>
                  ) : (
                    (selectedArchive.snapshot.matches || []).map(m => {
                      const won = m.teamSetsWon > m.opponentSetsWon;
                      return (
                        <div key={m.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-xs">{m.opponent}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(m.date).toLocaleDateString('pl-PL')} • {m.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              won ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {won ? 'Wygrana' : 'Porażka'}
                            </span>
                            <span className="font-mono font-bold text-sm text-white">
                              {m.teamSetsWon} : {m.opponentSetsWon}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {archiveDetailTab === 'events' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.events || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak zarejestrowanych jednostek.</div>
                  ) : (
                    (selectedArchive.snapshot.events || []).map(e => (
                      <div key={e.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="text-[10px] text-amber-400 font-mono">[{e.type}]</span>
                            <span>{e.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(e.date).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })} • {e.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            {e.attendees?.filter(a => a.status === 'BEDE').length || e.actualAttendees?.length || 0} obecnych
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {archiveDetailTab === 'fees' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.fees || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak zarejestrowanych składek w tym sezonie.</div>
                  ) : (
                    (selectedArchive.snapshot.fees || []).map(f => {
                      const payments = (selectedArchive.snapshot.payments || []).filter(p => p.feeId === f.id);
                      const paidCount = payments.filter(p => p.status === 'OPLACONE').length;
                      return (
                        <div key={f.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-xs">{f.title}</div>
                            <div className="text-[10px] text-slate-400">
                              Kwota: {f.amount} zł • Termin: {f.dueDate}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-white">
                              {paidCount} / {payments.length} opłaconych
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {archiveDetailTab === 'tactics' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.tactics || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak zapisanych rozrysowań taktycznych w archiwum tego sezonu.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedArchive.snapshot.tactics || []).map(t => (
                        <div key={t.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/10 text-sky-300 border border-sky-500/30">
                              {t.rotation} • {t.phase}
                            </span>
                            <span className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleDateString('pl-PL')}</span>
                          </div>
                          <h4 className="font-bold text-white text-xs">{t.title}</h4>
                          {t.description && <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {archiveDetailTab === 'photos' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.leaguePhotos || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak zdjęć w galerii tego sezonu.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {(selectedArchive.snapshot.leaguePhotos || []).map(p => (
                        <div key={p.id} className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group relative aspect-[4/3]">
                          <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                            <span className="text-[10px] font-bold text-white truncate">{p.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {archiveDetailTab === 'announcements' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.announcements || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak komunikatów z tego sezonu.</div>
                  ) : (
                    (selectedArchive.snapshot.announcements || []).map(a => (
                      <div key={a.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{a.title}</span>
                          <span className="text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleDateString('pl-PL')}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{a.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const id = selectedArchive.id;
                  setSelectedArchive(null);
                  enterArchiveMode(id);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Przeglądaj na normalnej stronie</span>
              </button>

              <button
                onClick={() => setSelectedArchive(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Zamknij podgląd
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCenterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-steel-400">Ładowanie Centrum Administracji...</div>}>
      <AdminCenterContent />
    </Suspense>
  );
}
