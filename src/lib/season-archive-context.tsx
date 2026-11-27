'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface SeasonSummary {
  id: string;
  name: string;
  archivedAt: string;
  archivedById: string;
  archivedByName: string;
  summary: {
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    totalEvents: number;
    trainingsCount: number;
    sparringsCount: number;
    totalFeesCollected: number;
    totalPlayers: number;
    averageAttendance: number;
    leagueStanding?: string;
    totalPointsScored?: number;
    mvpLeader?: string;
    topScorer?: string;
  };
}

interface SeasonArchiveContextType {
  isArchiveMode: boolean;
  activeArchiveId: string | null;
  activeSeason: SeasonSummary | null;
  seasons: SeasonSummary[];
  loadingSeasons: boolean;
  enterArchiveMode: (seasonId: string) => void;
  exitArchiveMode: () => void;
  refreshSeasons: () => Promise<void>;
}

const SeasonArchiveContext = createContext<SeasonArchiveContextType>({
  isArchiveMode: false,
  activeArchiveId: null,
  activeSeason: null,
  seasons: [],
  loadingSeasons: false,
  enterArchiveMode: () => {},
  exitArchiveMode: () => {},
  refreshSeasons: async () => {},
});

export function SeasonArchiveProvider({ children }: { children: ReactNode }) {
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);

  // Sync with cookie and localStorage on mount
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )active_season_id=([^;]*)/);
      const cookieVal = match ? decodeURIComponent(match[1]) : null;
      const localVal = localStorage.getItem('active_season_id');
      const val = (cookieVal && cookieVal !== 'current') ? cookieVal : (localVal && localVal !== 'current') ? localVal : null;
      if (val) {
        setActiveArchiveId(val);
      }
    } catch (e) {
      console.error('Error reading season archive state:', e);
    }
  }, []);

  const refreshSeasons = async () => {
    try {
      setLoadingSeasons(true);
      const res = await fetch('/api/admin/seasons');
      if (res.ok) {
        const data = await res.json();
        setSeasons(data.seasons || []);
      }
    } catch (e) {
      console.error('Fetch seasons error:', e);
    } finally {
      setLoadingSeasons(false);
    }
  };

  useEffect(() => {
    refreshSeasons();
  }, []);

  const activeSeason = seasons.find(s => s.id === activeArchiveId) || null;
  const isArchiveMode = Boolean(activeArchiveId && activeArchiveId !== 'current');

  const enterArchiveMode = (seasonId: string) => {
    try {
      document.cookie = `active_season_id=${encodeURIComponent(seasonId)}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem('active_season_id', seasonId);
      setActiveArchiveId(seasonId);
      // Reload window so all client requests and server-rendered data immediately sync
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const exitArchiveMode = () => {
    try {
      document.cookie = 'active_season_id=current; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem('active_season_id');
      setActiveArchiveId(null);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SeasonArchiveContext.Provider
      value={{
        isArchiveMode,
        activeArchiveId,
        activeSeason,
        seasons,
        loadingSeasons,
        enterArchiveMode,
        exitArchiveMode,
        refreshSeasons,
      }}
    >
      {children}
    </SeasonArchiveContext.Provider>
  );
}

export function useSeasonArchive() {
  return useContext(SeasonArchiveContext);
}

