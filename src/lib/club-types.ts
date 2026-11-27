export type ClubPlan = 'FREE' | 'PRO' | 'CLUB';

export interface ClubTheme {
  id: 'navy-gold' | 'royal-sky' | 'crimson-dark' | 'emerald-dark' | 'violet-dark';
  label: string;
  primaryHex: string;
  accentHex: string;
  ribbonClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
}

export const CLUB_THEMES: ClubTheme[] = [
  {
    id: 'navy-gold',
    label: 'Navy & Gold (Klasyczny)',
    primaryHex: '#0f172a',
    accentHex: '#f59e0b',
    ribbonClass: 'from-slate-950 via-amber-500 to-slate-950',
    badgeBgClass: 'bg-slate-900',
    badgeTextClass: 'text-amber-400',
  },
  {
    id: 'royal-sky',
    label: 'Royal Blue & Sky',
    primaryHex: '#0c4a6e',
    accentHex: '#38bdf8',
    ribbonClass: 'from-sky-950 via-sky-400 to-sky-950',
    badgeBgClass: 'bg-sky-950',
    badgeTextClass: 'text-sky-300',
  },
  {
    id: 'crimson-dark',
    label: 'Crimson & Black',
    primaryHex: '#4c0519',
    accentHex: '#f43f5e',
    ribbonClass: 'from-slate-950 via-rose-500 to-slate-950',
    badgeBgClass: 'bg-rose-950',
    badgeTextClass: 'text-rose-300',
  },
  {
    id: 'emerald-dark',
    label: 'Emerald & Slate',
    primaryHex: '#064e3b',
    accentHex: '#10b981',
    ribbonClass: 'from-slate-950 via-emerald-500 to-slate-950',
    badgeBgClass: 'bg-emerald-950',
    badgeTextClass: 'text-emerald-300',
  },
  {
    id: 'violet-dark',
    label: 'Royal Purple & Gold',
    primaryHex: '#2e1065',
    accentHex: '#a855f7',
    ribbonClass: 'from-slate-950 via-purple-500 to-slate-950',
    badgeBgClass: 'bg-purple-950',
    badgeTextClass: 'text-purple-300',
  },
];

export interface Club {
  id: string;
  name: string;
  shortName: string;
  subtitle?: string;
  city: string;
  leagueName: string;
  logoUrl?: string;
  themeId: ClubTheme['id'];
  inviteCode: string;
  ownerName: string;
  ownerEmail: string;
  plan: ClubPlan;
  isActive: boolean;
  createdAt: string;
}

export const DEFAULT_CLUB_ID = 'angels-ztp';
export const ACTIVE_CLUB_COOKIE_NAME = 'volley_active_club';

export function getClubTheme(themeId?: string): ClubTheme {
  return CLUB_THEMES.find((t) => t.id === themeId) || CLUB_THEMES[0];
}
