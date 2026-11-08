import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDatabase } from '@/lib/db';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, quickUserId } = body;
    const db = readDatabase();

    let user;

    // Fast demo login switcher
    if (quickUserId) {
      user = db.users.find(u => u.id === quickUserId);
      if (!user) {
        return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
      }
    } else {
      if (!email || !password) {
        return NextResponse.json({ error: 'Podaj adres e-mail i hasło' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      user = db.users.find(u => 
        u.email.toLowerCase() === normalizedEmail ||
        (normalizedEmail === 'kierownik@volley.pl' && u.name.toLowerCase().includes('kremer'))
      );
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: 'Nieprawidłowy e-mail lub hasło' }, { status: 401 });
      }

      const isValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Nieprawidłowy e-mail lub hasło' }, { status: 401 });
      }
    }

    const token = signToken(user);
    const { passwordHash: _, ...safeUser } = user;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: `Zalogowano jako ${safeUser.name} (${safeUser.role})`,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas logowania' }, { status: 500 });
  }
}

