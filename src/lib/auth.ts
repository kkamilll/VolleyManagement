import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User, UserPermissions } from './types';
import { readDatabase } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'volley-secret-key-super-safe-2026';
export const AUTH_COOKIE_NAME = 'volley_auth_session';

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
}

export function signToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
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

export async function getServerUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const db = readDatabase();
    const user = db.users.find(u => u.id === payload.userId);
    if (!user) return null;

    // Return without passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser as User;
  } catch {
    return null;
  }
}

