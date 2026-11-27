import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDatabaseAsync, writeDatabaseAsync } from '@/lib/db';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { User, Role, PlayerPosition } from '@/lib/types';
import {
  ACTIVE_CLUB_COOKIE_NAME,
  DEFAULT_CLUB_ID,
  getClubByIdAsync,
  getClubByInviteCodeAsync,
  listClubsAsync,
} from '@/lib/clubs';

export async function POST(request: Request) {
  try {
    const isHttps =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.url.startsWith('https://');
    const body = await request.json();
    const { name, email, password, role, number, position, height, phone, inviteCode, clubId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Uzupełnij wymagane pola (Imię i nazwisko, e-mail, hasło)' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Hasło musi zawierać co najmniej 6 znaków' }, { status: 400 });
    }

    // Require a valid invite code for self-registration (prevents unauthorized signups into any club)
    if (!inviteCode || !String(inviteCode).trim()) {
      return NextResponse.json(
        { error: 'Podaj kod zaproszenia klubu otrzymany od trenera lub kierownika.' },
        { status: 400 }
      );
    }

    const targetClub = await getClubByInviteCodeAsync(String(inviteCode).trim());
    if (!targetClub || !targetClub.isActive) {
      return NextResponse.json(
        { error: 'Nieprawidłowy lub nieaktywny kod zaproszenia klubu. Poproś trenera lub kierownika o aktualny kod.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Ensure email is unique across all clubs so login always unambiguously identifies the user's club
    const allClubs = await listClubsAsync();
    for (const c of allClubs) {
      const cDb = await readDatabaseAsync(c.id);
      if (cDb.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return NextResponse.json({ error: 'Użytkownik o takim adresie e-mail już istnieje w portalu' }, { status: 400 });
      }
    }

    const db = await readDatabaseAsync(targetClub.id);

    // Bezpieczeństwo: Samodzielna rejestracja tworzy konto ze statusem ZAWODNIK.
    const hasUsers = Boolean(db.users && db.users.length > 0);
    const assignedRole: Role = hasUsers ? 'ZAWODNIK' : ((role as Role) || 'KIEROWNIK');

    const passwordHash = bcrypt.hashSync(password, 8);
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      role: assignedRole,
      number: number ? parseInt(number, 10) : undefined,
      position: (position as PlayerPosition) || 'Przyjmujący',
      height: height ? parseInt(height, 10) : undefined,
      phone: phone ? phone.trim() : undefined,
      status: 'Aktywny',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    if (newUser.role === 'ZAWODNIK') {
      db.fees.forEach((fee) => {
        db.payments.push({
          id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          feeId: fee.id,
          userId: newUser.id,
          userName: newUser.name,
          amount: fee.amount,
          status: 'OCZEKUJE',
        });
      });
    }

    await writeDatabaseAsync(db, targetClub.id);

    const token = signToken(newUser, targetClub.id);
    const { passwordHash: _, ...safeUser } = newUser;

    const response = NextResponse.json({
      success: true,
      user: { ...safeUser, clubId: targetClub.id },
      club: targetClub,
      message: `Konto zostało pomyślnie utworzone w klubie ${targetClub.name}!`,
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
      value: targetClub.id,
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas rejestracji' }, { status: 500 });
  }
}

