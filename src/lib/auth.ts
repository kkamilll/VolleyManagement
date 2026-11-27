import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User, UserPermissions } from './types';
import { readDatabaseAsync } from './db';
import { ACTIVE_CLUB_COOKIE_NAME, DEFAULT_CLUB_ID, getClubById } from './clubs';
import { JWT_SECRET } from './jwt';

const IS_PROD = process.env.NODE_ENV === 'production';
export const AUTH_COOKIE_NAME = 'volley_auth_session';

export const SUPERADMIN_ID = 'platform_superadmin';
export const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'admin@volleyhub.pl').toLowerCase().trim();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || (IS_PROD ? '' : 'admin123');

export function getSuperAdminUser(): User & { clubId?: string; isSuperAdmin: true } {
  return {
    id: SUPERADMIN_ID,
    name: 'Administrator Portalu',
    email: SUPERADMIN_EMAIL,
    role: 'KIEROWNIK',
    status: 'Aktywny',
    createdAt: '2026-01-01T00:00:00.000Z',
    isSuperAdmin: true,
    permissions: {
      isAdmin: true,
      canManageMatches: true,
      canManageEvents: true,
      canManageFees: true,
      canManageTactics: true,
      canManageStats: true,
      canPostAnnouncements: true,
      canCreatePolls: true,
    },
  };
}

export function authenticateSuperAdmin(identifier: string, password: string): boolean {
  if (!SUPERADMIN_PASSWORD) {
    return false;
  }
  const norm = identifier.toLowerCase().trim();
  const isLoginMatch = norm === 'admin' || norm === SUPERADMIN_EMAIL;
  if (!isLoginMatch) return false;
  const a = Buffer.from(password, 'utf8');
  const b = Buffer.from(SUPERADMIN_PASSWORD, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isPlatformSuperAdmin(user: { id?: string; email?: string; isSuperAdmin?: boolean } | null | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.id === SUPERADMIN_ID) return true;
  if (user.email && user.email.toLowerCase().trim() === SUPERADMIN_EMAIL) return true;
  return false;
}

export function hasPermission(user: User | null, perm: keyof UserPermissions): boolean {
  if (!user) return false;
  
  // Kierownik, Kapitan (Łukasz Kremer) oraz Kamil Pujanek (Konto Główne / Admin) mają pełne, nadrzędne uprawnienia
  const isSuperAdmin =
    user.role === 'KIEROWNIK' ||
    Boolean(user.isCaptain) ||
    user.id === 'usr_pujanek' ||
    user.id === 'usr_kierownik' ||
    user.id === 'usr_kremer' ||
    Boolean(user.permissions?.isAdmin) ||
    (Boolean(user.email) && [
      'kierownik@volley.pl',
      'kamil.pujanek@volley.pl',
      'lukasz.kremer@volley.pl'
    ].includes(user.email.toLowerCase().trim()));

  if (isSuperAdmin) return true;

  // Indywidualne uprawnienia nadane użytkownikowi
  if (user.permissions && user.permissions[perm] !== undefined) {
    return Boolean(user.permissions[perm]);
  }

  // Domyślne uprawnienia dla ról:
  // TRENER: może układać taktyki, prowadzić treningi/sparingi, dodawać ogłoszenia i ankiety.
  // ALE NIE MOŻE dodawać/edytować oficjalnych meczów ligowych (canManageMatches: false),
  // ani zarządzać kasą/składkami (canManageFees: false), ani administrować kontami (isAdmin: false).
  if (user.role === 'TRENER') {
    if (perm === 'isAdmin') return false;
    if (perm === 'canManageFees') return false;
    if (perm === 'canManageMatches') return false;
    if (perm === 'canManageStats') return false;
    if (perm === 'canManageTactics') return true;
    if (perm === 'canManageEvents') return true;
    if (perm === 'canPostAnnouncements') return true;
    if (perm === 'canCreatePolls') return true;
    return false;
  }

  // ZAWODNICY: najniższe uprawnienia (tylko odczyt taktyki, zgłaszanie obecności, płatność składek, wysyłanie próśb)
  return false;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  clubId?: string;
  isSuperAdmin?: boolean;
}

export function signToken(user: User, clubId: string = DEFAULT_CLUB_ID): string {
  const superAdmin = isPlatformSuperAdmin(user);
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    clubId,
    isSuperAdmin: superAdmin,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

const SAFE_CLUB_SLUG_RE = /^[a-z0-9-_]{1,64}$/i;

export function getActiveClubIdFromCookies(): string {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        if (payload.isSuperAdmin || isPlatformSuperAdmin({ id: payload.userId, email: payload.email })) {
          const override = cookieStore.get(ACTIVE_CLUB_COOKIE_NAME)?.value;
          if (override && (SAFE_CLUB_SLUG_RE.test(override) || getClubById(override))) {
            return override;
          }
        }
        if (payload.clubId && (SAFE_CLUB_SLUG_RE.test(payload.clubId) || getClubById(payload.clubId))) {
          return payload.clubId;
        }
      }
    }
  } catch {
    // Outside request context (e.g. build / script)
  }
  return DEFAULT_CLUB_ID;
}

export async function getServerUser(): Promise<(User & { clubId?: string; isSuperAdmin?: boolean }) | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    if (payload.isSuperAdmin || payload.userId === SUPERADMIN_ID) {
      return getSuperAdminUser();
    }

    const homeClubId = payload.clubId || DEFAULT_CLUB_ID;
    const db = await readDatabaseAsync(homeClubId);
    const user = db.users.find(u => u.id === payload.userId);
    if (!user) return null;

    // Return without passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return {
      ...(safeUser as User),
      clubId: homeClubId,
      isSuperAdmin: false,
    };
  } catch {
    return null;
  }
}

