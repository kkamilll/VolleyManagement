import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { MatchResult, VolleyballSet, LeagueMatchReport, Announcement } from '@/lib/types';

export async function GET(request: Request) {
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);
  const sortedMatches = [...db.matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Compute team statistics
  let totalWins = 0;
  let totalLosses = 0;
  let setsWon = 0;
  let setsLost = 0;
  let pointsWon = 0;
  let pointsLost = 0;

  sortedMatches.forEach(m => {
    if (m.teamSetsWon > m.opponentSetsWon) totalWins++;
    else if (m.opponentSetsWon > m.teamSetsWon) totalLosses++;

    setsWon += m.teamSetsWon;
    setsLost += m.opponentSetsWon;

    m.sets.forEach(s => {
      pointsWon += s.teamScore || 0;
      pointsLost += s.opponentScore || 0;
    });
  });

  // Attach linked report summaries if available
  const reportsMap = new Map<string, LeagueMatchReport>();
  (db.leagueReports || []).forEach(r => reportsMap.set(r.id, r));

  const enrichedMatches = sortedMatches.map(m => {
    const report = m.reportId ? reportsMap.get(m.reportId) : undefined;
    return {
      ...m,
      linkedReport: report ? {
        id: report.id,
        matchTitle: report.matchTitle,
        homeTeam: report.homeTeam,
        awayTeam: report.awayTeam,
        date: report.date
      } : undefined
    };
  });

  return NextResponse.json({
    matches: enrichedMatches,
    stats: {
      totalMatches: sortedMatches.length,
      totalWins,
      totalLosses,
      winRate: sortedMatches.length > 0 ? Math.round((totalWins / sortedMatches.length) * 100) : 0,
      setsWon,
      setsLost,
      setRatio: setsLost > 0 ? (setsWon / setsLost).toFixed(2) : setsWon.toFixed(2),
      pointsWon,
      pointsLost,
      pointRatio: pointsLost > 0 ? (pointsWon / pointsLost).toFixed(2) : pointsWon.toFixed(2),
    }
  });
}

export async function POST(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    const canManage = user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canManageMatches');
    if (!canManage) {
      return NextResponse.json({ error: 'Tylko Trener, Kapitan lub Kierownik może dodawać mecze' }, { status: 403 });
    }

    const body = await request.json();
    const { opponent, date, location, isHome, matchType, sets, mvp, notes, coachComments, reportId, leaguePhaseId, leaguePhaseName } = body;

    if (!opponent || !date || !sets || !Array.isArray(sets) || sets.length === 0) {
      return NextResponse.json({ error: 'Wypełnij wymagane pola (Przeciwnik, data, sety)' }, { status: 400 });
    }

    let teamSetsWon = 0;
    let opponentSetsWon = 0;

    const validatedSets: VolleyballSet[] = sets.map((s: { teamScore: number; opponentScore: number }, idx: number) => {
      const teamScore = Number(s.teamScore) || 0;
      const opponentScore = Number(s.opponentScore) || 0;

      if (teamScore > opponentScore) {
        teamSetsWon++;
      } else if (opponentScore > teamScore) {
        opponentSetsWon++;
      }

      return {
        setNumber: idx + 1,
        teamScore,
        opponentScore
      };
    });

    const db = readDatabase();

    const newMatch: MatchResult = {
      id: `mat_${Date.now()}`,
      opponent: opponent.trim(),
      date,
      location: location ? location.trim() : 'Hala domowa',
      isHome: Boolean(isHome),
      matchType: matchType || 'Mecz ligowy',
      sets: validatedSets,
      teamSetsWon,
      opponentSetsWon,
      mvp: mvp ? mvp.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      coachComments: coachComments ? coachComments.trim() : undefined,
      createdById: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      reportId: reportId ? reportId.trim() : undefined,
      leaguePhaseId: leaguePhaseId || (matchType === 'Mecz ligowy' ? (db.activeLeaguePhaseId || 'faza_1') : undefined),
      leaguePhaseName: leaguePhaseName || undefined
    };
    db.matches.push(newMatch);

    // Auto-create match result announcement
    if (!db.announcements) db.announcements = [];
    const won = newMatch.teamSetsWon > newMatch.opponentSetsWon;
    const matchScoreStr = `${newMatch.teamSetsWon}:${newMatch.opponentSetsWon}`;
    const setsDetails = newMatch.sets.map(s => `${s.teamScore}:${s.opponentScore}`).join(', ');

    db.announcements.unshift({
      id: `ann_mat_${newMatch.id}_${Date.now()}`,
      title: `${won ? '🏆 Wygrana!' : '🏐 Wynik meczu:'} Angels ZTP ${matchScoreStr} ${newMatch.opponent}`,
      content: `Rozegrano mecz (${newMatch.matchType}). Końcowy rezultat: ${matchScoreStr} (${setsDetails}). ${newMatch.mvp ? `MVP meczu: ${newMatch.mvp}.` : ''} Sprawdź protokół i statystyki w zakładce Rozgrywki!`,
      priority: won ? 'WAZNY' : 'NORMALNY',
      category: 'MECZ',
      link: '/rozgrywki?tab=liga',
      createdById: user.id,
      createdByName: user.name,
      createdByRole: user.role,
      createdAt: new Date().toISOString(),
      readBy: [{ userId: user.id, userName: user.name, readAt: new Date().toISOString() }]
    });

    // If reportId provided, link the report back
    if (newMatch.reportId && db.leagueReports) {
      const rep = db.leagueReports.find(r => r.id === newMatch.reportId);
      if (rep) {
        rep.matchId = newMatch.id;
      }
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      match: newMatch,
      message: 'Wynik meczu został pomyślnie dodany!'
    });
  } catch (error) {
    console.error('Add match error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas zapisywania meczu' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    const canManage = user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canManageMatches'));
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do edycji meczu' }, { status: 403 });
    }

    const body = await request.json();
    const { id, reportId, mvp, coachComments, notes, leaguePhaseId, leaguePhaseName } = body;

    if (!id) {
      return NextResponse.json({ error: 'Brak ID meczu' }, { status: 400 });
    }

    const db = readDatabase();
    const match = db.matches.find(m => m.id === id);
    if (!match) {
      return NextResponse.json({ error: 'Mecz nie istnieje' }, { status: 404 });
    }

    // If reportId is changing
    if (reportId !== undefined) {
      const oldReportId = match.reportId;
      match.reportId = reportId || undefined;

      // Update old report link if existed
      if (oldReportId && db.leagueReports) {
        const oldRep = db.leagueReports.find(r => r.id === oldReportId);
        if (oldRep && oldRep.matchId === match.id) {
          oldRep.matchId = undefined;
        }
      }

      // Update new report link if exists
      if (reportId && db.leagueReports) {
        const newRep = db.leagueReports.find(r => r.id === reportId);
        if (newRep) {
          newRep.matchId = match.id;
        }
      }
    }

    if (mvp !== undefined) match.mvp = mvp?.trim() || undefined;
    if (coachComments !== undefined) match.coachComments = coachComments?.trim() || undefined;
    if (notes !== undefined) match.notes = notes?.trim() || undefined;
    if (leaguePhaseId !== undefined) match.leaguePhaseId = leaguePhaseId || undefined;
    if (leaguePhaseName !== undefined) match.leaguePhaseName = leaguePhaseName || undefined;

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      match,
      message: 'Mecz został zaktualizowany!'
    });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    const canManage = user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canManageMatches'));
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do usuwania' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Brak ID meczu' }, { status: 400 });
    }

    const db = readDatabase();
    const matchToRemove = db.matches.find(m => m.id === id);
    if (matchToRemove?.reportId && db.leagueReports) {
      const rep = db.leagueReports.find(r => r.id === matchToRemove.reportId);
      if (rep && rep.matchId === matchToRemove.id) {
        rep.matchId = undefined;
      }
    }

    db.matches = db.matches.filter(m => m.id !== id);
    writeDatabase(db);

    return NextResponse.json({ success: true, message: 'Mecz został usunięty' });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas usuwania meczu' }, { status: 500 });
  }
}
