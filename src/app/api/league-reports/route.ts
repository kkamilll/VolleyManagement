import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import {
  parseVolleyStationMultiReport,
  parseVolleyStationSchedule,
  computeLeaderboards
} from '@/lib/volleystation-parser';
import { LeagueMatchReport, MatchResult, Announcement } from '@/lib/types';

export async function GET(request: Request) {
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);
  const reports = db.leagueReports || [];

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const leaderboards = computeLeaderboards(sortedReports);

  // Enrich reports with linked match info
  const matchesMap = new Map<string, MatchResult>();
  (db.matches || []).forEach(m => {
    matchesMap.set(m.id, m);
    if (m.reportId) matchesMap.set(m.reportId, m);
  });

  const enrichedReports = sortedReports.map(r => {
    const linkedMatch = r.matchId 
      ? matchesMap.get(r.matchId) 
      : matchesMap.get(r.id);

    return {
      ...r,
      linkedMatch: linkedMatch ? {
        id: linkedMatch.id,
        opponent: linkedMatch.opponent,
        teamSetsWon: linkedMatch.teamSetsWon,
        opponentSetsWon: linkedMatch.opponentSetsWon,
        date: linkedMatch.date,
        matchType: linkedMatch.matchType,
      } : undefined
    };
  });

  return NextResponse.json({
    reports: enrichedReports,
    leaderboards
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

    const body = await request.json();
    const { rawText, matchTitle, date, autoCreateMatch, linkedMatchId, mode, leaguePhaseId, leaguePhaseName } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: 'Wklej tekst ze statystykami lub terminarzem VolleyStation' }, { status: 400 });
    }

    const db = readDatabase();
    if (!db.leagueReports) db.leagueReports = [];
    if (!db.matches) db.matches = [];

    // Check if user is importing a SCHEDULE / TERMINARZ
    const scheduleMatches = parseVolleyStationSchedule(rawText);
    if (scheduleMatches.length > 0 && (mode === 'schedule' || !rawText.includes('Nr\nZawodnik'))) {
      let createdCount = 0;
      let updatedCount = 0;

      scheduleMatches.forEach(sm => {
        const isAngelsHome = sm.homeTeam.toLowerCase().includes('angel');
        const isAngelsAway = sm.awayTeam.toLowerCase().includes('angel');

        // Only process matches concerning Angels ZTP if not specified otherwise
        const opponent = isAngelsHome ? sm.awayTeam : (isAngelsAway ? sm.homeTeam : `${sm.homeTeam} vs ${sm.awayTeam}`);
        const isHome = isAngelsHome;
        const ourSets = isAngelsHome ? sm.homeSetsWon : sm.awaySetsWon;
        const oppSets = isAngelsHome ? sm.awaySetsWon : sm.homeSetsWon;

        // Check if match already exists
        const matchDate = sm.date || date || new Date().toISOString();
        let existing = db.matches.find(m => 
          m.opponent.toLowerCase().includes(opponent.toLowerCase()) || 
          opponent.toLowerCase().includes(m.opponent.toLowerCase()) ||
          m.notes?.includes(sm.matchNumber.toString())
        );

        if (existing) {
          if (ourSets !== undefined && oppSets !== undefined) {
            existing.teamSetsWon = ourSets;
            existing.opponentSetsWon = oppSets;
          }
          if (sm.url) {
            existing.notes = `Mecz ligowy LALS (Runda ${sm.round}, Nr ${sm.matchNumber}). Raport: ${sm.url}`;
          }
          updatedCount++;
        } else if (isAngelsHome || isAngelsAway || autoCreateMatch) {
          const newMatch: MatchResult = {
            id: `mat_lals_${sm.matchNumber || Date.now()}`,
            opponent,
            date: matchDate,
            location: isHome ? 'Hala Luboń (Domowa)' : 'Wyjazd',
            isHome,
            matchType: 'Mecz ligowy',
            sets: (ourSets !== undefined && oppSets !== undefined) ? [
              { setNumber: 1, teamScore: ourSets > oppSets ? 25 : 21, opponentScore: ourSets > oppSets ? 21 : 25 }
            ] : [],
            teamSetsWon: ourSets ?? 0,
            opponentSetsWon: oppSets ?? 0,
            notes: `Mecz ligowy LALS (Runda ${sm.round}, Nr ${sm.matchNumber}). Protokół: ${sm.url}`,
            coachComments: `Zaimportowano terminarz z VolleyStation (Runda ${sm.round}).`,
            leaguePhaseId: leaguePhaseId || db.activeLeaguePhaseId || 'faza_1',
            leaguePhaseName: leaguePhaseName || undefined,
            createdById: user.id,
            createdByName: user.name,
            createdAt: new Date().toISOString()
          };
          db.matches.unshift(newMatch);
          createdCount++;
        }
      });

      if (!db.announcements) db.announcements = [];
      db.announcements.unshift({
        id: `ann_sched_${Date.now()}`,
        title: `📅 Zaktualizowano terminarz ligi LALS`,
        content: `Zaimportowano terminarz z VolleyStation (${scheduleMatches.length} spotkań). Sprawdź daty i rywali w rozgrywkach.`,
        priority: 'NORMALNY',
        category: 'MECZ',
        link: '/rozgrywki?tab=liga',
        createdById: user.id,
        createdByName: user.name,
        createdByRole: user.role,
        createdAt: new Date().toISOString(),
        readBy: [{ userId: user.id, userName: user.name, readAt: new Date().toISOString() }]
      });

      writeDatabase(db);
      return NextResponse.json({
        success: true,
        type: 'SCHEDULE',
        matches: scheduleMatches,
        createdCount,
        updatedCount,
        message: `Pomyślnie przetworzono terminarz VolleyStation! Rozpoznano ${scheduleMatches.length} meczów (Dodano: ${createdCount}, Zaktualizowano: ${updatedCount}).`
      });
    }

    // Otherwise, parse full Match Reports (support single or multiple matches)
    const reports = parseVolleyStationMultiReport(rawText, date);
    if (reports.length === 0) {
      return NextResponse.json({
        error: 'Nie udało się rozpoznać drużyn ani statystyk w podanym tekście. Upewnij się, że wklejasz dane z protokołu VolleyStation.'
      }, { status: 400 });
    }

    const savedReports: LeagueMatchReport[] = [];

    reports.forEach(newReport => {
      newReport.createdById = user.id;
      newReport.createdByName = user.name;
      newReport.leaguePhaseId = leaguePhaseId || db.activeLeaguePhaseId || 'faza_1';
      newReport.leaguePhaseName = leaguePhaseName || undefined;
      if (matchTitle && reports.length === 1) {
        newReport.matchTitle = matchTitle.trim();
      }

      // Check if auto-creating or linking match
      const homeTeam = newReport.homeTeam;
      const awayTeam = newReport.awayTeam;
      const isOurTeamHome = homeTeam.teamName.toLowerCase().includes('angel');
      const isOurTeamAway = awayTeam.teamName.toLowerCase().includes('angel');

      const ourTeam = isOurTeamHome ? homeTeam : (isOurTeamAway ? awayTeam : awayTeam);
      const opponentTeam = isOurTeamHome ? awayTeam : homeTeam;

      const ourSetsWon = isOurTeamHome ? (newReport.homeSetsWon ?? 0) : (newReport.awaySetsWon ?? 0);
      const oppSetsWon = isOurTeamHome ? (newReport.awaySetsWon ?? 0) : (newReport.homeSetsWon ?? 0);

      const setsForMatch = (newReport.sets || []).map(s => ({
        setNumber: s.setNumber,
        teamScore: isOurTeamHome ? s.homeScore : s.awayScore,
        opponentScore: isOurTeamHome ? s.awayScore : s.homeScore
      }));

      const mvpString = newReport.mvp 
        ? `${newReport.mvp.name} (${newReport.mvp.teamName || 'MVP'})` 
        : undefined;

      if (autoCreateMatch || linkedMatchId) {
        if (linkedMatchId) {
          const targetMatch = db.matches.find(m => m.id === linkedMatchId);
          if (targetMatch) {
            targetMatch.reportId = newReport.id;
            targetMatch.teamSetsWon = ourSetsWon;
            targetMatch.opponentSetsWon = oppSetsWon;
            if (setsForMatch.length > 0) targetMatch.sets = setsForMatch;
            if (mvpString) targetMatch.mvp = mvpString;
            newReport.matchId = targetMatch.id;
          }
        } else {
          // Check if match for this opponent exists around this date
          let targetMatch = db.matches.find(m => 
            m.opponent.toLowerCase().includes(opponentTeam.teamName.toLowerCase()) || 
            opponentTeam.teamName.toLowerCase().includes(m.opponent.toLowerCase())
          );

          if (!targetMatch) {
            const newMatchId = `mat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            targetMatch = {
              id: newMatchId,
              opponent: opponentTeam.teamName,
              date: newReport.date,
              location: isOurTeamHome ? 'Hala Luboń (Domowa)' : 'Hala Wyjazdowa',
              isHome: isOurTeamHome,
              matchType: 'Mecz ligowy',
              sets: setsForMatch,
              teamSetsWon: ourSetsWon,
              opponentSetsWon: oppSetsWon,
              mvp: mvpString,
              notes: `Oficjalny protokół VolleyStation powiązany z meczem ligowym. Czas: ${newReport.duration || '-'}, Widzów: ${newReport.spectators || '-'}.`,
              coachComments: `Sędziował: ${newReport.referee || '-'}. MVP: ${mvpString || '-'}`,
              leaguePhaseId: leaguePhaseId || db.activeLeaguePhaseId || 'faza_1',
              leaguePhaseName: leaguePhaseName || undefined,
              createdById: user.id,
              createdByName: user.name,
              createdAt: new Date().toISOString(),
              reportId: newReport.id
            };
            db.matches.unshift(targetMatch);
          } else {
            targetMatch.reportId = newReport.id;
            targetMatch.teamSetsWon = ourSetsWon;
            targetMatch.opponentSetsWon = oppSetsWon;
            if (setsForMatch.length > 0) targetMatch.sets = setsForMatch;
            if (mvpString) targetMatch.mvp = mvpString;
          }
          newReport.matchId = targetMatch.id;
        }
      }

      // Check for duplicate report with same title/date
      const existingIdx = db.leagueReports.findIndex(r => 
        r.matchTitle.toLowerCase() === newReport.matchTitle.toLowerCase() ||
        (r.homeTeam.teamName === newReport.homeTeam.teamName && r.awayTeam.teamName === newReport.awayTeam.teamName)
      );

      if (existingIdx >= 0) {
        db.leagueReports[existingIdx] = { ...newReport, id: db.leagueReports[existingIdx].id };
        savedReports.push(db.leagueReports[existingIdx]);
      } else {
        db.leagueReports.unshift(newReport);
        savedReports.push(newReport);
      }
    });

    if (!db.announcements) db.announcements = [];
    const reportTitles = savedReports.map(r => r.matchTitle).slice(0, 2).join(', ');
    db.announcements.unshift({
      id: `ann_rep_${Date.now()}`,
      title: `📊 Oficjalne statystyki meczu LALS`,
      content: `Zaimportowano raport: ${reportTitles}. Dostępne są szczegółowe statystyki: punkty, ataki, bloki, asy i MVP!`,
      priority: 'WAZNY',
      category: 'MECZ',
      link: '/rozgrywki?tab=liga',
      createdById: user.id,
      createdByName: user.name,
      createdByRole: user.role,
      createdAt: new Date().toISOString(),
      readBy: [{ userId: user.id, userName: user.name, readAt: new Date().toISOString() }]
    });

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      type: 'REPORTS',
      reports: savedReports,
      count: savedReports.length,
      message: `Pomyślnie zaimportowano ${savedReports.length} ${savedReports.length === 1 ? 'protokół meczowy' : 'protokoły meczowe'} z VolleyStation!`
    });
  } catch (error) {
    console.error('Save league report error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas przetwarzania raportu' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    const canManage = user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canManageMatches'));
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do edycji raportu' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, matchId } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Brak ID raportu' }, { status: 400 });
    }

    const db = readDatabase();
    const report = (db.leagueReports || []).find(r => r.id === reportId);
    if (!report) {
      return NextResponse.json({ error: 'Raport nie istnieje' }, { status: 404 });
    }

    const oldMatchId = report.matchId;
    report.matchId = matchId || undefined;

    // Unlink old match if any
    if (oldMatchId) {
      const oldMatch = db.matches.find(m => m.id === oldMatchId);
      if (oldMatch && oldMatch.reportId === reportId) {
        oldMatch.reportId = undefined;
      }
    }

    // Link new match if provided
    if (matchId) {
      const newMatch = db.matches.find(m => m.id === matchId);
      if (newMatch) {
        newMatch.reportId = reportId;
      }
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Powiązanie raportu z meczem zostało pomyślnie zaktualizowane!'
    });
  } catch (error) {
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
      return NextResponse.json({ error: 'Brak ID raportu' }, { status: 400 });
    }

    const db = readDatabase();
    db.matches.forEach(m => {
      if (m.reportId === id) m.reportId = undefined;
    });

    db.leagueReports = (db.leagueReports || []).filter(r => r.id !== id);
    writeDatabase(db);

    return NextResponse.json({ success: true, message: 'Raport został usunięty' });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas usuwania' }, { status: 500 });
  }
}

