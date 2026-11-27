'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClub } from '@/context/ClubContext';
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
  FileText,
  User,
  Building2,
  Plus,
  LogIn
} from 'lucide-react';
import { Announcement } from '@/lib/types';
import UserProfileModal from '@/components/UserProfileModal';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, refreshUser } = useAuth();
  const { club, theme, allClubs, isSuperAdmin, switchClub } = useClub();
  const { isArchiveMode, activeSeason } = useSeasonArchive();
  const [showClubSwitcher, setShowClubSwitcher] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

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

  const isSuperAdminUser =
    Boolean((user as { isSuperAdmin?: boolean } | null)?.isSuperAdmin) ||
    user?.id === 'platform_superadmin';

  const fetchAnnouncements = async () => {
    if (!user || isSuperAdminUser) {
      setAnnouncements([]);
      setUnreadCount(0);
      return;
    }
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
            new Notification(`${club?.name || 'VolleyHub'}: ${newest.title}`, {
              body: newest.content,
              icon: club?.logoUrl || '/logo.jpg',
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
    if (!user || isSuperAdminUser) {
      setAnnouncements([]);
      setUnreadCount(0);
      return;
    }
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 15000);

    const onRead = () => fetchAnnouncements();
    window.addEventListener('announcementRead', onRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('announcementRead', onRead);
    };
  }, [user, isSuperAdminUser]);

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

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Dedicated High-Contrast Light SuperAdmin Header
  if (user && isSuperAdmin) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-900 shadow-sm border-b border-slate-200">
        <div className="h-[3px] w-full bg-gradient-to-r from-indigo-600 via-amber-500 to-indigo-600" />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/superadmin" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-black text-base sm:text-lg tracking-wider uppercase font-athletic text-slate-900">
                SUPERADMIN
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-indigo-600 tracking-widest uppercase">
                PORTAL DRUŻYN
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/superadmin"
              className={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition border ${
                pathname === '/superadmin'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Kluby</span>
            </Link>
            <Link
              href="/portal"
              className={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition border ${
                pathname === '/portal'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <Volleyball className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Strona Portalu</span>
              <span className="sm:hidden">Portal</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="h-9 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Public SaaS Portal Header when unauthenticated on /portal or /create-club
  if (!user && (pathname === '/portal' || pathname === '/create-club')) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border-b border-slate-200">
        <div className="h-[2.5px] w-full bg-gradient-to-r from-slate-950 via-amber-500 to-slate-950" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/portal" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm border border-slate-800">
              <Volleyball className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-black text-base sm:text-lg tracking-wider uppercase font-athletic text-slate-900">
                PORTAL DRUŻYN
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-600 tracking-widest uppercase">
                SIATKÓWKA
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Dołącz kodem</span>
              <span className="sm:hidden">Dołącz</span>
            </Link>
            <Link
              href="/login"
              className="h-10 px-3.5 sm:px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Zaloguj się</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border-b border-slate-200">
      {/* Dynamic Club Accent Ribbon */}
      <div className={`h-[2.5px] w-full bg-gradient-to-r ${theme.ribbonClass}`} />
      {/* Main Navbar */}
      <div className="w-full">
        <div className="max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 flex items-center justify-between h-16">
          {/* Logo & Brand (Dynamic per active club) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${club?.logoUrl ? 'bg-white p-0.5' : `${theme.badgeBgClass} ${theme.badgeTextClass}`} shadow-sm border border-slate-200 group-hover:border-amber-400 group-hover:shadow-md transition overflow-hidden shrink-0 flex items-center justify-center`}>
                {club?.logoUrl ? (
                  <img 
                    src={club.logoUrl} 
                    alt={club.name} 
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                ) : (
                  <Volleyball className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col shrink-0 leading-tight">
                <span className="font-black text-base sm:text-lg tracking-wider uppercase font-athletic text-slate-900 group-hover:text-amber-600 transition whitespace-nowrap max-w-[160px] sm:max-w-[220px] truncate">
                  {club?.shortName || 'ANGELS ZTP'}
                </span>
                <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-extrabold text-amber-600 tracking-widest uppercase whitespace-nowrap">
                  {club?.subtitle || 'VOLLEYBALL TEAM'}
                </span>
              </div>
            </Link>

            {/* SuperAdmin Instant Club Switcher */}
            {isSuperAdmin && (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setShowClubSwitcher((v) => !v)}
                  className="h-9 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition cursor-pointer"
                  title="Przełącz aktywny klub klienta (SuperAdmin)"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kluby ({allClubs.length})</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showClubSwitcher ? 'rotate-180' : ''}`} />
                </button>

                {showClubSwitcher && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Przełącz Klub Klienta</span>
                      <Link
                        href="/superadmin"
                        onClick={() => setShowClubSwitcher(false)}
                        className="text-amber-600 hover:text-amber-700 underline"
                      >
                        Panel SuperAdmina →
                      </Link>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {allClubs.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setShowClubSwitcher(false);
                            switchClub(c.id);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between gap-2 transition cursor-pointer ${
                            club?.id === c.id
                              ? 'bg-slate-900 text-amber-400'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate">{c.name}</div>
                            <div className={`text-[10px] truncate ${club?.id === c.id ? 'text-slate-400' : 'text-slate-400'}`}>
                              {c.city} • {c.plan}
                            </div>
                          </div>
                          {club?.id === c.id && <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                      <Link
                        href="/superadmin"
                        onClick={() => setShowClubSwitcher(false)}
                        className="h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>SuperAdmin</span>
                      </Link>
                      <Link
                        href="/portal"
                        onClick={() => setShowClubSwitcher(false)}
                        className="h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Portal</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
            <Link
              href="/"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/'
                  ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${pathname === '/' ? 'text-amber-400' : 'text-slate-500'}`} />
              Pulpit
            </Link>

            <Link
              href="/events"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname.startsWith('/events')
                  ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className={`w-4 h-4 ${pathname.startsWith('/events') ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>Terminarz</span>
            </Link>

            {/* Rozgrywki with dropdown */}
            <div className="relative group shrink-0">
              <Link
                href="/rozgrywki"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                  pathname.startsWith('/rozgrywki')
                    ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Volleyball className={`w-4 h-4 ${pathname.startsWith('/rozgrywki') ? 'text-amber-400' : 'text-amber-600'}`} />
                <span>Rozgrywki</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition" />
              </Link>

              {/* Submenu Dropdown */}
              <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                <div className="w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-0.5">
                  <Link
                    href="/rozgrywki?tab=sparingi"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition"
                  >
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Sparingi</span>
                  </Link>
                  <Link
                    href="/rozgrywki?tab=liga"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-sky-50 transition"
                  >
                    <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full object-contain" />
                    <span>Liga LALS & Tabela</span>
                  </Link>
                  <Link
                    href="/rozgrywki?tab=turnieje"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition"
                  >
                    <Trophy className="w-4 h-4 text-purple-500" />
                    <span>Turnieje</span>
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/fees"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/fees'
                  ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${pathname === '/fees' ? 'text-amber-400' : 'text-emerald-600'}`} />
              Składki
            </Link>

            <Link
              href="/team"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/team'
                  ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className={`w-4 h-4 ${pathname === '/team' ? 'text-amber-400' : 'text-slate-600'}`} />
              Kadra
            </Link>

            {/* Taktyka with dropdown */}
            <div className="relative group shrink-0">
              <Link
                href="/taktyka"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                  pathname.startsWith('/taktyka') || pathname.startsWith('/coach')
                    ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Target className={`w-4 h-4 ${(pathname.startsWith('/taktyka') || pathname.startsWith('/coach')) ? 'text-amber-400' : 'text-amber-600'}`} />
                <span>Taktyka</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition" />
              </Link>

              {/* Submenu Dropdown */}
              <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                <div className="w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-0.5">
                  <Link
                    href="/taktyka?tab=board"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-sky-50 transition"
                  >
                    <Compass className="w-4 h-4 text-sky-500" />
                    <span>Tablica taktyczna</span>
                  </Link>
                  <Link
                    href="/taktyka?tab=matches"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition"
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Rozpiski meczowe</span>
                  </Link>
                  <Link
                    href="/trening"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <Volleyball className="w-4 h-4 text-emerald-500" />
                    <span>Treningi</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Treningi - osobna podstrona */}
            <Link
              href="/trening"
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname.startsWith('/trening')
                  ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Volleyball className={`w-4 h-4 ${pathname.startsWith('/trening') ? 'text-amber-400' : 'text-emerald-600'}`} />
              <span>Treningi</span>
            </Link>

            <Link
              href="/galeria"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/galeria'
                  ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className={`w-4 h-4 ${pathname === '/galeria' ? 'text-amber-400' : 'text-slate-600'}`} />
              Galeria
            </Link>

            <Link
              href="/raport-sezonu"
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                pathname === '/raport-sezonu' || pathname === '/admin/raport-sezonu'
                  ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className={`w-4 h-4 ${pathname === '/raport-sezonu' || pathname === '/admin/raport-sezonu' ? 'text-amber-400' : 'text-slate-600'}`} />
              Raport
            </Link>

            {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.isCaptain || user?.permissions?.isAdmin) && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold whitespace-nowrap shrink-0 transition ${
                  pathname === '/admin'
                    ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                <Shield className={`w-4 h-4 ${pathname === '/admin' ? 'text-amber-400' : 'text-amber-600'}`} />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* User Section & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="hidden xl:block h-6 w-px bg-slate-200 mx-0.5" />

            {/* Archive Mode Warning Badge (widoczny tylko gdy przeglądamy miniony sezon) */}
            {isArchiveMode && (
              <Link
                href="/admin?tab=seasons"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 text-amber-300 text-xs font-black transition shadow-sm glow-gold shrink-0"
                title={`Tryb archiwum: ${activeSeason?.name || ''}`}
              >
                <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-mono whitespace-nowrap">
                  Archiwum: {activeSeason?.name || 'Sezon'}
                </span>
              </Link>
            )}

            {/* Notifications Bell */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 transition flex items-center justify-center shadow-sm"
                title="Powiadomienia"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center shadow-md ring-2 ring-white animate-pulse">
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

                  <Link
                    href="/events"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center mt-3 pt-2 text-xs font-bold text-sky-600 hover:text-sky-800 border-t border-slate-200"
                  >
                    Wszystkie ogłoszenia i ankiety ➔
                  </Link>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Profile Pill with Photo & Details - Clickable */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-2 sm:gap-2.5 h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 shadow-sm transition text-left group cursor-pointer"
                  title="Kliknij, aby otworzyć swój profil"
                >
                  {/* Circular Avatar / Photo with hover camera hint */}
                  <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200 group-hover:ring-amber-400 shadow-sm transition">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-700 text-amber-400 font-black text-xs flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Camera className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Player Name, Number & Role */}
                  <div className="hidden lg:flex flex-col text-left justify-center pr-0.5">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition">
                        {user.name}
                      </span>
                      {user.number && (
                        <span className="text-[10px] font-mono font-black text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          #{user.number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 leading-none">
                      {user.isCaptain ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                          <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                          Kapitan
                        </span>
                      ) : user.role === 'TRENER' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                          <Flame className="w-3 h-3 text-sky-500 shrink-0" />
                          Trener
                        </span>
                      ) : user.role === 'KIEROWNIK' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                          <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                          Kierownik
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {user.position || 'Zawodnik'}
                        </span>
                      )}
                      {user.position && (user.isCaptain || user.role === 'TRENER' || user.role === 'KIEROWNIK') && (
                        <>
                          <span className="text-slate-300 text-[9px]">•</span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {user.position}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition -ml-0.5" />
                </button>

                {/* Symmetrical Logout Button */}
                <button
                  onClick={logout}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition shadow-sm"
                  title="Wyloguj z systemu"
                  aria-label="Wyloguj"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition"
                >
                  Logowanie
                </Link>
                <Link
                  href="/register"
                  className="hidden xs:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition"
                >
                  Dołącz
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button (Tylko na tabletach md..xl, bo na telefonach <md jest dedykowany dolny pasek nawigacyjny BottomNav) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hidden md:flex xl:hidden p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-sm"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer (Tylko na tabletach md..xl) */}
      {isMobileMenuOpen && (
        <div className="hidden md:block xl:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-xl text-slate-800">
          {user && (
            <div className="p-3 mb-2 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-200 shadow-sm shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-black text-slate-900">{user.name}</span>
                    {user.number && (
                      <span className="bg-sky-50 text-sky-700 text-[10px] px-1.5 py-0.5 rounded font-mono font-black border border-sky-200">
                        #{user.number}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">{getRoleBadge(user)}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-sky-700 text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
                  title="Mój Profil"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profil</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-slate-500 transition shadow-xs"
                  title="Wyloguj"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/' ? 'bg-slate-900 text-amber-400 border border-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${pathname === '/' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Pulpit</span>
          </Link>

          <Link
            href="/events"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname.startsWith('/events') ? 'bg-slate-900 text-amber-400 border border-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className={`w-4 h-4 ${pathname.startsWith('/events') ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>Terminarz & Frekwencja</span>
          </Link>

          <div className="pt-1 pb-1 border-y border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 px-3 tracking-wider">Rozgrywki</span>
            <Link
              href="/rozgrywki?tab=sparingi"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>1. Sparingi</span>
            </Link>
            <Link
              href="/rozgrywki?tab=liga"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800 transition"
            >
              <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full object-contain" />
              <span>2. Liga LALS & Tabela</span>
            </Link>
            <Link
              href="/rozgrywki?tab=turnieje"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition"
            >
              <Trophy className="w-4 h-4 text-purple-500" />
              <span>3. Turnieje</span>
            </Link>
          </div>

          <Link
            href="/fees"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/fees' ? 'bg-slate-900 text-amber-400 border border-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard className={`w-4 h-4 ${pathname === '/fees' ? 'text-amber-400' : 'text-emerald-600'}`} />
            <span>Składki i Płatności (BLIK)</span>
          </Link>

          <Link
            href="/team"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/team' ? 'bg-slate-900 text-amber-400 border border-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className={`w-4 h-4 ${pathname === '/team' ? 'text-amber-400' : 'text-slate-600'}`} />
            <span>Kadra Drużyny</span>
          </Link>

          <div className="pt-2 pb-1 border-t border-slate-100 space-y-1">
            <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Taktyka & Trening</div>
            <Link
              href="/taktyka?tab=board"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
            >
              <Compass className="w-4 h-4 text-sky-600" />
              <span>Tablica taktyczna</span>
            </Link>
            <Link
              href="/taktyka?tab=matches"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Rozpiski meczowe</span>
            </Link>
            <Link
              href="/trening"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <Volleyball className="w-4 h-4 text-emerald-600" />
              <span>Treningi</span>
            </Link>
          </div>

          <Link
            href="/galeria"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/galeria' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4 text-sky-600" />
            <span>Galeria Zdjęć</span>
          </Link>

          <Link
            href="/raport-sezonu"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              pathname === '/raport-sezonu' ? 'bg-slate-900 text-amber-400 border border-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Podsumowanie Sezonu (PDF)</span>
          </Link>

          {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.permissions?.isAdmin) && (
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname === '/admin' ? 'bg-amber-50 text-amber-800 border border-amber-300' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Centrum Administracji</span>
            </Link>
          )}
        </div>
      )}

      {/* User Profile & Settings Modal rendered via React Portal at body level */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
}
