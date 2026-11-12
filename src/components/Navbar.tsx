'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { 
  Trophy, 
  Calendar, 
  CreditCard, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Volleyball,
  Target,
  ChevronDown,
  Flame,
  Shield,
  Crown,
  Bell,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Clock,
  ArrowRight,
  X,
  Menu,
  Smartphone,
  Download,
  FolderArchive,
  Camera,
  Compass,
  FileText
} from 'lucide-react';
import { Announcement } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, refreshUser } = useAuth();
  const { isArchiveMode, activeSeason } = useSeasonArchive();

  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [savingAvatar, setSavingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Wybrany plik musi być obrazem (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Plik jest zbyt duży (maksymalnie 10 MB).');
      return;
    }

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
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarPreview(resizedDataUrl);
          setAvatarError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!user) return;
    setSavingAvatar(true);
    setAvatarError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          avatar: avatarPreview || ''
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Błąd podczas zapisywania zdjęcia');
      }

      await refreshUser();
      setAvatarSuccess('Zdjęcie profilowe zostało zaktualizowane!');
      setTimeout(() => {
        setShowProfileModal(false);
        setAvatarSuccess(null);
      }, 1000);
    } catch (err: any) {
      setAvatarError(err.message || 'Nie udało się zapisać zdjęcia');
    } finally {
      setSavingAvatar(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('angels_theme');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('theme-light', 'light');
    }
  }, []);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [browserNotificationPerm, setBrowserNotificationPerm] = useState<string>('default');
  const prevUnreadRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserNotificationPerm(Notification.permission);
    }
  }, []);

  const requestBrowserNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotificationPerm(perm);
        if (perm === 'granted') {
          new Notification('Angels ZTP', {
            body: 'Powiadomienia włączone! Będziesz informowany o nowych meczach i ankietach.',
            icon: '/logo.jpg',
          });
        }
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        const incomingAnnouncements: Announcement[] = data.announcements || [];
        const incomingUnread: number = data.unreadCount || 0;

        // If new unread arrived and notifications granted, trigger push notification
        if (
          prevUnreadRef.current !== null && 
          incomingUnread > prevUnreadRef.current && 
          typeof window !== 'undefined' && 
          'Notification' in window && 
          Notification.permission === 'granted'
        ) {
          const newest = incomingAnnouncements[0];
          if (newest) {
            new Notification(`Angels ZTP: ${newest.title}`, {
              body: newest.content,
              icon: '/logo.jpg',
            });
          }
        }

        prevUnreadRef.current = incomingUnread;
        setAnnouncements(incomingAnnouncements);
        setUnreadCount(incomingUnread);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/announcements/${id}/read`, { method: 'POST' });
      if (res.ok) {
        await fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = announcements.filter(a => user && !a.readBy.some(r => r.userId === user.id));
      await Promise.all(unread.map(a => fetch(`/api/announcements/${a.id}/read`, { method: 'POST' })));
      await fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadge = (userObj?: any) => {
    if (!userObj) return null;
    if (userObj.isCaptain) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300">
          <Crown className="w-3 h-3 text-amber-600" />
          Kapitan
        </span>
      );
    }
    switch (userObj.role) {
      case 'KIEROWNIK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300">
            <Crown className="w-3 h-3 text-amber-600" />
            Kierownik
          </span>
        );
      case 'TRENER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-50 text-sky-800 border border-sky-300">
            <Flame className="w-3 h-3 text-sky-500" />
            Trener
          </span>
        );
      case 'ZAWODNIK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
            <Volleyball className="w-3 h-3 text-slate-500" />
            Zawodnik
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border-b border-slate-200">
      {/* Main Navbar */}
      <div className="w-full">
        <div className="max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 flex items-center justify-between h-16">
          {/* Logo & Brand with Angels ZTP Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-0.5 shadow-sm border border-slate-200 group-hover:border-sky-400 group-hover:shadow-md transition overflow-hidden shrink-0 flex items-center justify-center">
                <img 
                  src="/logo.jpg" 
                  alt="Angels ZTP Logo" 
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <div className="flex flex-col shrink-0 leading-tight">
                <span className="font-black text-base sm:text-lg tracking-wider uppercase font-athletic text-slate-900 group-hover:text-sky-600 transition whitespace-nowrap">
                  ANGELS ZTP
                </span>
                <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-sky-600 tracking-widest uppercase whitespace-nowrap">
                  VOLLEYBALL TEAM
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
            <a
              href="/"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-600" />
              Pulpit
            </a>

            <a
              href="/events"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname.startsWith('/events')
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Terminarz</span>
            </a>

            {/* Rozgrywki with dropdown */}
            <div className="relative group shrink-0">
              <a
                href="/rozgrywki"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                  pathname.startsWith('/rozgrywki')
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Volleyball className="w-4 h-4 text-amber-600" />
                <span>Rozgrywki</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition" />
              </a>

              {/* Submenu Dropdown */}
              <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                <div className="w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-0.5">
                  <a
                    href="/rozgrywki?tab=sparingi"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition"
                  >
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Sparingi</span>
                  </a>
                  <a
                    href="/rozgrywki?tab=liga"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-sky-50 transition"
                  >
                    <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full object-contain" />
                    <span>Liga LALS & Tabela</span>
                  </a>
                  <a
                    href="/rozgrywki?tab=turnieje"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition"
                  >
                    <Trophy className="w-4 h-4 text-purple-500" />
                    <span>Turnieje</span>
                  </a>
                </div>
              </div>
            </div>

            <a
              href="/fees"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/fees'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Składki
            </a>

            <a
              href="/team"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/team'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-slate-600" />
              Kadra
            </a>

            {/* Taktyka & Trening with dropdown */}
            <div className="relative group shrink-0">
              <a
                href="/taktyka"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                  pathname.startsWith('/taktyka') || pathname.startsWith('/trening') || pathname.startsWith('/coach')
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Target className="w-4 h-4 text-sky-600" />
                <span>Taktyka & Trening</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition" />
              </a>

              {/* Submenu Dropdown */}
              <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                <div className="w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-0.5">
                  <a
                    href="/taktyka?tab=board"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-sky-50 transition"
                  >
                    <Compass className="w-4 h-4 text-sky-500" />
                    <span>Tablica Taktyczna (5-1)</span>
                  </a>
                  <a
                    href="/taktyka?tab=playbook"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition"
                  >
                    <Target className="w-4 h-4 text-amber-500" />
                    <span>Baza Wariantów (Playbook)</span>
                  </a>
                  <a
                    href="/taktyka?tab=training"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <Volleyball className="w-4 h-4 text-emerald-500" />
                    <span>Plany Treningowe & Warsztat</span>
                  </a>
                  <a
                    href="/taktyka?tab=debrief"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition"
                  >
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span>Odprawa & Wnioski Trenera</span>
                  </a>
                </div>
              </div>
            </div>

            <a
              href="/galeria"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/galeria'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4 text-sky-600" />
              Galeria
            </a>

            {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.isCaptain || user?.permissions?.isAdmin) && (
              <a
                href="/admin"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                  pathname === '/admin'
                    ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-sm'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Admin</span>
              </a>
            )}
          </nav>

          {/* User Section & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Archive Mode Warning Badge (widoczny tylko gdy przeglądamy miniony sezon) */}
            {isArchiveMode && (
              <a
                href="/admin?tab=seasons"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 text-amber-300 text-xs font-black transition shadow-sm glow-gold shrink-0"
                title={`Tryb archiwum: ${activeSeason?.name || ''}`}
              >
                <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-mono whitespace-nowrap">
                  Archiwum: {activeSeason?.name || 'Sezon'}
                </span>
              </a>
            )}

            {/* Notifications Bell */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition flex items-center justify-center shadow-sm"
                title="Powiadomienia"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-sky-600 text-white rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center animate-pulse shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifications && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-[420px] bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 text-slate-800">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                          Powiadomienia
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : 'Wszystko odczytane'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user && unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-sky-600 hover:text-sky-800 font-bold underline transition"
                        >
                          Odczytaj wszystkie
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                        aria-label="Zamknij powiadomienia"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Browser Push Notification Permission Banner */}
                  {browserNotificationPerm !== 'granted' && (
                    <div className="mt-2.5 p-2.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-2 shadow-sm">
                      <div className="text-[11px] text-sky-900">
                        🔔 <strong>Włącz powiadomienia</strong> push na telefonie.
                      </div>
                      <button
                        onClick={requestBrowserNotifications}
                        className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-[10px] uppercase shrink-0 transition shadow-sm"
                      >
                        Włącz
                      </button>
                    </div>
                  )}

                  {/* List of Announcements */}
                  <div className="mt-3 max-h-[380px] overflow-y-auto space-y-3 pr-1">
                    {announcements.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 space-y-1">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">Brak nowych komunikatów</p>
                        <p className="text-[11px] text-slate-400">Nowe ogłoszenia sztabu pojawią się tutaj.</p>
                      </div>
                    ) : (
                      announcements.map((ann) => {
                        const isRead = user && ann.readBy.some(r => r.userId === user.id);
                        const isUrgent = ann.priority === 'PILNY';
                        const isImportant = ann.priority === 'WAZNY';

                        return (
                          <div
                            key={ann.id}
                            onClick={() => {
                              if (ann.link) {
                                setShowNotifications(false);
                                window.location.href = ann.link;
                              }
                            }}
                            className={`p-3.5 rounded-2xl border transition-all duration-200 space-y-2.5 ${
                              ann.link ? 'cursor-pointer hover:shadow-md' : ''
                            } ${
                              !isRead
                                ? isUrgent
                                  ? 'bg-rose-50/70 border-l-[5px] border-l-rose-500 border-rose-200 shadow-sm'
                                  : isImportant
                                  ? 'bg-amber-50/70 border-l-[5px] border-l-amber-500 border-amber-200 shadow-sm'
                                  : 'bg-white border-l-[5px] border-l-sky-500 border-slate-200 shadow-sm'
                                : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            {/* Card Top: Priority Badge + NEW / READ status + Date */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {isUrgent ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-500 text-white flex items-center gap-1 shadow-sm">
                                    <AlertTriangle className="w-3 h-3 text-white" />
                                    PILNY
                                  </span>
                                ) : isImportant ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                                    <Megaphone className="w-3 h-3 text-slate-950" />
                                    WAŻNY
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                    <Bell className="w-3 h-3 text-sky-600" />
                                    INFORMACJA
                                  </span>
                                )}

                                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {new Date(ann.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>

                              <div>
                                {!isRead ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-600 text-white shadow-sm flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                    NOWE
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Odczytano
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Title & Content */}
                            <div>
                              <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                {ann.title}
                              </h5>
                              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                {ann.content}
                              </p>
                            </div>

                            {/* Card Footer */}
                            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 text-[10.5px]">
                                Od: <strong className="text-slate-800">{ann.createdByName}</strong>
                              </span>

                              <div className="flex items-center gap-2">
                                {user && !isRead && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(ann.id, e)}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-bold transition flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Potwierdź
                                  </button>
                                )}
                                {ann.link && (
                                  <span className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-0.5 text-xs">
                                    <span>Otwórz</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <a
                    href="/#komunikaty"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center mt-3 pt-2 text-xs font-bold text-sky-600 hover:text-sky-800 border-t border-slate-200"
                  >
                    Wszystkie ogłoszenia i ankiety ➔
                  </a>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Profile Pill with Photo & Details - Clickable */}
                <button
                  onClick={() => {
                    setAvatarPreview(user.avatar || '');
                    setAvatarError(null);
                    setAvatarSuccess(null);
                    setShowProfileModal(true);
                  }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-sky-300 shadow-sm transition text-left group cursor-pointer"
                  title="Kliknij, aby edytować profil i zmienić zdjęcie"
                >
                  {/* Avatar / Photo with hover camera hint */}
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 border border-slate-200 group-hover:border-sky-400 shadow-sm transition">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Player Name, Number & Role */}
                  <div className="hidden lg:flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition leading-tight">
                        {user.name}
                      </span>
                      {user.number && (
                        <span className="bg-white text-slate-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-black border border-slate-200">
                          #{user.number}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      {getRoleBadge(user)}
                    </div>
                  </div>
                </button>

                {/* Symmetrical Logout Button */}
                <button
                  onClick={logout}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-500 flex items-center justify-center transition shadow-sm"
                  title="Wyloguj z systemu"
                  aria-label="Wyloguj"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <a
                  href="/login"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition"
                >
                  Logowanie
                </a>
                <a
                  href="/register"
                  className="hidden xs:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition"
                >
                  Dołącz
                </a>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-xl text-slate-800">
          {user && (
            <div className="p-3 mb-2 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">{user.name}</span>
                    {user.number && (
                      <span className="bg-white text-slate-800 text-[10px] px-1 rounded font-mono font-black border border-slate-200">
                        #{user.number}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5">{getRoleBadge(user)}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setAvatarPreview(user.avatar || '');
                    setAvatarError(null);
                    setAvatarSuccess(null);
                    setIsMobileMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold flex items-center gap-1 transition"
                  title="Zmień zdjęcie"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Zdjęcie</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-500 transition"
                  title="Wyloguj"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <a
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-sky-600" />
            <span>Pulpit</span>
          </a>

          <a
            href="/events"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname.startsWith('/events') ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Terminarz & Frekwencja</span>
          </a>

          <div className="pt-1 pb-1 border-y border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 px-3 tracking-wider">Rozgrywki</span>
            <a
              href="/rozgrywki?tab=sparingi"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>1. Sparingi</span>
            </a>
            <a
              href="/rozgrywki?tab=liga"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition"
            >
              <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full object-contain" />
              <span>2. Liga LALS & Tabela</span>
            </a>
            <a
              href="/rozgrywki?tab=turnieje"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition"
            >
              <Trophy className="w-4 h-4 text-purple-500" />
              <span>3. Turnieje</span>
            </a>
          </div>

          <a
            href="/fees"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/fees' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Składki i Płatności (BLIK)</span>
          </a>

          <a
            href="/team"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/team' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>Kadra Drużyny</span>
          </a>

          <a
            href="/taktyka"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/taktyka' || pathname.startsWith('/coach') ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4 text-sky-600" />
            <span>Tablica Taktyczna</span>
          </a>

          <a
            href="/trening"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/trening' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Volleyball className="w-4 h-4 text-emerald-600" />
            <span>Warsztat & Treningi</span>
          </a>

          <a
            href="/galeria"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/galeria' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4 text-sky-600" />
            <span>Galeria Zdjęć</span>
          </a>

          {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.permissions?.isAdmin) && (
            <a
              href="/admin"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname === '/admin' ? 'bg-amber-50 text-amber-800 border border-amber-300' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Centrum Administracji</span>
            </a>
          )}

          {/* PWA Install Button in Mobile Menu */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              window.dispatchEvent(new CustomEvent('open-pwa-install'));
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 transition mt-2"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-600" />
              <span>Zainstaluj aplikację na telefonie</span>
            </span>
            <Download className="w-3.5 h-3.5 text-sky-600" />
          </button>
        </div>
      )}

      {/* Profile & Avatar Upload Modal */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl text-slate-800 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
              aria-label="Zamknij"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="inline-flex p-2 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 mb-2">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Mój Profil & Zdjęcie
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ustaw zdjęcie profilowe wyświetlane w składzie, taktyce i terminarzu
              </p>
            </div>

            {/* Avatar Preview */}
            <div className="my-5 flex flex-col items-center">
              <div className="relative group">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl ring-2 ring-sky-200 bg-slate-100 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Podgląd zdjęcia"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-4xl flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  id="avatar-file-upload"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
                <label
                  htmlFor="avatar-file-upload"
                  className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg cursor-pointer transition transform hover:scale-105"
                  title="Wgraj nowe zdjęcie z urządzenia"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <label
                  htmlFor="avatar-file-upload"
                  className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Wybierz z telefonu / komputera
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => setAvatarPreview('')}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold transition"
                  >
                    Usuń
                  </button>
                )}
              </div>
            </div>

            {/* Alternative URL Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Lub wklej link do zdjęcia (URL):
                </label>
                <input
                  type="url"
                  value={avatarPreview.startsWith('data:') ? '' : avatarPreview}
                  onChange={(e) => setAvatarPreview(e.target.value)}
                  placeholder="https://example.com/moje-zdjecie.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              {/* User Quick Info Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Imię i nazwisko:</span>
                  <span className="font-bold text-slate-800">{user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Numer na koszulce:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {user.number ? `#${user.number}` : 'Nieprzypisany'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rola w zespole:</span>
                  <div className="font-bold text-slate-800">{getRoleBadge(user)}</div>
                </div>
                {user.position && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pozycja boiskowa:</span>
                    <span className="font-bold text-slate-800">{user.position}</span>
                  </div>
                )}
              </div>

              {/* Feedback Messages */}
              {avatarError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}
              {avatarSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{avatarSuccess}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingAvatar ? (
                  <span>Zapisywanie...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Zapisz zdjęcie</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
