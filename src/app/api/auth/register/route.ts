import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDatabase, writeDatabase } from '@/lib/db';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { User, Role, PlayerPosition } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, number, position, height, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Uzupełnij wymagane pola (Imię i nazwisko, e-mail, hasło, rola)' }, { status: 400 });
    }

    const db = readDatabase();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Użytkownik o takim adresie e-mail już istnieje' }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(password, 8);
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as Role,
      number: number ? parseInt(number, 10) : undefined,
      position: position as PlayerPosition || (role === 'ZAWODNIK' ? 'Przyjmujący' : role === 'TRENER' ? 'Sztab trenerski' : 'Zarząd'),
      height: height ? parseInt(height, 10) : undefined,
      phone: phone ? phone.trim() : undefined,
      status: 'Aktywny',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // If new user is a ZAWODNIK, create pending payment records for existing active fees
    if (newUser.role === 'ZAWODNIK') {
      db.fees.forEach(fee => {
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

    writeDatabase(db);

    const token = signToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Konto zostało pomyślnie utworzone!',
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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

