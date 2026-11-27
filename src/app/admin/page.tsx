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
  AlertCircle,
  FileText,
  Printer
} from 'lucide-react';
import { User, Role, UserPermissions, SeasonArchive } from '@/lib/types';

function AdminCenterContent() {
  const { user: currentUser, loading: authLoading } = useAuth();
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

  // Backups state
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

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

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      const res = await fetch('/api/admin/backup');
      if (res.ok) {
        const data = await res.json();
        setBackupsList(data.backups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    const label = prompt('Podaj krótki opis tego punktu przywracania (np. przed_importem_rundy_11):', 'kopia_bezpieczenstwa');
    if (label === null) return;
    setCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', label })
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Kopia zapasowa została pomyślnie utworzona!');
        await fetchBackups();
      } else {
        alert(d.error || 'Błąd tworzenia kopii');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas tworzenia kopii');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`UWAGA: Czy na pewno chcesz przywrócić bazę danych z pliku "${filename}"? Aktualny stan bazy zostanie automatycznie zabezpieczony w osobnym pliku.`)) {
      return;
    }
    setRestoringBackup(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', filename })
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Baza została pomyślnie przywrócona!');
        window.location.reload();
      } else {
        alert(d.error || 'Błąd przywracania kopii');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd podczas przywracania bazy');
    } finally {
      setRestoringBackup(false);
    }
  };

  const handleUploadFileBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!confirm(`Czy na pewno chcesz wgrać i nadpisać obecną bazę danych danymi z pliku "${file.name}"? Przed nadpisaniem system utworzy automatyczną kopię bezpieczeństwa.`)) {
          return;
        }
        setRestoringBackup(true);
        const res = await fetch('/api/admin/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'UPLOAD_RESTORE', databasePayload: parsed })
        });
        const d = await res.json();
        if (res.ok) {
          alert(d.message || 'Baza danych została pomyślnie przywrócona z pliku!');
          window.location.reload();
        } else {
          alert(d.error || 'Błąd wgrywania pliku');
        }
      } catch (err) {
        alert('Nieprawidłowy plik JSON lub błąd odczytu');
      } finally {
        setRestoringBackup(false);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchUsers();
    fetchSeasons();
    fetchMongoStatus();
    fetchBackups();
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
        <p className="text-sm font-athletic text-slate-500 uppercase tracking-widest animate-pulse">
          Weryfikacja uprawnień administracyjnych...
        </p>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 font-athletic">
              Brak uprawnień
            </h2>
            <p className="text-xs text-slate-500">
              Dostęp tylko dla ról Kierownik, Trener lub Administrator.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                {currentUser ? currentUser.name : 'Niezalogowany'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {currentUser?.role || 'BRAK'}
              </span>
            </div>
            {currentUser?.email && (
              <span className="text-slate-500 font-mono text-[11px] block">{currentUser.email}</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-1 text-xs">
            <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
              Logowanie
            </a>
            <span className="text-slate-300">•</span>
            <a href="/" className="text-slate-500 hover:text-slate-900 underline">
              Pulpit
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
      label: 'Mecze',
      description: 'Wyniki, sety, MVP ligi',
      icon: Volleyball,
      color: 'text-sky-600'
    },
    {
      key: 'canManageEvents',
      label: 'Terminarz',
      description: 'Sparingi, treningi, składy',
      icon: Calendar,
      color: 'text-amber-600'
    },
    {
      key: 'canManageStats',
      label: 'Statystyki',
      description: 'Import i edycja protokołów',
      icon: BarChart3,
      color: 'text-emerald-600'
    },
    {
      key: 'canManageTactics',
      label: 'Taktyka',
      description: 'Tablica boiskowa, playbook, scouting',
      icon: Target,
      color: 'text-indigo-600'
    },
    {
      key: 'canManageFees',
      label: 'Składki',
      description: 'Weryfikacja wpłat i bilans',
      icon: CreditCard,
      color: 'text-amber-600'
    },
    {
      key: 'canPostAnnouncements',
      label: 'Komunikaty',
      description: 'Ogłoszenia zespołu',
      icon: Megaphone,
      color: 'text-rose-600'
    },
    {
      key: 'canCreatePolls',
      label: 'Ankiety',
      description: 'Głosowania składu',
      icon: Vote,
      color: 'text-purple-600'
    },
    {
      key: 'isAdmin',
      label: 'Administrator',
      description: 'Dostęp do panelu uprawnień',
      icon: ShieldAlert,
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-athletic text-slate-900 tracking-wider uppercase">
            Uprawnienia i Role
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500">
            Użytkownicy: <strong className="text-slate-900 font-mono">{users.length}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500">
            Sztab: <strong className="text-indigo-600 font-mono">{users.filter(u => u.role !== 'ZAWODNIK').length}</strong>
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 mb-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setAdminTab('permissions')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            adminTab === 'permissions'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Uprawnienia</span>
        </button>

        <button
          onClick={() => setAdminTab('seasons')}
          className={`pb-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            adminTab === 'seasons'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>Sezony</span>
          {seasons.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-mono border border-amber-200">
              {seasons.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setAdminTab('database');
            fetchMongoStatus();
          }}
          className={`pb-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            adminTab === 'database'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Baza i kopie</span>
          {mongoStatus?.connected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* TAB 1: PERMISSIONS */}
      {adminTab === 'permissions' && (
        <>
          {isArchiveMode && (
            <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FolderArchive className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">Tryb archiwalny — edycja uprawnień zablokowana.</span>
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
          <div className="angel-card rounded-2xl p-3 mb-6 border border-slate-200 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Filtry</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setRoleFilter('ALL');
                  setSearch('');
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-400 transition underline underline-offset-2 ml-1"
              >
                Wyczyść filtry
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Szukaj po nazwisku lub e-mailu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-steel-600 focus:outline-none focus:border-steel-400 transition"
            />
          </div>
        </div>

        {showFilters && (
          <div className="pt-3 mt-3 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Rola:</span>
            {['ALL', 'KIEROWNIK', 'TRENER', 'ZAWODNIK'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-athletic transition whitespace-nowrap ${
                  roleFilter === role
                    ? 'bg-steel-600 text-slate-800 border border-steel-500 shadow'
                    : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {role === 'ALL' ? 'Wszyscy' : role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Users Permissions Matrix Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="angel-card rounded-2xl p-10 text-center text-slate-500 text-sm">
            Wczytywanie...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="angel-card rounded-2xl p-10 text-center text-slate-500 text-sm">
            Brak wyników
          </div>
        ) : (
          paginatedUsers.map((member) => {
            const isTargetKierownik = member.role === 'KIEROWNIK';
            const userPerms = member.permissions || {};

            return (
              <div
                key={member.id}
                className="angel-card rounded-2xl p-4 sm:p-5 shadow-sm relative border border-slate-200 hover:border-slate-300 transition"
              >
                {/* User Info Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-athletic text-slate-800 text-base shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-athletic text-slate-900">{member.name}</h3>
                        {member.number && (
                          <span className="bg-slate-100 text-slate-700 text-[11px] px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200">
                            #{member.number}
                          </span>
                        )}
                        {member.position && (
                          <span className="text-xs text-slate-500">{member.position}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {member.email} · {member.phone || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Role Selector & Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {(['KIEROWNIK', 'TRENER', 'ZAWODNIK'] as Role[]).map((r) => (
                        <button
                          key={r}
                          disabled={isArchiveMode}
                          onClick={() => handleRoleChange(member.id, r)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            member.role === r
                              ? r === 'KIEROWNIK'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                : r === 'TRENER'
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'bg-slate-800 text-white font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isArchiveMode}
                        onClick={() => applyPreset(member.id, 'CAPTAIN')}
                        className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Uprawnienia kapitana"
                      >
                        Kapitan
                      </button>
                      <button
                        disabled={isArchiveMode}
                        onClick={() => applyPreset(member.id, 'ASSISTANT')}
                        className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Uprawnienia asystenta"
                      >
                        Asystent
                      </button>
                    </div>

                    <button
                      onClick={() => handleSaveUserPermissions(member)}
                      disabled={savingId === member.id || isArchiveMode}
                      className="h-8 px-3.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingId === member.id ? 'Zapis...' : 'Zapisz'}
                    </button>
                  </div>
                </div>

                {/* Compact Permissions Toggle Grid */}
                <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERMISSION_CONFIG.map((cfg) => {
                    const Icon = cfg.icon;
                    const isGranted = isTargetKierownik ? true : Boolean(userPerms[cfg.key]);

                    return (
                      <button
                        type="button"
                        key={cfg.key}
                        title={cfg.description}
                        disabled={isTargetKierownik || isArchiveMode}
                        onClick={() => {
                          if (!isTargetKierownik && !isArchiveMode) {
                            handleTogglePermission(member.id, cfg.key);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl border transition flex items-center justify-between gap-2 text-left ${
                          isGranted
                            ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        } ${isTargetKierownik || isArchiveMode ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isGranted ? cfg.color : 'text-slate-400'}`} />
                          <span className="text-xs font-bold truncate">{cfg.label}</span>
                        </div>

                        <div className={`w-7 h-4 rounded-full p-0.5 transition-colors shrink-0 ${
                          isGranted ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                            isGranted ? 'translate-x-3' : 'translate-x-0'
                          }`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Users Pagination Bar */}
        {totalUsersPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 angel-card border border-slate-200 rounded-2xl">
            <span className="text-xs text-slate-500 font-medium">
              <span className="text-slate-900 font-bold">{((usersPage - 1) * USERS_PER_PAGE) + 1}</span>–<span className="text-slate-900 font-bold">{Math.min(usersPage * USERS_PER_PAGE, filteredUsers.length)}</span> z <span className="text-slate-900 font-bold">{filteredUsers.length}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                disabled={usersPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                disabled={usersPage === totalUsersPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
        <div className="space-y-6">
          {/* Action Card: Zakończ i Zarchiwizuj Sezon */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-athletic">
              <FolderArchive className="w-5 h-5 text-amber-500" />
              Zakończ i zarchiwizuj sezon
            </h2>

            {isArchiveMode ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                  <FolderArchive className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Przeglądasz archiwum — wróć do bieżącego sezonu, aby zarchiwizować.</span>
                </div>
                <button
                  type="button"
                  onClick={exitArchiveMode}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shrink-0 transition"
                >
                  Wróć do obecnego
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nazwa sezonu
                  </label>
                  <input
                    type="text"
                    value={seasonNameInput}
                    onChange={e => setSeasonNameInput(e.target.value)}
                    placeholder="np. Sezon 2025/2026"
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <a
                    href="/admin/raport-sezonu?id=current"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Raport PDF</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (!seasonNameInput.trim()) {
                        alert('Wpisz nazwę sezonu przed archiwizacją.');
                        return;
                      }
                      setShowArchiveConfirm(true);
                    }}
                    className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>Archiwizuj sezon</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List of Archived Seasons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide flex items-center gap-2 font-athletic">
                <History className="w-5 h-5 text-indigo-600" />
                Zarchiwizowane sezony
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Archiwa: <strong className="text-slate-900">{seasons.length}</strong>
              </span>
            </div>

            {loadingSeasons ? (
              <div className="p-8 text-center text-xs text-slate-500">Ładowanie...</div>
            ) : seasons.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-1.5">
                <FolderArchive className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Brak zarchiwizowanych sezonów</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasons.map((s: any) => {
                  const isActiveViewing = isArchiveMode && activeArchiveId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`p-5 rounded-2xl transition shadow-sm space-y-4 flex flex-col justify-between ${
                        isActiveViewing
                          ? 'bg-amber-50/40 border-2 border-amber-500'
                          : 'bg-white border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Archiwum
                            </span>
                            {isActiveViewing && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                                Aktywny podgląd
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(s.archivedAt).toLocaleDateString('pl-PL', { dateStyle: 'medium' })}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <span>{s.name}</span>
                          {s.summary?.leagueStanding && (
                            <span className="text-xs font-bold text-amber-700 font-mono">
                              🏆 {s.summary.leagueStanding}
                            </span>
                          )}
                        </h4>

                        {(s.summary?.mvpLeader || s.summary?.topScorer) && (
                          <div className="flex items-center gap-3 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl">
                            {s.summary?.topScorer && <span>Punktujący: <strong>{s.summary.topScorer}</strong></span>}
                            {s.summary?.mvpLeader && <span>MVP: <strong>{s.summary.mvpLeader}</strong></span>}
                          </div>
                        )}

                        {/* Stat pills */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">Mecze</span>
                            <span className="text-sm font-black text-slate-900 font-mono">
                              {s.summary?.totalMatches || 0}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {s.summary?.matchesWon || 0}W - {s.summary?.matchesLost || 0}L
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">Jednostki</span>
                            <span className="text-sm font-black text-indigo-600 font-mono">
                              {s.summary?.totalEvents || 0}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              ~{s.summary?.averageAttendance || 0}%
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">Składki</span>
                            <span className="text-sm font-black text-emerald-600 font-mono">
                              {s.summary?.totalFeesCollected || 0} zł
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {s.summary?.totalPlayers || 0} os.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        {isActiveViewing ? (
                          <button
                            onClick={exitArchiveMode}
                            className="w-full h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2"
                          >
                            <span>✕ Zakończ podgląd</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => enterArchiveMode(s.id)}
                            className="w-full h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Przeglądaj sezon</span>
                          </button>
                        )}

                        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleViewArchive(s.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Szczegóły</span>
                            </button>

                            <button
                              onClick={() => setShowRestoreConfirm(s.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-800 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Przywróć</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/admin/raport-sezonu?id=${s.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>

                            <a
                              href={`/api/admin/seasons/${s.id}`}
                              download={`${s.name.replace(/\s+/g, '_')}_archive.json`}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>JSON</span>
                            </a>

                            <button
                              onClick={() => handleDeleteSeason(s.id)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition"
                              title="Usuń archiwum"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 pb-3 border-b border-slate-200">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-black uppercase text-slate-900">
                Zarchiwizować sezon?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sezon <strong className="text-slate-900">&quot;{seasonNameInput}&quot;</strong> zostanie zapisany w archiwum, a bieżące mecze, terminarz i składki zostaną wyzerowane. Konta i uprawnienia pozostaną bez zmian.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={archiving}
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={archiving}
                onClick={handleArchiveSeason}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                {archiving ? 'Archiwizowanie...' : 'Zarchiwizuj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESTORE SEASON */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 pb-3 border-b border-slate-200">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-black uppercase text-slate-900">
                Przywrócić sezon?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bieżące mecze, terminarz i składki zostaną zastąpione danymi z wybranego archiwum.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={restoring}
                onClick={() => setShowRestoreConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={() => handleRestoreSeason(showRestoreConfirm)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                {restoring ? 'Przywracanie...' : 'Przywróć'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE & BACKUPS */}
      {adminTab === 'database' && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-athletic text-slate-900 uppercase tracking-wider">
                      Baza danych
                    </h2>
                    {loadingMongoStatus ? (
                      <span className="text-xs text-slate-400 font-mono">Sprawdzanie...</span>
                    ) : mongoStatus?.connected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        MongoDB Atlas
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
                        Lokalny JSON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mongoStatus?.connected ? `Baza: ${mongoStatus.databaseName}` : (mongoStatus?.mode || 'data/db.json')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={fetchMongoStatus}
                  disabled={loadingMongoStatus}
                  className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMongoStatus ? 'animate-spin' : ''}`} />
                  <span>Odśwież</span>
                </button>

                {mongoStatus?.configured && (
                  <>
                    <button
                      type="button"
                      disabled={syncingMongo}
                      onClick={() => handleMongoAction('PUSH_LOCAL_TO_MONGO')}
                      className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{syncingMongo ? 'Wysyłanie...' : 'Wyślij do chmury'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={syncingMongo}
                      onClick={() => handleMongoAction('PULL_MONGO_TO_LOCAL')}
                      className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{syncingMongo ? 'Pobieranie...' : 'Pobierz z chmury'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {mongoStatus?.error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mongoStatus.error}</span>
              </div>
            )}
          </div>

          {/* Backups Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight font-athletic">
                  Kopia zapasowa (JSON)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Eksport i import pełnej bazy klubu (działa lokalnie i z MongoDB Atlas).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/api/admin/backup?download=true"
                  className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz JSON</span>
                </a>

                <label className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>{restoringBackup ? 'Wgrywanie...' : 'Wczytaj plik'}</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleUploadFileBackup}
                    disabled={restoringBackup}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW ARCHIVED SEASON DATA */}
      {selectedArchive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Archiwum
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedArchive.archivedAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
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
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Przeglądaj sezon</span>
                </button>

                <button
                  onClick={() => setSelectedArchive(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-tabs in modal */}
            <div className="flex border-b border-slate-200 gap-2 shrink-0 overflow-x-auto scrollbar-none">
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
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content per sub-tab */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {archiveDetailTab === 'roster' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(selectedArchive.snapshot.rosterSnapshot || []).map(p => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-indigo-600 text-xs">
                          {p.number ? `#${p.number}` : '🏐'}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.position || 'Zawodnik'}</div>
                        </div>
                      </div>
                      {p.stats && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                          <span>Mecze: {p.stats.matchesPlayed || 0}</span>
                          <span>Pkt: {p.stats.totalPoints || 0}</span>
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
                    <div className="p-4 text-center text-slate-500">Brak meczów.</div>
                  ) : (
                    (selectedArchive.snapshot.matches || []).map(m => {
                      const won = m.teamSetsWon > m.opponentSetsWon;
                      return (
                        <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{m.opponent}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(m.date).toLocaleDateString('pl-PL')} • {m.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              won ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {won ? 'Wygrana' : 'Porażka'}
                            </span>
                            <span className="font-mono font-bold text-sm text-slate-900">
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
                    <div className="p-4 text-center text-slate-500">Brak jednostek.</div>
                  ) : (
                    (selectedArchive.snapshot.events || []).map(e => (
                      <div key={e.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="text-[10px] text-amber-700 font-mono">[{e.type}]</span>
                            <span>{e.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(e.date).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })} • {e.location}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 font-bold">
                          {e.attendees?.filter(a => a.status === 'BEDE').length || e.actualAttendees?.length || 0} obecnych
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {archiveDetailTab === 'fees' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.fees || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak składek.</div>
                  ) : (
                    (selectedArchive.snapshot.fees || []).map(f => {
                      const payments = (selectedArchive.snapshot.payments || []).filter(p => p.feeId === f.id);
                      const paidCount = payments.filter(p => p.status === 'OPLACONE').length;
                      return (
                        <div key={f.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{f.title}</div>
                            <div className="text-[10px] text-slate-500">
                              {f.amount} zł • Termin: {f.dueDate}
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {paidCount} / {payments.length}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {archiveDetailTab === 'tactics' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.tactics || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak taktyk.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(selectedArchive.snapshot.tactics || []).map(t => (
                        <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-50 text-sky-800 border border-sky-200">
                              {t.rotation} • {t.phase}
                            </span>
                            <span className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleDateString('pl-PL')}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs">{t.title}</h4>
                          {t.description && <p className="text-[11px] text-slate-600 line-clamp-2">{t.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {archiveDetailTab === 'photos' && (
                <div className="space-y-2">
                  {(selectedArchive.snapshot.leaguePhotos || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500">Brak zdjęć.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {(selectedArchive.snapshot.leaguePhotos || []).map(p => (
                        <div key={p.id} className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group relative aspect-[4/3]">
                          <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
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
                    <div className="p-4 text-center text-slate-500">Brak komunikatów.</div>
                  ) : (
                    (selectedArchive.snapshot.announcements || []).map(a => (
                      <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{a.title}</span>
                          <span className="text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleDateString('pl-PL')}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{a.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedArchive(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                Zamknij
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
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Ładowanie Centrum Administracji...</div>}>
      <AdminCenterContent />
    </Suspense>
  );
}
