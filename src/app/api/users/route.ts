import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role, PlayerPosition } from '@/lib/types';

export async function GET(request: Request) {
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);
  const safeUsers = db.users.map(({ passwordHash: _, ...u }) => u);
  return NextResponse.json({ users: safeUsers });
}

export async function PUT(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const currentUser = await getServerUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, role, number, position, height, phone, status, stats, isCaptain } = body;

    const isStaff = currentUser.role === 'KIEROWNIK' || currentUser.role === 'TRENER' || currentUser.isCaptain;
    // Only Kierownik, Trener or Captain can edit other players; users can edit themselves
    if (id !== currentUser.id && !isStaff) {
      return NextResponse.json({ error: 'Brak uprawnień do edycji tego profilu' }, { status: 403 });
    }

    const db = readDatabase();
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    const targetUser = db.users[userIndex];
    if (name) targetUser.name = name.trim();
    if (currentUser.role === 'KIEROWNIK' && role) {
      targetUser.role = role as Role;
    }
    if (isCaptain !== undefined && (currentUser.role === 'KIEROWNIK' || currentUser.role === 'TRENER')) {
      targetUser.isCaptain = Boolean(isCaptain);
    }
    if (number !== undefined) targetUser.number = number ? Number(number) : undefined;
    if (position) targetUser.position = position as PlayerPosition;
    if (height !== undefined) targetUser.height = height ? Number(height) : undefined;
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (status) targetUser.status = status;
    if (stats !== undefined && isStaff) {
      targetUser.stats = {
        ...(targetUser.stats || {}),
        ...stats
      };
    }

    writeDatabase(db);

    const { passwordHash: _, ...safeUser } = targetUser;
    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Profil został pomyślnie zaktualizowany'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas aktualizacji profilu' }, { status: 500 });
  }
}

