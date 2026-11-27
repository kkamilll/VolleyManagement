import fs from 'fs';
import path from 'path';
import { AppDatabase } from './types';
import { getMongoDb, isMongoConfigured } from './mongodb';
import {
  Club,
  ClubPlan,
  ClubTheme,
  CLUB_THEMES,
  DEFAULT_CLUB_ID,
  ACTIVE_CLUB_COOKIE_NAME,
  getClubTheme,
} from './club-types';

export type { Club, ClubPlan, ClubTheme };
export { CLUB_THEMES, DEFAULT_CLUB_ID, ACTIVE_CLUB_COOKIE_NAME, getClubTheme };

const DATA_DIR = path.join(process.cwd(), 'data');
const CLUBS_FILE = path.join(DATA_DIR, 'clubs.json');
const CLUBS_DATA_DIR = path.join(DATA_DIR, 'clubs');

const DEFAULT_CLUB: Club = {
  id: DEFAULT_CLUB_ID,
  name: 'Angels ZTP',
  shortName: 'ANGELS ZTP',
  subtitle: 'VOLLEYBALL TEAM',
  city: '',
  leagueName: 'Lubońska Amatorska Liga Siatkówki (LALS)',
  logoUrl: '/logo.jpg',
  themeId: 'navy-gold',
  inviteCode: process.env.DEFAULT_CLUB_INVITE_CODE || 'DEMO-CLUB-CODE',
  ownerName: 'Kamil Pujanek',
  ownerEmail: 'kamil.pujanek@angelsztp.pl',
  plan: 'CLUB',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

let clubsMemoryCache: Club[] | null = null;
let clubsCacheFetchedAt = 0;
const CLUBS_CACHE_TTL_MS = 10_000;
const MONGO_CLUBS_DOC_ID = 'clubs_registry';

function ensureDefaultClub(clubs: Club[]): Club[] {
  if (!Array.isArray(clubs) || clubs.length === 0) {
    return [DEFAULT_CLUB];
  }
  if (!clubs.some((c) => c.id === DEFAULT_CLUB_ID)) {
    return [DEFAULT_CLUB, ...clubs];
  }
  return clubs;
}

function ensureClubsRegistryDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CLUBS_DATA_DIR)) {
      fs.mkdirSync(CLUBS_DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem (e.g. Vercel serverless)
  }
}

export function listClubs(): Club[] {
  if (clubsMemoryCache && clubsMemoryCache.length > 0) {
    return clubsMemoryCache;
  }
  ensureClubsRegistryDir();
  if (!fs.existsSync(CLUBS_FILE)) {
    const initial = [DEFAULT_CLUB];
    clubsMemoryCache = initial;
    try {
      fs.writeFileSync(CLUBS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    } catch {}
    return initial;
  }
  try {
    const raw = fs.readFileSync(CLUBS_FILE, 'utf-8');
    const parsed = ensureDefaultClub(JSON.parse(raw) as Club[]);
    clubsMemoryCache = parsed;
    return parsed;
  } catch {
    return clubsMemoryCache || [DEFAULT_CLUB];
  }
}

export async function listClubsAsync(): Promise<Club[]> {
  if (isMongoConfigured()) {
    try {
      const mongoDb = await getMongoDb();
      if (mongoDb) {
        const col = mongoDb.collection('app_state');
        const doc = await col.findOne({ _id: MONGO_CLUBS_DOC_ID as any });
        if (doc && Array.isArray(doc.clubs) && doc.clubs.length > 0) {
          const normalized = ensureDefaultClub(doc.clubs as Club[]);
          clubsMemoryCache = normalized;
          clubsCacheFetchedAt = Date.now();
          return normalized;
        }
        // Seed MongoDB from local clubs.json on first run
        const localClubs = listClubs();
        await col.updateOne(
          { _id: MONGO_CLUBS_DOC_ID as any },
          { $set: { clubs: localClubs, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        clubsMemoryCache = localClubs;
        clubsCacheFetchedAt = Date.now();
        return localClubs;
      }
    } catch (err) {
      console.warn('[MongoDB Atlas] Błąd odczytu rejestru klubów, używam lokalnego fallbacku.');
    }
  }
  return listClubs();
}

export async function saveClubsAsync(clubs: Club[]): Promise<void> {
  const normalized = ensureDefaultClub(clubs);
  clubsMemoryCache = normalized;
  clubsCacheFetchedAt = Date.now();

  if (isMongoConfigured()) {
    try {
      const mongoDb = await getMongoDb();
      if (mongoDb) {
        await mongoDb.collection('app_state').updateOne(
          { _id: MONGO_CLUBS_DOC_ID as any },
          { $set: { clubs: normalized, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('[MongoDB Atlas] Błąd zapisu rejestru klubów.');
    }
  }

  ensureClubsRegistryDir();
  try {
    fs.writeFileSync(CLUBS_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem (e.g. Vercel serverless)
  }
}

export function saveClubs(clubs: Club[]): void {
  const normalized = ensureDefaultClub(clubs);
  clubsMemoryCache = normalized;
  clubsCacheFetchedAt = Date.now();
  ensureClubsRegistryDir();
  try {
    fs.writeFileSync(CLUBS_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem (e.g. Vercel serverless)
  }
  if (isMongoConfigured()) {
    saveClubsAsync(normalized).catch((e) =>
      console.error('[MongoDB Atlas] Sync error on saveClubs:', e)
    );
  }
}

export function getClubById(clubId?: string | null): Club | undefined {
  if (!clubId) return listClubs().find((c) => c.id === DEFAULT_CLUB_ID);
  return listClubs().find((c) => c.id === clubId);
}

export async function getClubByIdAsync(clubId?: string | null): Promise<Club | undefined> {
  const clubs = await listClubsAsync();
  if (!clubId) return clubs.find((c) => c.id === DEFAULT_CLUB_ID);
  return clubs.find((c) => c.id === clubId);
}

export function getClubByInviteCode(code: string): Club | undefined {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  return listClubs().find((c) => c.inviteCode.toUpperCase() === normalized && c.isActive);
}

export async function getClubByInviteCodeAsync(code: string): Promise<Club | undefined> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  const clubs = await listClubsAsync();
  return clubs.find((c) => c.inviteCode.toUpperCase() === normalized && c.isActive);
}

export function generateClubSlug(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'klub';

  const existing = new Set(listClubs().map((c) => c.id));
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

export function generateInviteCode(name: string): string {
  const prefix = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6) || 'VOLLEY';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

export function getClubDbFilePath(clubId: string): { dbFile: string; backupFile: string; backupsDir: string } {
  if (!clubId || clubId === DEFAULT_CLUB_ID) {
    return {
      dbFile: path.join(DATA_DIR, 'db.json'),
      backupFile: path.join(DATA_DIR, 'db.backup.json'),
      backupsDir: path.join(DATA_DIR, 'backups'),
    };
  }
  const safeId = clubId.replace(/[^a-z0-9-_]/gi, '');
  const dir = path.join(CLUBS_DATA_DIR, safeId);
  const backupsDir = path.join(dir, 'backups');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
  } catch {
    // Read-only filesystem (e.g. Vercel serverless)
  }
  return {
    dbFile: path.join(dir, 'db.json'),
    backupFile: path.join(dir, 'db.backup.json'),
    backupsDir,
  };
}

export function getEmptyClubDatabase(): AppDatabase {
  return {
    users: [],
    matches: [],
    events: [],
    leagueReports: [],
    fees: [],
    payments: [],
    treasuryExpenses: [],
    announcements: [],
    polls: [],
    tactics: [],
    tacticalMaterials: [],
    scoutingReports: [],
    seasonsArchive: [],
    leaguePhotos: [],
    leagueTable: [],
    leaguePhases: [],
    leagueSchedule: [],
    leaguePlayerRankings: [],
    trainingPlans: [],
  };
}

export function createClubRecord(input: {
  name: string;
  city: string;
  leagueName?: string;
  logoUrl?: string;
  themeId?: ClubTheme['id'];
  ownerName: string;
  ownerEmail: string;
  plan?: ClubPlan;
}): Club {
  const clubs = listClubs();
  const id = generateClubSlug(input.name);
  const club: Club = {
    id,
    name: input.name.trim(),
    shortName: input.name.trim().toUpperCase().slice(0, 22),
    subtitle: input.city?.trim() ? `${input.city.trim().toUpperCase()}` : 'VOLLEYBALL CLUB',
    city: input.city?.trim() || 'Polska',
    leagueName: input.leagueName?.trim() || 'Liga Amatorska',
    logoUrl: input.logoUrl?.trim() || '',
    themeId: input.themeId || 'navy-gold',
    inviteCode: generateInviteCode(input.name),
    ownerName: input.ownerName.trim(),
    ownerEmail: input.ownerEmail.trim().toLowerCase(),
    plan: input.plan || 'FREE',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  clubs.push(club);
  saveClubs(clubs);
  return club;
}

export async function createClubRecordAsync(input: {
  name: string;
  city: string;
  leagueName?: string;
  logoUrl?: string;
  themeId?: ClubTheme['id'];
  ownerName: string;
  ownerEmail: string;
  plan?: ClubPlan;
}): Promise<Club> {
  const clubs = await listClubsAsync();
  const id = generateClubSlug(input.name);
  const club: Club = {
    id,
    name: input.name.trim(),
    shortName: input.name.trim().toUpperCase().slice(0, 22),
    subtitle: input.city?.trim() ? `${input.city.trim().toUpperCase()}` : 'VOLLEYBALL CLUB',
    city: input.city?.trim() || 'Polska',
    leagueName: input.leagueName?.trim() || 'Liga Amatorska',
    logoUrl: input.logoUrl?.trim() || '',
    themeId: input.themeId || 'navy-gold',
    inviteCode: generateInviteCode(input.name),
    ownerName: input.ownerName.trim(),
    ownerEmail: input.ownerEmail.trim().toLowerCase(),
    plan: input.plan || 'FREE',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  clubs.push(club);
  await saveClubsAsync(clubs);
  return club;
}

export function updateClubRecord(clubId: string, patch: Partial<Omit<Club, 'id' | 'createdAt'>>): Club | null {
  const clubs = listClubs();
  const idx = clubs.findIndex((c) => c.id === clubId);
  if (idx === -1) return null;
  clubs[idx] = { ...clubs[idx], ...patch };
  saveClubs(clubs);
  return clubs[idx];
}

export async function updateClubRecordAsync(
  clubId: string,
  patch: Partial<Omit<Club, 'id' | 'createdAt'>>
): Promise<Club | null> {
  const clubs = await listClubsAsync();
  const idx = clubs.findIndex((c) => c.id === clubId);
  if (idx === -1) return null;
  clubs[idx] = { ...clubs[idx], ...patch };
  await saveClubsAsync(clubs);
  return clubs[idx];
}

export function deleteClubRecord(clubId: string): boolean {
  if (clubId === DEFAULT_CLUB_ID) return false;
  const clubs = listClubs();
  const next = clubs.filter((c) => c.id !== clubId);
  if (next.length === clubs.length) return false;
  saveClubs(next);
  try {
    const safeId = clubId.replace(/[^a-z0-9-_]/gi, '');
    const dir = path.join(CLUBS_DATA_DIR, safeId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {}
  return true;
}

export async function deleteClubRecordAsync(clubId: string): Promise<boolean> {
  if (clubId === DEFAULT_CLUB_ID) return false;
  const clubs = await listClubsAsync();
  const next = clubs.filter((c) => c.id !== clubId);
  if (next.length === clubs.length) return false;
  await saveClubsAsync(next);

  if (isMongoConfigured()) {
    try {
      const mongoDb = await getMongoDb();
      if (mongoDb) {
        await mongoDb.collection('app_state').deleteOne({ _id: `club_${clubId}` as any });
      }
    } catch {}
  }

  try {
    const safeId = clubId.replace(/[^a-z0-9-_]/gi, '');
    const dir = path.join(CLUBS_DATA_DIR, safeId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {}
  return true;
}
