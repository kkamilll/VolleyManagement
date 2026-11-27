'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Club, ClubTheme } from '@/lib/club-types';
import { CLUB_THEMES } from '@/lib/club-types';

interface ClubContextType {
  club: Club | null;
  theme: ClubTheme;
  allClubs: Club[];
  isSuperAdmin: boolean;
  loadingClub: boolean;
  refreshClub: () => Promise<void>;
  switchClub: (clubId: string) => Promise<boolean>;
}

const DEFAULT_THEME = CLUB_THEMES[0];

const ClubContext = createContext<ClubContextType>({
  club: null,
  theme: DEFAULT_THEME,
  allClubs: [],
  isSuperAdmin: false,
  loadingClub: true,
  refreshClub: async () => {},
  switchClub: async () => false,
});

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingClub, setLoadingClub] = useState(true);

  const refreshClub = async () => {
    setLoadingClub(true);
    try {
      const res = await fetch('/api/clubs/current', { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setClub(data.club || null);
        setIsSuperAdmin(Boolean(data.isSuperAdmin));
        setAllClubs(data.allClubs || []);
      }
    } catch (e) {
      console.error('ClubContext fetch error:', e);
    } finally {
      setLoadingClub(false);
    }
  };

  useEffect(() => {
    refreshClub();
  }, [user?.id]);

  const effectiveIsSuperAdmin =
    isSuperAdmin ||
    Boolean((user as { isSuperAdmin?: boolean } | null)?.isSuperAdmin) ||
    user?.id === 'platform_superadmin';

  const switchClub = async (clubId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/clubs/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId }),
      });
      if (res.ok) {
        await refreshClub();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const theme = CLUB_THEMES.find((t) => t.id === club?.themeId) || DEFAULT_THEME;

  return (
    <ClubContext.Provider
      value={{
        club,
        theme,
        allClubs,
        isSuperAdmin: effectiveIsSuperAdmin,
        loadingClub,
        refreshClub,
        switchClub,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

export const useClub = () => useContext(ClubContext);
