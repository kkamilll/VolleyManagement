'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Announcement } from '@/lib/types';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Megaphone,
  Pin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Timer,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

const SNOOZE_STORAGE_KEY = 'angels_snoozed_announcements';
const GUEST_READ_STORAGE_KEY = 'angels_guest_read_announcements';

interface SnoozeMap {
  [announcementId: string]: number; // timestamp in ms until which it is snoozed
}

export default function UnreadAnnouncementPopup() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeUnread, setActiveUnread] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [shake, setShake] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [noticeToast, setNoticeToast] = useState<string | null>(null);

  // Helper to read snoozed map
  const getSnoozeMap = (): SnoozeMap => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(SNOOZE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  // Helper to save snoozed map
  const saveSnoozeMap = (map: SnoozeMap) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving snooze map:', e);
    }
  };

  // Helper to read guest read IDs
  const getGuestReadList = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(GUEST_READ_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  // Helper to add to guest read list
  const addGuestRead = (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const list = getGuestReadList();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(GUEST_READ_STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error saving guest read:', e);
    }
  };

  // Filter unread and non-snoozed announcements
  const evaluateActiveAnnouncements = useCallback((all: Announcement[]) => {
    const now = Date.now();
    const snoozeMap = getSnoozeMap();
    const guestRead = getGuestReadList();

    const filtered = all.filter(ann => {
      // Check if read by current user or guest
      const isRead = user
        ? ann.readBy?.some(r => r.userId === user.id)
        : guestRead.includes(ann.id);

      if (isRead) return false;

      // Check if snoozed
      const snoozedUntil = snoozeMap[ann.id];
      if (snoozedUntil && snoozedUntil > now) {
        return false;
      }

      return true;
    });

    setActiveUnread(filtered);
    if (filtered.length > 0) {
      setIsOpen(true);
      setCurrentIndex(0);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  // Fetch announcements from API
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        const incoming: Announcement[] = data.announcements || [];
        setAnnouncements(incoming);
        evaluateActiveAnnouncements(incoming);
      }
    } catch (e) {
      console.error('Failed to load announcements for popup:', e);
    }
  }, [evaluateActiveAnnouncements]);

  // Initial fetch and periodic snooze check
  useEffect(() => {
    fetchAnnouncements();

    // Check every 20 seconds for expired snoozes or new announcements
    const interval = setInterval(() => {
      fetchAnnouncements();
    }, 20000);

    const handleExternalRead = () => {
      fetchAnnouncements();
    };

    window.addEventListener('announcementRead', handleExternalRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('announcementRead', handleExternalRead);
    };
  }, [fetchAnnouncements]);

  // Current active announcement
  const current = activeUnread[currentIndex];

  // Action: Confirm Read (User acknowledges the announcement)
  const handleConfirmRead = async () => {
    if (!current || marking) return;
    setMarking(true);

    try {
      if (user) {
        await fetch(`/api/announcements/${current.id}/read`, { method: 'POST' });
      } else {
        addGuestRead(current.id);
      }

      // Notify Navbar bell to update badge immediately
      window.dispatchEvent(new CustomEvent('announcementRead', { detail: { id: current.id } }));

      // Clean up snooze if any
      const snoozeMap = getSnoozeMap();
      if (snoozeMap[current.id]) {
        delete snoozeMap[current.id];
        saveSnoozeMap(snoozeMap);
      }

      // Show temporary positive feedback
      setNoticeToast('✓ Potwierdzono przeczytanie komunikatu');
      setTimeout(() => setNoticeToast(null), 2500);

      // Remove from current active list
      const remaining = activeUnread.filter(a => a.id !== current.id);
      setActiveUnread(remaining);

      if (remaining.length === 0) {
        setIsOpen(false);
      } else if (currentIndex >= remaining.length) {
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error('Error confirming read:', e);
    } finally {
      setMarking(false);
    }
  };

  // Action: Snooze (Remind me later)
  const handleSnooze = (minutes: number) => {
    if (!current) return;

    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    const snoozeMap = getSnoozeMap();
    snoozeMap[current.id] = snoozeUntil;
    saveSnoozeMap(snoozeMap);

    setShowSnoozeOptions(false);
    setNoticeToast(`⏰ Odłożono na ${minutes} min. Komunikat pojawi się ponownie.`);
    setTimeout(() => setNoticeToast(null), 3000);

    const remaining = activeUnread.filter(a => a.id !== current.id);
    setActiveUnread(remaining);

    if (remaining.length === 0) {
      setIsOpen(false);
    } else if (currentIndex >= remaining.length) {
      setCurrentIndex(0);
    }
  };

  // Handle attempt to dismiss without choosing an action
  const handleBlockedDismiss = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
    setNoticeToast('Wybierz: "Potwierdzam przeczytanie" lub "Przypomnij mi później"');
    setTimeout(() => setNoticeToast(null), 3000);
  };

  if (!isOpen || !current) return null;

  const isUrgent = current.priority === 'PILNY';
  const isImportant = current.priority === 'WAZNY';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={handleBlockedDismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-white border ${
          isUrgent 
            ? 'border-rose-400 shadow-rose-500/20' 
            : isImportant 
            ? 'border-amber-400 shadow-amber-500/20' 
            : 'border-sky-400 shadow-sky-500/20'
        } rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl space-y-5 transition-transform duration-200 ${
          shake ? 'animate-shake' : 'animate-in zoom-in-95'
        }`}
      >
        {/* Top Header: Badge, Step Counter, Pin */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {isUrgent ? (
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1.5 shadow-sm animate-pulse">
                <AlertTriangle className="w-4 h-4 text-white" />
                <span>PILNY KOMUNIKAT</span>
              </span>
            ) : isImportant ? (
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                <Megaphone className="w-4 h-4 text-slate-950" />
                <span>WAŻNE OGŁOSZENIE</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-600 text-white flex items-center gap-1.5 shadow-sm">
                <Bell className="w-4 h-4 text-white" />
                <span>KOMUNIKAT DRUŻYNY</span>
              </span>
            )}

            {current.isPinned && (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Pin className="w-3 h-3 text-amber-600 rotate-45" />
                <span>Przypięty</span>
              </span>
            )}
          </div>

          {/* Multiple items stepper */}
          {activeUnread.length > 1 && (
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Poprzedni komunikat"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{currentIndex + 1} z {activeUnread.length}</span>
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.min(activeUnread.length - 1, i + 1))}
                disabled={currentIndex === activeUnread.length - 1}
                className="hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Następny komunikat"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight font-athletic leading-snug">
            {current.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="font-bold text-slate-700">
              Autor: {current.createdByName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date(current.createdAt).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base text-slate-800 leading-relaxed max-h-[40vh] overflow-y-auto whitespace-pre-line font-medium">
          {current.content}
        </div>

        {/* Optional External / Page Link */}
        {current.link && (
          <div className="pt-1">
            <a
              href={current.link}
              target={current.link.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold text-xs uppercase tracking-wider transition shadow-2xs"
            >
              <span>Otwórz powiązany link</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
            </a>
          </div>
        )}

        {/* Notice / Warning Shake Alert */}
        {noticeToast && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{noticeToast}</span>
          </div>
        )}

        {/* Action Buttons: Confirm Read vs Snooze (Remind me later) */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Snooze button with dropdown toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border border-slate-300 shadow-2xs"
                title="Przypomnij mi później (komunikat pojawi się ponownie)"
              >
                <Timer className="w-4 h-4 text-slate-600" />
                <span>Przypomnij mi później ▾</span>
              </button>

              {/* Snooze options popover */}
              {showSnoozeOptions && (
                <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-20 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400">
                    Wybierz czas odłożenia:
                  </div>
                  {[
                    { label: '⏰ Za 10 minut', minutes: 10 },
                    { label: '⏰ Za 30 minut', minutes: 30 },
                    { label: '⏰ Za 1 godzinę', minutes: 60 },
                    { label: '⏰ Za 3 godziny', minutes: 180 },
                  ].map(opt => (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => handleSnooze(opt.minutes)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 font-bold transition flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary confirmation button */}
            <button
              type="button"
              onClick={handleConfirmRead}
              disabled={marking}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{marking ? 'Zapisywanie...' : '✓ Potwierdzam przeczytanie'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-medium">
            Komunikat nie zniknie, dopóki nie potwierdzisz przeczytania lub nie odłożysz na później.
          </p>
        </div>
      </div>
    </div>
  );
}

