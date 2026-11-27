import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  readDatabaseAsync,
  writeDatabaseAsync,
  getEffectiveDatabaseAsync,
  getActiveSeasonIdFromRequest,
} from '@/lib/db';
import { getServerUser, isPlatformSuperAdmin } from '@/lib/auth';
import { listClubsAsync } from '@/lib/clubs';
import { User, Role, PlayerPosition } from '@/lib/types';

export async function GET(request: Request) {
  const currentUser = await getServerUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = await getEffectiveDatabaseAsync(seasonId);
  const now = new Date();
  const playedLeagueEvents = (db.events || []).filter(
    e => e.type === 'MECZ' && (Boolean(e.result) || e.status === 'ZAKONCZONY' || new Date(e.date) <= now)
  );
  const playedSparringEvents = (db.events || []).filter(
    e => e.type === 'SPARING' && (Boolean(e.result) || e.status === 'ZAKONCZONY')
  );

  const safeUsers = db.users.map(({ passwordHash: _, ...u }) => {
    const attendedLeague = playedLeagueEvents.filter(e =>
      (e.actualAttendees && e.actualAttendees.includes(u.id)) ||
      (e.attendees || []).some(a => a.userId === u.id && a.status === 'BEDE')
    ).length;
    const attendedSparrings = playedSparringEvents.filter(e =>
      (e.actualAttendees && e.actualAttendees.includes(u.id)) ||
      (e.attendees || []).some(a => a.userId === u.id && a.status === 'BEDE')
    ).length;

    const currentMatches = u.stats?.matchesPlayed || 0;
    const currentSparrings = u.stats?.sparringsPlayed || 0;

    if (attendedLeague > currentMatches || attendedSparrings > currentSparrings) {
      return {
        ...u,
        stats: {
          totalPoints: u.stats?.totalPoints || 0,
          attackPoints: u.stats?.attackPoints || 0,
          blockPoints: u.stats?.blockPoints || 0,
          acePoints: u.stats?.acePoints || 0,
          ...(u.stats || {}),
          matchesPlayed: Math.max(currentMatches, attendedLeague),
          sparringsPlayed: Math.max(currentSparrings, attendedSparrings),
        }
      };
    }
    return u;
  });

  return NextResponse.json({ users: safeUsers });
}

export async function POST(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const currentUser = await getServerUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const isSuper = isPlatformSuperAdmin(currentUser);
    const isManager = isSuper || currentUser.role === 'KIEROWNIK' || Boolean(currentUser.permissions?.isAdmin);
    const isStaff = isManager || currentUser.role === 'TRENER' || Boolean(currentUser.isCaptain);
    if (!isStaff) {
      return NextResponse.json({ error: 'Tylko Kierownik, Trener lub Kapitan może dodawać członków drużyny.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, number, position, height, phone, isCaptain } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Podaj imię i nazwisko, e-mail oraz hasło startowe.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Hasło musi mieć co najmniej 6 znaków.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Ensure unique email across all clubs
    const allClubs = await listClubsAsync();
    for (const c of allClubs) {
      const cDb = await readDatabaseAsync(c.id);
      if ((cDb.users || []).some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return NextResponse.json({ error: 'Użytkownik o takim adresie e-mail już istnieje w portalu.' }, { status: 400 });
      }
    }

    const requestedRole: Role = role === 'KIEROWNIK' || role === 'TRENER' ? role : 'ZAWODNIK';
    const assignedRole: Role = isManager ? requestedRole : 'ZAWODNIK';

    const validPositions: PlayerPosition[] = [
      'Przyjmujący',
      'Atakujący',
      'Rozgrywający',
      'Środkowy',
      'Libero',
      'Sztab trenerski',
      'Zarząd',
    ];
    const defaultPos: PlayerPosition =
      assignedRole === 'KIEROWNIK' ? 'Zarząd' : assignedRole === 'TRENER' ? 'Sztab trenerski' : 'Przyjmujący';
    const assignedPosition: PlayerPosition = validPositions.includes(position) ? position : defaultPos;

    const db = await readDatabaseAsync();
    const passwordHash = bcrypt.hashSync(String(password), 8);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(name).trim(),
      email: normalizedEmail,
      role: assignedRole,
      isCaptain: isManager ? Boolean(isCaptain) : false,
      number: number !== undefined && number !== '' ? Number(number) : undefined,
      position: assignedPosition,
      height: height !== undefined && height !== '' ? Number(height) : undefined,
      phone: phone ? String(phone).trim() : '',
      status: 'Aktywny',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    if (newUser.role === 'ZAWODNIK' && Array.isArray(db.fees)) {
      db.fees.forEach((fee) => {
        db.payments.push({
          id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          feeId: fee.id,
          userId: newUser.id,
          userName: newUser.name,
          amount: fee.amount,
          status: 'OCZEKUJE',
        });
      });
    }

    await writeDatabaseAsync(db);

    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json({
      success: true,
      user: safeUser,
      message: `Dodano członka drużyny: ${newUser.name}`,
    });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Błąd podczas dodawania członka drużyny.' }, { status: 500 });
  }
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
    const { id, name, role, number, position, height, phone, status, stats, isCaptain, avatar, newPassword } = body;

    const isSuper = isPlatformSuperAdmin(currentUser);
    const isManager = isSuper || currentUser.role === 'KIEROWNIK' || Boolean(currentUser.permissions?.isAdmin);
    const isStaff = isManager || currentUser.role === 'TRENER' || Boolean(currentUser.isCaptain);
    // Only Kierownik, Trener or Captain can edit other players; users can edit themselves
    if (id !== currentUser.id && !isStaff) {
      return NextResponse.json({ error: 'Brak uprawnień do edycji tego profilu' }, { status: 403 });
    }

    if (newPassword !== undefined && String(newPassword).trim() !== '') {
      if (!isManager) {
        return NextResponse.json({ error: 'Tylko Kierownik klubu może resetować hasła użytkowników.' }, { status: 403 });
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków.' }, { status: 400 });
      }
    }

    const db = await readDatabaseAsync();
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    const targetUser = db.users[userIndex];
    if (name) targetUser.name = name.trim();
    if ((currentUser.role === 'KIEROWNIK' || isPlatformSuperAdmin(currentUser)) && role) {
      targetUser.role = role as Role;
    }
    if (isCaptain !== undefined && (currentUser.role === 'KIEROWNIK' || currentUser.role === 'TRENER' || isPlatformSuperAdmin(currentUser))) {
      targetUser.isCaptain = Boolean(isCaptain);
    }
    if (number !== undefined) targetUser.number = number ? Number(number) : undefined;
    if (position) targetUser.position = position as PlayerPosition;
    if (height !== undefined) targetUser.height = height ? Number(height) : undefined;
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (status && isStaff) targetUser.status = status;
    if (avatar !== undefined) {
      targetUser.avatar = avatar ? String(avatar).trim() : undefined;
    }
    if (stats !== undefined && isStaff) {
      targetUser.stats = {
        ...(targetUser.stats || {}),
        ...stats
      };
    }
    if (newPassword !== undefined && String(newPassword).trim() !== '' && isManager) {
      targetUser.passwordHash = bcrypt.hashSync(String(newPassword), 8);
    }

    await writeDatabaseAsync(db);

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

