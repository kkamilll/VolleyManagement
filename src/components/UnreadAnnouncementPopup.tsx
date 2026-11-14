'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Announcement } from '@/lib/types';
import {
  Bell,
  Clock,
  AlertTriangle,
  Megaphone,
  Pin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Timer,
  X,
  Check
} from 'lucide-react';

const SNOOZE_STORAGE_KEY = 'angels_snoozed_announcements';
const GUEST_READ_STORAGE_KEY = 'angels_guest_read_announcements';

interface SnoozeMap {
  [announcementId: string]: number; // timestamp in ms until which it is snoozed
}

export default function UnreadAnnouncementPopup() {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeUnread, setActiveUnread] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

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
    // Wait until authentication is finished to prevent flash / race condition
    if (authLoading) return;

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
  }, [user, authLoading]);

  // Fetch announcements from API
  const fetchAnnouncements = useCallback(async () => {
    if (authLoading) return;
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
  }, [evaluateActiveAnnouncements, authLoading]);

  // Initial fetch once auth is ready, plus periodic background check
  useEffect(() => {
    if (authLoading) return;
    fetchAnnouncements();

    const interval = setInterval(() => {
      fetchAnnouncements();
    }, 25000);

    const handleExternalRead = () => {
      fetchAnnouncements();
    };

    window.addEventListener('announcementRead', handleExternalRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('announcementRead', handleExternalRead);
    };
  }, [fetchAnnouncements, authLoading]);

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

    const remaining = activeUnread.filter(a => a.id !== current.id);
    setActiveUnread(remaining);

    if (remaining.length === 0) {
      setIsOpen(false);
    } else if (currentIndex >= remaining.length) {
      setCurrentIndex(0);
    }
  };

  // Explicit close via 'X' button
  const handleClose = () => {
    handleSnooze(60); // Snooze for 1 hour on explicit X click
  };

  // Do not render if auth is still loading, or if no unread announcements exist
  if (authLoading || !isOpen || !current) return null;

  const isUrgent = current.priority === 'PILNY';
  const isImportant = current.priority === 'WAZNY';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-150"
      >
        {/* Top Close Button (X) */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition flex items-center justify-center cursor-pointer"
          title="Zamknij powiadomienie (przypomnij za 1h)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header: Badge, Step Counter, Pin */}
        <div className="flex items-center justify-between gap-2 pr-8">
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Pilny Komunikat</span>
              </span>
            ) : isImportant ? (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-amber-700" />
                <span>Ważne Ogłoszenie</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-sky-600" />
                <span>Komunikat Klubu</span>
              </span>
            )}

            {current.isPinned && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Pin className="w-3 h-3 text-amber-500 rotate-45" />
                <span>Przypięte</span>
              </span>
            )}
          </div>

          {/* Multiple items stepper */}
          {activeUnread.length > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Poprzedni komunikat"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>{currentIndex + 1}/{activeUnread.length}</span>
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.min(activeUnread.length - 1, i + 1))}
                disabled={currentIndex === activeUnread.length - 1}
                className="hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Następny komunikat"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-950 tracking-tight leading-snug">
            {current.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="font-semibold text-slate-700">
              {current.createdByName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
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
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[35vh] overflow-y-auto whitespace-pre-line font-medium">
          {current.content}
        </div>

        {/* Optional External / Page Link */}
        {current.link && (
          <div className="pt-0.5">
            <a
              href={current.link}
              target={current.link.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs transition"
            >
              <span>Otwórz powiązany link</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
            </a>
          </div>
        )}

        {/* Action Buttons: Confirm Read vs Snooze (Remind me later) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Snooze button with dropdown toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-200 cursor-pointer"
              title="Przypomnij mi później"
            >
              <Timer className="w-3.5 h-3.5 text-slate-500" />
              <span>Przypomnij później ▾</span>
            </button>

            {/* Snooze options popover */}
            {showSnoozeOptions && (
              <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-20 space-y-0.5 text-xs">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400">
                  Przypomnij za:
                </div>
                {[
                  { label: 'Za 15 minut', minutes: 15 },
                  { label: 'Za 1 godzinę', minutes: 60 },
                  { label: 'Za 3 godziny', minutes: 180 },
                  { label: 'Jutro', minutes: 1440 },
                ].map(opt => (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => handleSnooze(opt.minutes)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
                  >
                    {opt.label}
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
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{marking ? 'Zapisywanie...' : 'Potwierdzam przeczytanie'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
