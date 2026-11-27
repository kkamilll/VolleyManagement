import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerUser, isPlatformSuperAdmin } from '@/lib/auth';
import { readDatabaseAsync, writeDatabaseAsync } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 });
    }

    if (isPlatformSuperAdmin(user)) {
      return NextResponse.json(
        { error: 'Hasło SuperAdmina zmienia się przez zmienną środowiskową SUPERADMIN_PASSWORD.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Podaj obecne oraz nowe hasło.' }, { status: 400 });
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków.' }, { status: 400 });
    }

    const db = await readDatabaseAsync(user.clubId);
    const targetUser = (db.users || []).find((u) => u.id === user.id);
    if (!targetUser || !targetUser.passwordHash) {
      return NextResponse.json({ error: 'Nie znaleziono konta użytkownika.' }, { status: 404 });
    }

    const isCurrentValid = bcrypt.compareSync(String(currentPassword), targetUser.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Obecne hasło jest nieprawidłowe.' }, { status: 400 });
    }

    targetUser.passwordHash = bcrypt.hashSync(String(newPassword), 8);
    await writeDatabaseAsync(db, user.clubId);

    return NextResponse.json({
      success: true,
      message: 'Hasło zostało pomyślnie zmienione.',
    });
  } catch (error) {
    console.error('POST /api/auth/change-password error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas zmiany hasła.' }, { status: 500 });
  }
}
