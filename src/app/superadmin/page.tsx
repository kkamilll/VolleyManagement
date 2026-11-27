'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Users,
  Calendar,
  Trophy,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  ShieldAlert,
  Crown,
  Power,
  X,
  Volleyball,
  RefreshCw,
  Search,
  MapPin,
  KeyRound,
  Activity,
  Megaphone,
  Download,
  Edit3,
  Share2,
  Upload,
  Database,
  Eye,
  UserPlus,
} from 'lucide-react';
import { useClub } from '@/context/ClubContext';
import { CLUB_THEMES, Club, ClubTheme, DEFAULT_CLUB_ID, getClubTheme } from '@/lib/club-types';

interface EnrichedClub extends Club {
  managers?: { name: string; email: string }[];
  members?: { id: string; name: string; email: string; role: string; position?: string; number?: number }[];
  playersCount: number;
  staffCount: number;
  totalUsers: number;
  eventsCount: number;
  matchesCount: number;
  tacticsCount?: number;
  trainingsCount?: number;
  announcementsCount?: number;
  feesCount?: number;
  collectedAmount?: number;
  pendingAmount?: number;
  dbSizeKb?: number;
  lastActivityAt?: string;
  mongoDocId?: string;
}

export default function SuperAdminPage() {
  const { club: activeClub, isSuperAdmin, switchClub, loadingClub } = useClub();
  const [clubs, setClubs] = useState<EnrichedClub[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ mode: string; dbName: string } | null>(null);
  const [detailsClub, setDetailsClub] = useState<EnrichedClub | null>(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [addUserName, setAddUserName] = useState('');
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserPassword, setAddUserPassword] = useState('haslo123');
  const [addUserRole, setAddUserRole] = useState<'ZAWODNIK' | 'TRENER' | 'KIEROWNIK'>('ZAWODNIK');
  const [addUserPosition, setAddUserPosition] = useState('Przyjmujący');
  const [addUserNumber, setAddUserNumber] = useState('');
  const [addUserPhone, setAddUserPhone] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Create client club modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newLeague, setNewLeague] = useState('');
  const [newThemeId, setNewThemeId] = useState<ClubTheme['id']>('navy-gold');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [newOwnerPosition, setNewOwnerPosition] = useState('Zarząd');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Feedback toast banner
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Global Broadcast Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'NORMALNY' | 'WAZNY' | 'PILNY'>('WAZNY');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Edit Club & Reset Password Modal
  const [editingClub, setEditingClub] = useState<EnrichedClub | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLeague, setEditLeague] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editThemeId, setEditThemeId] = useState<ClubTheme['id']>('navy-gold');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Manager Password inside Edit Modal
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resettingPw, setResettingPw] = useState(false);

  const openEditModal = (c: EnrichedClub) => {
    setEditingClub(c);
    setEditName(c.name);
    setEditCity(c.city);
    setEditLeague(c.leagueName);
    setEditLogoUrl(c.logoUrl || '');
    setEditThemeId(c.themeId);
    setResetEmail(c.managers?.[0]?.email || c.ownerEmail || '');
    setResetPassword('');
    setResetConfirmPassword('');
  };

  const handleSaveClubEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: editingClub.id,
          name: editName,
          city: editCity,
          leagueName: editLeague,
          logoUrl: editLogoUrl,
          themeId: editThemeId,
        }),
      });
      if (res.ok) {
        setEditingClub(null);
        await fetchClubs();
        showToast(`Zapisano ustawienia klubu ${editName}.`);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetManagerPassword = async () => {
    if (!editingClub || !resetEmail || resetPassword.length < 6 || resetPassword !== resetConfirmPassword) return;
    setResettingPw(true);
    try {
      const res = await fetch('/api/superadmin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          clubId: editingClub.id,
          email: resetEmail,
          newPassword: resetPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetPassword('');
        setResetConfirmPassword('');
        showToast(data.message || 'Hasło zostało zresetowane.');
      } else {
        showToast(data.error || 'Nie udało się zmienić hasła.');
      }
    } finally {
      setResettingPw(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingBroadcast(true);
    try {
      const res = await fetch('/api/superadmin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BROADCAST',
          title: broadcastTitle,
          content: broadcastContent,
          priority: broadcastPriority,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBroadcastModal(false);
        setBroadcastTitle('');
        setBroadcastContent('');
        showToast(data.message || 'Wysłano komunikat do wszystkich klubów.');
      }
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleCopyWelcomePack = (c: EnrichedClub) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${origin}/login?club=${encodeURIComponent(c.id)}`;
    const registerUrl = `${origin}/register`;
    const text =
      `🏐 Witamy klub ${c.name} w portalu drużynowym!\n` +
      `🔗 Link do logowania: ${loginUrl}\n` +
      `👤 E-mail kierownika: ${c.managers?.[0]?.email || c.ownerEmail}\n` +
      `🔑 Kod zaproszenia dla zawodników: ${c.inviteCode}\n` +
      `📝 Rejestracja zawodników: ${registerUrl}`;
    navigator.clipboard?.writeText(text);
    showToast(`Skopiowano pakiet powitalny dla klubu ${c.name}!`);
  };

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clubs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const nextClubs: EnrichedClub[] = data.clubs || [];
        setClubs(nextClubs);
        if (data.storageInfo) setStorageInfo(data.storageInfo);
        setDetailsClub((prev) => (prev ? nextClubs.find((x) => x.id === prev.id) || null : null));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchClubs();
    }
  }, [isSuperAdmin]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      if (statusFilter === 'ACTIVE' && !c.isActive) return false;
      if (statusFilter === 'SUSPENDED' && c.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.ownerName.toLowerCase().includes(q) ||
          c.ownerEmail.toLowerCase().includes(q) ||
          c.inviteCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [clubs, statusFilter, searchQuery]);

  const handleCreateClubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsClub) return;
    setAddUserError('');
    setAddingUser(true);
    try {
      const res = await fetch('/api/superadmin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_USER',
          clubId: detailsClub.id,
          name: addUserName,
          email: addUserEmail,
          password: addUserPassword,
          role: addUserRole,
          position: addUserPosition,
          number: addUserNumber ? Number(addUserNumber) : undefined,
          phone: addUserPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUserError(data.error || 'Nie udało się dodać użytkownika.');
        return;
      }
      setAddUserName('');
      setAddUserEmail('');
      setAddUserPassword('haslo123');
      setAddUserRole('ZAWODNIK');
      setAddUserPosition('Przyjmujący');
      setAddUserNumber('');
      setAddUserPhone('');
      setShowAddUserForm(false);
      showToast(data.message || 'Dodano użytkownika.');
      await fetchClubs();
    } catch {
      setAddUserError('Błąd połączenia z serwerem.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleCopyInvite = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          city: newCity,
          leagueName: newLeague,
          themeId: newThemeId,
          ownerName: newOwnerName,
          ownerEmail: newOwnerEmail,
          ownerPassword: newOwnerPassword,
          ownerPosition: newOwnerPosition,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Błąd tworzenia klubu');
        return;
      }
      setShowCreateModal(false);
      setNewName('');
      setNewCity('');
      setNewLeague('');
      setNewOwnerName('');
      setNewOwnerEmail('');
      setNewOwnerPassword('');
      setNewOwnerPosition('Zarząd');
      await fetchClubs();
    } catch {
      setCreateError('Błąd połączenia z serwerem');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (club: EnrichedClub) => {
    await fetch('/api/clubs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId: club.id, isActive: !club.isActive }),
    });
    await fetchClubs();
  };

  const handleRegenerateCode = async (clubId: string) => {
    await fetch('/api/clubs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId, regenerateInviteCode: true }),
    });
    await fetchClubs();
  };

  const handleDeleteClub = async (club: EnrichedClub) => {
    if (!confirm(`Czy na pewno usunąć klub "${club.name}" wraz z całą jego bazą danych? Tej operacji nie można cofnąć.`)) {
      return;
    }
    const res = await fetch(`/api/clubs?id=${encodeURIComponent(club.id)}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchClubs();
    }
  };

  if (!loadingClub && !isSuperAdmin) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h1 className="text-xl font-black uppercase text-slate-900">Brak dostępu SuperAdmina</h1>
        <p className="text-sm text-slate-600 max-w-md">
          Ten panel służy do zarządzania wszystkimi klubami klientów na platformie i jest dostępny wyłącznie dla właściciela portalu.
        </p>
        <Link
          href="/"
          className="h-10 px-5 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs uppercase inline-flex items-center gap-2"
        >
          Wróć do swojego klubu
        </Link>
      </div>
    );
  }

  const activeCount = clubs.filter((c) => c.isActive).length;
  const suspendedCount = clubs.length - activeCount;
  const totalPlayers = clubs.reduce((acc, c) => acc + (c.playersCount || 0), 0);
  const totalStaff = clubs.reduce((acc, c) => acc + (c.staffCount || 0), 0);
  const totalUsers = clubs.reduce((acc, c) => acc + (c.totalUsers || 0), 0);
  const totalEvents = clubs.reduce((acc, c) => acc + (c.eventsCount || 0), 0);
  const totalMatches = clubs.reduce((acc, c) => acc + (c.matchesCount || 0), 0);
  const totalTactics = clubs.reduce((acc, c) => acc + (c.tacticsCount || 0), 0);
  const totalTrainings = clubs.reduce((acc, c) => acc + (c.trainingsCount || 0), 0);
  const totalDbKb = Math.round(clubs.reduce((acc, c) => acc + (c.dbSizeKb || 0), 0) * 10) / 10;

  const formatShortDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-24 space-y-6">
      {/* Header & KPI Strip */}
      <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-amber-500 to-emerald-500" />
        <div className="p-5 sm:p-7 space-y-6">
          {/* Top Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-slate-900">
                    Zarządzanie Klubami
                  </h1>
                  {storageInfo && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                      <Database className="w-3 h-3 text-emerald-600" />
                      <span>{storageInfo.mode}: {storageInfo.dbName}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Panel właściciela platformy • podgląd klubów, użytkowników, baz danych i aktywności
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="h-10 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                title="Wyślij ogłoszenie na tablice wszystkich aktywnych klubów"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                <span>Komunikat</span>
              </button>
              <a
                href="/api/superadmin/actions?all=true"
                className="h-10 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                title="Pobierz pełną kopię zapasową całego portalu (.json)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Backup</span>
              </a>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="col-span-2 sm:col-span-1 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nowy Klub</span>
              </button>
            </div>
          </div>

          {/* Integrated High-Contrast KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200/80 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-indigo-700">Kluby</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">{clubs.length}</div>
                <div className="text-[10px] font-semibold text-indigo-700/80 mt-0.5">
                  {activeCount} aktywnych • {suspendedCount} zaw.
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-2xl bg-sky-50/70 border border-sky-200/80 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-sky-700">Użytkownicy</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">{totalUsers}</div>
                <div className="text-[10px] font-semibold text-sky-700/80 mt-0.5">
                  {totalPlayers} zaw. • {totalStaff} sztabu
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Mecze &amp; Wydarzenia</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">{totalMatches + totalEvents}</div>
                <div className="text-[10px] font-semibold text-emerald-700/80 mt-0.5">
                  {totalMatches} meczów • {totalEvents} wyd.
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-800">Baza &amp; Zawartość</div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">{totalDbKb} <span className="text-xs font-bold text-slate-500">KB</span></div>
                <div className="text-[10px] font-semibold text-amber-800/80 mt-0.5">
                  {totalTactics} taktyk • {totalTrainings} tren.
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast feedback */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-amber-300 border border-slate-800 text-xs font-bold flex items-center justify-between gap-2 shadow-md">
          <span>✓ {statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 p-1 h-10 bg-slate-100 border border-slate-200 rounded-xl w-full sm:w-auto">
          {[
            { id: 'ALL', label: `Wszystkie (${clubs.length})` },
            { id: 'ACTIVE', label: `Aktywne (${activeCount})` },
            { id: 'SUSPENDED', label: `Zawieszone (${suspendedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`h-full px-2 sm:px-3.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center whitespace-nowrap cursor-pointer ${statusFilter === tab.id
                ? 'bg-slate-900 text-amber-400 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj klubu, miasta, kodu..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 3. CLUBS COMMAND TABLE (DESKTOP) + CARDS (MOBILE) */}
      {loading ? (
        <div className="p-10 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-3xl">
          Ładowanie listy klubów...
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="p-10 text-center space-y-2 bg-white border border-dashed border-slate-300 rounded-3xl">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Brak klubów pasujących do filtra</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden xl:block bg-white border border-slate-200 rounded-3xl shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <th className="py-3 px-3.5">Klub</th>
                  <th className="py-3 px-2.5">Zarząd Klubu</th>
                  <th className="py-3 px-2.5">Kod Zaproszenia</th>
                  <th className="py-3 px-2.5 text-center">Statystyki</th>
                  <th className="py-3 px-2.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredClubs.map((c) => {
                  const t = getClubTheme(c.themeId);
                  const managersList = c.managers && c.managers.length > 0
                    ? c.managers
                    : [{ name: c.ownerName, email: c.ownerEmail }];
                  return (
                    <tr
                      key={c.id}
                      className={`transition hover:bg-slate-50/80 ${!c.isActive ? 'opacity-60' : ''}`}
                    >
                      {/* Club */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl ${t.badgeBgClass} ${t.badgeTextClass} flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-2xs`}>
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <Volleyball className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-sm uppercase tracking-tight font-athletic text-slate-900 truncate max-w-[180px]">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                              {c.city ? `${c.city} • ` : ''}{c.leagueName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 whitespace-nowrap">
                              ID: {c.id} • {formatShortDate(c.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Club Managers */}
                      <td className="py-3 px-2.5">
                        <div className="space-y-1">
                          {managersList.map((m, idx) => (
                            <div key={idx} className="leading-tight">
                              <div className="font-bold text-slate-900 truncate max-w-[165px]">{m.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[165px]" title={m.email}>{m.email}</div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Invite Code */}
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyInvite(c.inviteCode, c.id)}
                            className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
                            title="Kopiuj kod zaproszenia"
                          >
                            {copiedId === c.id ? (
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500 shrink-0" />
                            )}
                            <span>{c.inviteCode}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegenerateCode(c.id)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition shrink-0"
                            title="Wygeneruj nowy kod"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="inline-flex items-center gap-2 font-mono text-[11px]">
                            <span title="Wszyscy użytkownicy (zawodnicy + sztab)" className="inline-flex items-center gap-1 font-bold text-slate-800">
                              <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>{c.totalUsers}</span>
                            </span>
                            <span title="Wydarzenia" className="inline-flex items-center gap-1 font-bold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{c.eventsCount}</span>
                            </span>
                            <span title="Mecze" className="inline-flex items-center gap-1 font-bold text-slate-800">
                              <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{c.matchesCount}</span>
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {c.dbSizeKb ?? 0} KB • {formatShortDate(c.lastActivityAt)}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {c.isActive ? 'Online' : 'Off'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailsClub(c)}
                            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center cursor-pointer transition"
                            title="Podgląd szczegółów klubu i listy użytkowników"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyWelcomePack(c)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition"
                            title="Kopiuj wiadomość powitalną dla klienta (link + kod)"
                          >
                            <Share2 className="w-3.5 h-3.5 text-sky-600" />
                          </button>
                          <a
                            href={`/api/superadmin/actions?clubId=${encodeURIComponent(c.id)}`}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                            title="Pobierz kopię zapasową bazy tego klubu (.json)"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="h-7 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
                            title="Edytuj klub lub zresetuj hasło kierownika"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Zarządzaj</span>
                          </button>
                          {c.id !== DEFAULT_CLUB_ID && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(c)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition"
                                title={c.isActive ? 'Zawieś klub' : 'Aktywuj klub'}
                              >
                                <Power className={`w-3.5 h-3.5 ${c.isActive ? 'text-emerald-600' : 'text-rose-600'}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClub(c)}
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center cursor-pointer transition"
                                title="Usuń klub"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE / TABLET CARDS */}
          <div className="xl:hidden space-y-3">
            {filteredClubs.map((c) => {
              const t = getClubTheme(c.themeId);
              const isCurrent = activeClub?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`bg-white border rounded-3xl p-4 shadow-xs space-y-3.5 relative overflow-hidden ${isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                    } ${!c.isActive ? 'opacity-65' : ''}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.ribbonClass}`} />

                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl ${t.badgeBgClass} ${t.badgeTextClass} flex items-center justify-center shrink-0 overflow-hidden border border-slate-200`}>
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <Volleyball className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black uppercase font-athletic text-slate-900 truncate">
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {c.leagueName}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${c.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {c.isActive ? 'Online' : 'Off'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-800">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>{c.inviteCode}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyInvite(c.inviteCode, c.id)}
                        className="h-7 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 inline-flex items-center gap-1"
                      >
                        {copiedId === c.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === c.id ? 'Skopiowano' : 'Kopiuj'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegenerateCode(c.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center"
                        title="Nowy kod"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="h-10 px-3 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Zarządzaj</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyWelcomePack(c)}
                      className="h-10 px-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pakiet powitalny</span>
                    </button>
                  </div>

                  {c.id !== DEFAULT_CLUB_ID && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className="h-9 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Power className={`w-3.5 h-3.5 ${c.isActive ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <span>{c.isActive ? 'Zawieś' : 'Aktywuj'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClub(c)}
                        className="h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Usuń klub</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 4. CREATE CLIENT CLUB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden">
            <div className="bg-slate-50 text-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black uppercase tracking-tight font-athletic">
                  Nowy Klub Klienta
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nazwa klubu *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="np. UKS Rataje Poznań"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Miasto *</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Poznań"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Liga</label>
                  <input
                    type="text"
                    value={newLeague}
                    onChange={(e) => setNewLeague(e.target.value)}
                    placeholder="Liga Amatorska"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Barwy klubowe</label>
                <select
                  value={newThemeId}
                  onChange={(e) => setNewThemeId(e.target.value as ClubTheme['id'])}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  {CLUB_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Konto Kierownika Klubu
                </div>
                <input
                  type="text"
                  required
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="Imię i nazwisko kierownika *"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                />
                <input
                  type="email"
                  required
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="E-mail kierownika *"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newOwnerPassword}
                  onChange={(e) => setNewOwnerPassword(e.target.value)}
                  placeholder="Hasło startowe (min. 6 znaków) *"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                />
                <select
                  value={newOwnerPosition}
                  onChange={(e) => setNewOwnerPosition(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option value="Zarząd">Zarząd / spoza boiska (domyślnie)</option>
                  <option value="Sztab trenerski">Sztab trenerski</option>
                  <option value="Rozgrywający">Zawodnik — Rozgrywający</option>
                  <option value="Przyjmujący">Zawodnik — Przyjmujący</option>
                  <option value="Atakujący">Zawodnik — Atakujący</option>
                  <option value="Środkowy">Zawodnik — Środkowy</option>
                  <option value="Libero">Zawodnik — Libero</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 transition"
                >
                  {creating ? 'Tworzenie...' : 'Utwórz Klub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. GLOBAL BROADCAST MODAL (OGŁOSZENIE DO WSZYSTKICH KLUBÓW) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-50 text-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black uppercase tracking-tight font-athletic">
                  Komunikat do wszystkich klubów
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Ogłoszenie pojawi się automatycznie na tablicy każdego aktywnego klubu ({activeCount}).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priorytet</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NORMALNY', 'WAZNY', 'PILNY'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBroadcastPriority(p)}
                      className={`h-9 rounded-xl text-xs font-bold border transition cursor-pointer ${broadcastPriority === p
                        ? 'bg-slate-900 text-amber-400 border-slate-800 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tytuł komunikatu *</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="np. Aktualizacja systemu lub przerwa techniczna"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Treść *</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Wpisz wiadomość dla wszystkich klubów..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {sendingBroadcast ? 'Wysyłanie...' : `Wyślij (${activeCount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT CLUB & RESET MANAGER PASSWORD MODAL */}
      {editingClub && (
        <div className="fixed inset-0 z-60 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden">
            <div className="bg-slate-50 text-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black uppercase tracking-tight font-athletic">
                  Zarządzaj: {editingClub.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingClub(null)}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Club branding & settings */}
              <form onSubmit={handleSaveClubEdit} className="space-y-3.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Dane &amp; Wygląd Klubu
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nazwa klubu</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Miasto</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Liga</label>
                    <input
                      type="text"
                      value={editLeague}
                      onChange={(e) => setEditLeague(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barwy</label>
                  <select
                    value={editThemeId}
                    onChange={(e) => setEditThemeId(e.target.value as ClubTheme['id'])}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    {CLUB_THEMES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Herb / Logo (plik lub URL)</label>
                  <div className="flex gap-2">
                    <label className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Plik</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') setEditLogoUrl(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={editLogoUrl.startsWith('data:') ? '' : editLogoUrl}
                      onChange={(e) => setEditLogoUrl(e.target.value)}
                      placeholder="/logo.jpg lub URL..."
                      className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 transition"
                >
                  {savingEdit ? 'Zapisywanie...' : 'Zapisz zmiany klubu'}
                </button>
              </form>

              {/* Reset Manager Password */}
              <div className="pt-5 border-t border-slate-200 space-y-2.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Awaryjny reset hasła kierownika / użytkownika</span>
                </div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="E-mail użytkownika w klubie"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Nowe hasło (min. 6 znaków)"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Powtórz nowe hasło"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                {resetPassword && resetConfirmPassword && resetPassword !== resetConfirmPassword && (
                  <p className="text-[11px] font-bold text-rose-600">Hasła nie są identyczne.</p>
                )}
                <button
                  type="button"
                  disabled={resettingPw || !resetEmail || resetPassword.length < 6 || resetPassword !== resetConfirmPassword}
                  onClick={handleResetManagerPassword}
                  className="w-full h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer disabled:opacity-40 transition"
                >
                  {resettingPw ? 'Resetowanie...' : 'Ustaw nowe hasło'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLUB DETAILS MODAL */}
      {detailsClub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>{detailsClub.name}</span>
                </h2>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  ID: {detailsClub.id} • MongoDB doc: {detailsClub.mongoDocId || detailsClub.id} • Kod: {detailsClub.inviteCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsClub(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Kadra</div>
                  <div className="text-lg font-black font-mono text-slate-900">{detailsClub.totalUsers}</div>
                  <div className="text-[10px] text-slate-500">{detailsClub.playersCount} zaw. / {detailsClub.staffCount} sztab</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Aktywność</div>
                  <div className="text-lg font-black font-mono text-slate-900">{detailsClub.matchesCount + detailsClub.eventsCount}</div>
                  <div className="text-[10px] text-slate-500">{detailsClub.matchesCount} mecz. / {detailsClub.eventsCount} wyd.</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Taktyki &amp; Treningi</div>
                  <div className="text-lg font-black font-mono text-slate-900">{(detailsClub.tacticsCount || 0) + (detailsClub.trainingsCount || 0)}</div>
                  <div className="text-[10px] text-slate-500">{detailsClub.tacticsCount || 0} takt. / {detailsClub.trainingsCount || 0} tren.</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Rozmiar w bazie</div>
                  <div className="text-lg font-black font-mono text-slate-900">{detailsClub.dbSizeKb ?? 0} KB</div>
                  <div className="text-[10px] text-slate-500">limit 16 384 KB</div>
                </div>
              </div>

              {/* Meta & Finance Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-black uppercase text-emerald-700">Składki opłacone</div>
                  <div className="font-mono font-black text-emerald-900 text-sm mt-0.5">
                    {detailsClub.collectedAmount ?? 0} zł
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[10px] font-black uppercase text-amber-800">Składki oczekujące</div>
                  <div className="font-mono font-black text-amber-950 text-sm mt-0.5">
                    {detailsClub.pendingAmount ?? 0} zł ({detailsClub.feesCount ?? 0} składek)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-500">Daty</div>
                  <div className="font-mono text-[11px] text-slate-700 mt-0.5">
                    Utw: {formatShortDate(detailsClub.createdAt)} • Akt: {formatShortDate(detailsClub.lastActivityAt)}
                  </div>
                </div>
              </div>

              {/* Members Roster */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Użytkownicy w klubie ({detailsClub.members?.length || 0})
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAddUserError('');
                        setShowAddUserForm((v) => !v);
                      }}
                      className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{showAddUserForm ? 'Ukryj formularz' : 'Dodaj użytkownika'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchClub(detailsClub.id);
                      }}
                      className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Wejdź do klubu</span>
                    </button>
                  </div>
                </div>

                {showAddUserForm && (
                  <form
                    onSubmit={handleCreateClubUser}
                    className="mb-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5"
                  >
                    {addUserError && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                        {addUserError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={addUserName}
                        onChange={(e) => setAddUserName(e.target.value)}
                        placeholder="Imię i nazwisko *"
                        className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="email"
                        required
                        value={addUserEmail}
                        onChange={(e) => setAddUserEmail(e.target.value)}
                        placeholder="E-mail (login) *"
                        className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        required
                        minLength={6}
                        value={addUserPassword}
                        onChange={(e) => setAddUserPassword(e.target.value)}
                        placeholder="Hasło startowe *"
                        className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs font-mono"
                      />
                      <select
                        value={addUserRole}
                        onChange={(e) => {
                          const r = e.target.value as 'ZAWODNIK' | 'TRENER' | 'KIEROWNIK';
                          setAddUserRole(r);
                          if (r === 'KIEROWNIK') setAddUserPosition('Zarząd');
                          else if (r === 'TRENER') setAddUserPosition('Sztab trenerski');
                          else if (addUserPosition === 'Zarząd' || addUserPosition === 'Sztab trenerski') {
                            setAddUserPosition('Przyjmujący');
                          }
                        }}
                        className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <option value="ZAWODNIK">Zawodnik</option>
                        <option value="TRENER">Trener</option>
                        <option value="KIEROWNIK">Kierownik</option>
                      </select>
                      <select
                        value={addUserPosition}
                        onChange={(e) => setAddUserPosition(e.target.value)}
                        className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <option value="Przyjmujący">Przyjmujący</option>
                        <option value="Atakujący">Atakujący</option>
                        <option value="Rozgrywający">Rozgrywający</option>
                        <option value="Środkowy">Środkowy</option>
                        <option value="Libero">Libero</option>
                        <option value="Sztab trenerski">Sztab trenerski</option>
                        <option value="Zarząd">Zarząd</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={addUserNumber}
                          onChange={(e) => setAddUserNumber(e.target.value)}
                          placeholder="Nr"
                          className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs"
                        />
                        <input
                          type="tel"
                          value={addUserPhone}
                          onChange={(e) => setAddUserPhone(e.target.value)}
                          placeholder="Telefon"
                          className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addingUser}
                        className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 transition"
                      >
                        {addingUser ? 'Dodawanie...' : 'Utwórz konto w klubie'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {(detailsClub.members || []).length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">Brak użytkowników w tym klubie.</div>
                  ) : (
                    (detailsClub.members || []).map((m) => (
                      <div key={m.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {m.number ? `#${m.number} ` : ''}{m.name}
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono uppercase">
                              {m.role}
                            </span>
                            {m.position && (
                              <span className="ml-1.5 text-[11px] text-slate-500 font-normal">· {m.position}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate">{m.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const target = detailsClub;
                            setDetailsClub(null);
                            openEditModal(target);
                            setResetEmail(m.email);
                          }}
                          className="h-7 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold shrink-0 cursor-pointer transition"
                        >
                          Reset hasła
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
