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
  FolderArchive
} from 'lucide-react';
import { Announcement } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isArchiveMode, activeSeason } = useSeasonArchive();

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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Crown className="w-3 h-3 text-amber-400" />
          Kapitan & Kierownik
        </span>
      );
    }
    switch (userObj.role) {
      case 'KIEROWNIK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Crown className="w-3 h-3 text-amber-400" />
            Kierownik
          </span>
        );
      case 'TRENER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/15 text-sky-300 border border-sky-500/40">
            <Flame className="w-3 h-3 text-sky-400" />
            Trener
          </span>
        );
      case 'ZAWODNIK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
            <Volleyball className="w-3 h-3 text-slate-400" />
            Zawodnik
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#050811]/90 backdrop-blur-2xl text-white shadow-2xl border-b border-sky-500/20">
      {/* Main Navbar */}
      <div className="w-full">
        <div className="max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 flex items-center justify-between h-16">
          {/* Logo & Brand with Angels ZTP Logo */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#090d16] p-0.5 shadow-lg shadow-sky-500/20 border border-sky-500/40 group-hover:border-sky-400 group-hover:shadow-sky-500/40 transition overflow-hidden shrink-0 flex items-center justify-center">
                <img 
                  src="/logo.jpg" 
                  alt="Angels ZTP Logo" 
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base sm:text-lg tracking-wider text-white uppercase drop-shadow font-athletic text-gradient-cyan">
                  ANGELS ZTP
                </span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-bold text-sky-400 tracking-widest uppercase">
                  VOLLEYBALL TEAM
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <a
              href="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition ${
                pathname === '/'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              Pulpit
            </a>

            <a
              href="/events"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition ${
                pathname.startsWith('/events')
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Terminarz</span>
            </a>

            {/* Rozgrywki with dropdown */}
            <div className="relative group">
              <a
                href="/rozgrywki"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition ${
                  pathname.startsWith('/rozgrywki')
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Volleyball className="w-4 h-4 text-amber-400" />
                <span>Rozgrywki</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition" />
              </a>

              {/* Submenu Dropdown */}
              <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                <div className="w-56 bg-[#090d16] border border-sky-500/30 rounded-2xl shadow-2xl p-1.5 space-y-0.5 backdrop-blur-2xl">
                  <a
                    href="/rozgrywki?tab=sparingi"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-amber-300 hover:bg-slate-800/80 transition"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Sparingi</span>
                  </a>
                  <a
                    href="/rozgrywki?tab=liga"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-sky-300 hover:bg-slate-800/80 transition"
                  >
                    <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full object-contain" />
                    <span>Liga LALS & Tabela</span>
                  </a>
                  <a
                    href="/rozgrywki?tab=turnieje"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-purple-300 hover:bg-slate-800/80 transition"
                  >
                    <Trophy className="w-4 h-4 text-purple-400" />
                    <span>Turnieje</span>
                  </a>
                </div>
              </div>
            </div>

            <a
              href="/fees"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition ${
                pathname === '/fees'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Składki
            </a>

            <a
              href="/team"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition ${
                pathname === '/team'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-slate-300" />
              Kadra
            </a>

            <a
              href="/taktyka"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition ${
                pathname === '/taktyka' || pathname.startsWith('/coach')
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4 text-sky-400" />
              Taktyka
            </a>

            {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.isCaptain || user?.permissions?.isAdmin) && (
              <a
                href="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition ${
                  pathname === '/admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin</span>
              </a>
            )}
          </nav>

          {/* User Section & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Season Badge & Archive Switcher */}
            <a
              href="/admin?tab=seasons"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
                isArchiveMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 glow-gold'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:text-white hover:border-sky-500/40'
              }`}
              title={isArchiveMode ? `Tryb archiwum: ${activeSeason?.name || ''}` : 'Bieżący Sezon 2026/2027'}
            >
              <FolderArchive className={`w-3.5 h-3.5 ${isArchiveMode ? 'text-amber-400' : 'text-sky-400'}`} />
              <span className="hidden xl:inline text-[11px] font-mono">
                {isArchiveMode ? 'Archiwum' : 'Sezon 2026/27'}
              </span>
            </a>

            {/* Install PWA Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
              title="Zainstaluj aplikację Angels ZTP na telefonie / komputerze"
            >
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span className="hidden lg:inline text-[11px]">Aplikacja</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 sm:p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
                title="Powiadomienia"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-sky-500 text-slate-950 rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center animate-pulse shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifications && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-[420px] bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl p-4 z-50 backdrop-blur-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-white tracking-wider">
                          Powiadomienia
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : 'Wszystko odczytane'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user && unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-sky-400 hover:text-sky-300 font-bold underline transition"
                        >
                          Odczytaj wszystkie
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
                        aria-label="Zamknij powiadomienia"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Browser Push Notification Permission Banner */}
                  {browserNotificationPerm !== 'granted' && (
                    <div className="mt-2.5 p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-2 shadow-sm">
                      <div className="text-[11px] text-sky-200">
                        🔔 <strong>Włącz powiadomienia</strong> push na telefonie.
                      </div>
                      <button
                        onClick={requestBrowserNotifications}
                        className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] uppercase shrink-0 transition shadow-sm"
                      >
                        Włącz
                      </button>
                    </div>
                  )}

                  {/* List of Announcements */}
                  <div className="mt-3 max-h-[380px] overflow-y-auto space-y-3 pr-1">
                    {announcements.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 space-y-1">
                        <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">Brak nowych komunikatów</p>
                        <p className="text-[11px] text-slate-600">Nowe ogłoszenia sztabu pojawią się tutaj.</p>
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
                              ann.link ? 'cursor-pointer' : ''
                            } ${
                              !isRead
                                ? isUrgent
                                  ? 'bg-rose-950/40 border-l-[5px] border-l-rose-500 border-rose-500/40 shadow-lg shadow-rose-950/20'
                                  : isImportant
                                  ? 'bg-amber-950/35 border-l-[5px] border-l-amber-500 border-amber-500/40 shadow-lg shadow-amber-950/20'
                                  : 'bg-slate-900 border-l-[5px] border-l-sky-500 border-slate-700 shadow-md'
                                : 'bg-slate-950/70 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-700'
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
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                                    <Bell className="w-3 h-3 text-sky-400" />
                                    INFORMACJA
                                  </span>
                                )}

                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {new Date(ann.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>

                              <div>
                                {!isRead ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500 text-slate-950 shadow-sm flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                                    NOWE
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Odczytano
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Title & Content */}
                            <div>
                              <h5 className="text-xs sm:text-sm font-black text-white leading-snug">
                                {ann.title}
                              </h5>
                              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">
                                {ann.content}
                              </p>
                            </div>

                            {/* Card Footer */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 text-[10.5px]">
                                Od: <strong className="text-slate-200">{ann.createdByName}</strong>
                              </span>

                              <div className="flex items-center gap-2">
                                {user && !isRead && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(ann.id, e)}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Potwierdź
                                  </button>
                                )}
                                {ann.link && (
                                  <span className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5 text-xs">
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
                    className="block text-center mt-3 pt-2 text-xs font-bold text-sky-400 hover:text-sky-300 border-t border-slate-800"
                  >
                    Wszystkie ogłoszenia i ankiety ➔
                  </a>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden lg:flex flex-col items-end text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{user.name}</span>
                    {user.number && (
                      <span className="bg-slate-800 text-bone text-[11px] px-1.5 py-0.2 rounded font-mono font-black border border-slate-700">
                        #{user.number}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5">
                    {getRoleBadge(user)}
                  </div>
                </div>

                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-xs sm:text-sm">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition"
                  title="Wyloguj"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <a
                  href="/login"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-slate-200 border border-slate-700"
                >
                  Logowanie
                </a>
                <a
                  href="/register"
                  className="hidden xs:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition"
                >
                  Dołącz
                </a>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0c1016] border-b border-slate-800 px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-2xl">
          <a
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
              pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-sky-400" />
            <span>Pulpit</span>
          </a>

          <a
            href="/events"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
              pathname.startsWith('/events') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Terminarz & Frekwencja</span>
          </a>

          <div className="pt-1 pb-1 border-y border-slate-800/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 px-3 tracking-wider">Rozgrywki</span>
            <a
              href="/rozgrywki?tab=sparingi"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>1. Sparingi</span>
            </a>
            <a
              href="/rozgrywki?tab=liga"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900"
            >
              <img src="/lals_logo.png" alt="LALS" className="w-4 h-4 rounded-full object-contain" />
              <span>2. Liga LALS & Tabela</span>
            </a>
            <a
              href="/rozgrywki?tab=turnieje"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900"
            >
              <Trophy className="w-4 h-4 text-purple-400" />
              <span>3. Turnieje</span>
            </a>
          </div>

          <a
            href="/fees"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
              pathname === '/fees' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Składki i Płatności (BLIK)</span>
          </a>

          <a
            href="/team"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
              pathname === '/team' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-slate-300" />
            <span>Kadra Drużyny</span>
          </a>

          <a
            href="/taktyka"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
              pathname === '/taktyka' || pathname.startsWith('/coach') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Target className="w-4 h-4 text-sky-400" />
            <span>Tablica Taktyczna</span>
          </a>

          {(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.permissions?.isAdmin) && (
            <a
              href="/admin"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                pathname === '/admin' ? 'bg-amber-500/20 text-amber-300' : 'text-amber-400 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Centrum Administracji</span>
            </a>
          )}

          {/* PWA Install Button in Mobile Menu */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              window.dispatchEvent(new CustomEvent('open-pwa-install'));
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition mt-2"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>Zainstaluj aplikację na telefonie</span>
            </span>
            <Download className="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>
      )}
    </header>
  );
}
