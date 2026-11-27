import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDatabaseAsync } from '@/lib/db';
import {
  signToken,
  AUTH_COOKIE_NAME,
  authenticateSuperAdmin,
  getSuperAdminUser,
} from '@/lib/auth';
import { listClubsAsync, ACTIVE_CLUB_COOKIE_NAME, DEFAULT_CLUB_ID } from '@/lib/clubs';

export async function POST(request: Request) {
  try {
    const isHttps =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.url.startsWith('https://');
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Podaj login / e-mail i hasło' }, { status: 400 });
    }

    // 1. Dedicated Platform SuperAdmin login ("admin" or "admin@volleyhub.pl")
    if (authenticateSuperAdmin(String(email), String(password))) {
      const superUser = getSuperAdminUser();
      const token = signToken(superUser, DEFAULT_CLUB_ID);
      const response = NextResponse.json({
        success: true,
        user: superUser,
        redirectTo: '/superadmin',
        message: 'Zalogowano jako Administrator Portalu (SuperAdmin)',
      });
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.delete(ACTIVE_CLUB_COOKIE_NAME);
      return response;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const clubs = await listClubsAsync();

    let matchedUser: any = null;
    let matchedClubId = DEFAULT_CLUB_ID;

    for (const club of clubs) {
      if (!club.isActive && club.id !== DEFAULT_CLUB_ID) continue;
      const db = await readDatabaseAsync(club.id);
      const found = db.users.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail ||
          (club.id === DEFAULT_CLUB_ID && normalizedEmail === 'kierownik@volley.pl' && u.name.toLowerCase().includes('kremer'))
      );
      if (found && found.passwordHash) {
        const isValid = bcrypt.compareSync(password, found.passwordHash);
        if (isValid) {
          matchedUser = found;
          matchedClubId = club.id;
          break;
        }
      }
    }

    if (!matchedUser) {
      return NextResponse.json({ error: 'Nieprawidłowy login / e-mail lub hasło' }, { status: 401 });
    }

    const token = signToken(matchedUser, matchedClubId);
    const { passwordHash: _, ...safeUser } = matchedUser;
    const matchedClub = clubs.find((c) => c.id === matchedClubId);

    const response = NextResponse.json({
      success: true,
      user: {
        ...safeUser,
        clubId: matchedClubId,
        isSuperAdmin: false,
      },
      club: matchedClub,
      redirectTo: '/',
      message: `Zalogowano jako ${safeUser.name} (${matchedClub?.name || 'Klub'})`,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set({
      name: ACTIVE_CLUB_COOKIE_NAME,
      value: matchedClubId,
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas logowania' }, { status: 500 });
  }
}

