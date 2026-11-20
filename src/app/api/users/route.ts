import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role, PlayerPosition } from '@/lib/types';

export async function GET(request: Request) {
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);
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
    const { id, name, role, number, position, height, phone, status, stats, isCaptain, avatar } = body;

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

