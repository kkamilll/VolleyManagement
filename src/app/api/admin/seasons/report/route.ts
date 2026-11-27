import { NextRequest, NextResponse } from 'next/server';
import { readDatabaseAsync } from '@/lib/db';
import { getServerUser, getActiveClubIdFromCookies, isPlatformSuperAdmin } from '@/lib/auth';
import { getClubByIdAsync, DEFAULT_CLUB_ID } from '@/lib/clubs';

export const dynamic = 'force-dynamic';

function computeSeasonMetrics(params: {
  clubName: string;
  clubCity: string;
  clubLeague: string;
  clubLogo: string;
  users: any[];
  matches: any[];
  events: any[];
  leagueTable: any[];
  playerRankings: any[];
  fees: any[];
  payments: any[];
  treasury: any[];
  tactics: any[];
  trainingPlans: any[];
  scoutingReports: any[];
  announcements: any[];
}) {
  const {
    clubName,
    clubCity,
    clubLeague,
    clubLogo,
    users,
    matches,
    events,
    leagueTable,
    playerRankings,
    fees,
    payments,
    treasury,
    tactics,
    trainingPlans,
    scoutingReports,
    announcements,
  } = params;

  const now = Date.now();
  const completedEvents = events.filter(
    (e) => e.isCompleted || e.status === 'ZAKONCZONY' || new Date(e.date).getTime() < now
  );
  const trainingEvents = completedEvents.filter((e) => e.type === 'TRENING');
  const matchEvents = completedEvents.filter((e) => e.type === 'MECZ' || e.type === 'SPARING' || e.type === 'TURNIEJ');
  const sparringsCount = events.filter((e) => e.type === 'SPARING').length;
  const tournamentsCount = events.filter((e) => e.type === 'TURNIEJ').length;
  const upcomingEventsCount = events.filter((e) => new Date(e.date).getTime() >= now).length;

  // Standing in league table matching club name
  const standing = leagueTable.find(
    (t) => t.teamName && clubName && t.teamName.toLowerCase().includes(clubName.toLowerCase())
  );

  // Compute match & set totals from matches list (or standing fallback)
  const matchesPlayed = standing?.matchesPlayed ?? matches.length;
  const matchesWon = standing?.matchesWon ?? matches.filter((m) => (m.teamSetsWon || 0) > (m.opponentSetsWon || 0)).length;
  const matchesLost = standing?.matchesLost ?? matches.filter((m) => (m.teamSetsWon || 0) < (m.opponentSetsWon || 0)).length;
  const setsWon = standing?.setsWon ?? matches.reduce((acc, m) => acc + (Number(m.teamSetsWon) || 0), 0);
  const setsLost = standing?.setsLost ?? matches.reduce((acc, m) => acc + (Number(m.opponentSetsWon) || 0), 0);
  const setsRatio = setsLost > 0 ? (setsWon / setsLost).toFixed(2) : setsWon > 0 ? `${setsWon}.00` : '0.00';
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

  let pointsScored = standing?.pointsWon ?? 0;
  let pointsConceded = standing?.pointsLost ?? 0;
  if (!standing && matches.length > 0) {
    matches.forEach((m) => {
      (m.sets || []).forEach((s: any) => {
        pointsScored += Number(s.teamScore) || 0;
        pointsConceded += Number(s.opponentScore) || 0;
      });
    });
  }

  // Players list (include players + playing managers/coaches with a jersey number)
  const players = users.filter((u) => u.role === 'ZAWODNIK' || Boolean(u.number));
  const targetRoster = players.length > 0 ? players : users;

  const didAttend = (ev: any, userId: string) =>
    (Array.isArray(ev.actualAttendees) && ev.actualAttendees.includes(userId)) ||
    (Array.isArray(ev.attendees) && ev.attendees.some((a: any) => a.userId === userId && a.status === 'BEDE'));

  const playerStatsRaw = targetRoster.map((p) => {
    const attendedEvents = completedEvents.filter((ev) => didAttend(ev, p.id)).length;
    const attendancePercent = completedEvents.length > 0 ? Math.round((attendedEvents / completedEvents.length) * 100) : 0;

    const attendedTrainings = trainingEvents.filter((ev) => didAttend(ev, p.id)).length;
    const trainingAttendancePercent =
      trainingEvents.length > 0 ? Math.round((attendedTrainings / trainingEvents.length) * 100) : 0;

    const attendedMatches = matchEvents.filter((ev) => didAttend(ev, p.id)).length;

    const ranking = playerRankings.find(
      (r) =>
        r.name &&
        p.name &&
        (r.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(r.name.toLowerCase()))
    );

    const totalAttack = Number(ranking?.totalAttack ?? p.stats?.attackPoints ?? 0) || 0;
    const totalBlock = Number(ranking?.totalBlock ?? p.stats?.blockPoints ?? 0) || 0;
    const totalServe = Number(ranking?.totalServe ?? p.stats?.acePoints ?? p.stats?.servePoints ?? 0) || 0;
    const breakdownSum = totalAttack + totalBlock + totalServe;
    const totalPoints = Math.max(Number(ranking?.totalPoints ?? p.stats?.totalPoints ?? 0) || 0, breakdownSum);

    const mvpFromMatches = matches.filter(
      (m) => m.mvp && p.name && m.mvp.toLowerCase().includes(p.name.toLowerCase())
    ).length;
    const mvpCount = Math.max(mvpFromMatches, p.stats?.mvpCount ?? 0);

    const playerMatchesPlayed = Math.max(p.stats?.matchesPlayed ?? 0, attendedMatches);
    const sparringsPlayed = p.stats?.sparringsPlayed ?? 0;
    const avgPointsPerMatch =
      playerMatchesPlayed > 0 ? Math.round((totalPoints / playerMatchesPlayed) * 10) / 10 : 0;

    const attackShare = breakdownSum > 0 ? Math.round((totalAttack / breakdownSum) * 100) : 0;
    const blockShare = breakdownSum > 0 ? Math.round((totalBlock / breakdownSum) * 100) : 0;
    const serveShare = breakdownSum > 0 ? Math.max(0, 100 - attackShare - blockShare) : 0;

    const userPayments = payments.filter((pay) => pay.userId === p.id);
    const feesPaid = userPayments
      .filter((pay) => pay.status === 'OPLACONE')
      .reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);
    const feesPending = userPayments
      .filter((pay) => pay.status === 'OCZEKUJE' || pay.status === 'ZALEGLE')
      .reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);

    return {
      id: p.id,
      name: p.name,
      email: p.email || '',
      number: p.number ?? ranking?.number ?? null,
      position: p.position || ranking?.position || 'Zawodnik',
      role: p.role || 'ZAWODNIK',
      isCaptain: Boolean(p.isCaptain),
      phone: p.phone || '',
      avatar: p.avatar || '',
      status: p.status || 'Aktywny',
      attendedEvents,
      totalEvents: completedEvents.length,
      attendancePercent,
      attendedTrainings,
      totalTrainings: trainingEvents.length,
      trainingAttendancePercent,
      attendedMatches,
      totalMatchEvents: matchEvents.length,
      matchesPlayed: playerMatchesPlayed,
      sparringsPlayed,
      totalPoints,
      totalAttack,
      totalBlock,
      totalServe,
      attackShare,
      blockShare,
      serveShare,
      avgPointsPerMatch,
      mvpCount,
      rank: ranking?.rank || null,
      coachNotes: p.stats?.coachNotes || '',
      feesPaid,
      feesPending,
    };
  });

  const sortedStats = playerStatsRaw
    .sort((a, b) => b.totalPoints - a.totalPoints || b.attendancePercent - a.attendancePercent || a.name.localeCompare(b.name));

  // Specialist leaders
  const bestAttacker = [...sortedStats].filter((p) => p.totalAttack > 0).sort((a, b) => b.totalAttack - a.totalAttack)[0] || null;
  const bestBlocker = [...sortedStats].filter((p) => p.totalBlock > 0).sort((a, b) => b.totalBlock - a.totalBlock)[0] || null;
  const bestServer = [...sortedStats].filter((p) => p.totalServe > 0).sort((a, b) => b.totalServe - a.totalServe)[0] || null;
  const bestAttendance = [...sortedStats].filter((p) => p.totalEvents > 0).sort((a, b) => b.attendancePercent - a.attendancePercent || b.attendedEvents - a.attendedEvents)[0] || null;
  const topScorerObj = sortedStats.find((p) => p.totalPoints > 0) || null;

  const playerStats = sortedStats.map((p, idx) => {
    const badges: string[] = [];
    if (p.isCaptain) badges.push('Kapitan');
    if (topScorerObj && p.id === topScorerObj.id) badges.push('Lider Punktowy');
    if (p.mvpCount > 0) badges.push(`MVP (${p.mvpCount}×)`);
    if (bestBlocker && p.id === bestBlocker.id) badges.push('Najlepszy Blok');
    if (bestServer && p.id === bestServer.id) badges.push('Najlepsza Zagrywka');
    if (p.attendancePercent >= 80 && p.totalEvents > 0) badges.push('Żelazna Frekwencja');
    return { ...p, teamRank: idx + 1, badges };
  });

  const totalTeamPoints = playerStats.reduce((acc, p) => acc + (p.totalPoints || 0), 0);
  const totalTeamAttack = playerStats.reduce((acc, p) => acc + (p.totalAttack || 0), 0);
  const totalTeamBlock = playerStats.reduce((acc, p) => acc + (p.totalBlock || 0), 0);
  const totalTeamServe = playerStats.reduce((acc, p) => acc + (p.totalServe || 0), 0);
  const scoringBreakdown = {
    totalPoints: totalTeamPoints,
    totalAttack: totalTeamAttack,
    totalBlock: totalTeamBlock,
    totalServe: totalTeamServe,
    attackPct: totalTeamPoints > 0 ? Math.round((totalTeamAttack / totalTeamPoints) * 100) : 0,
    blockPct: totalTeamPoints > 0 ? Math.round((totalTeamBlock / totalTeamPoints) * 100) : 0,
    servePct: totalTeamPoints > 0 ? Math.max(0, 100 - Math.round((totalTeamAttack / totalTeamPoints) * 100) - Math.round((totalTeamBlock / totalTeamPoints) * 100)) : 0,
  };

  // Match insights (form, home/away, 3:0 wins, tie-breaks)
  const chronologicalMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const form = chronologicalMatches.slice(-5).map((m) => ((m.teamSetsWon || 0) > (m.opponentSetsWon || 0) ? 'W' : 'P'));
  const homeMatches = matches.filter((m) => m.isHome !== false);
  const awayMatches = matches.filter((m) => m.isHome === false);
  const homeRecord = {
    won: homeMatches.filter((m) => (m.teamSetsWon || 0) > (m.opponentSetsWon || 0)).length,
    lost: homeMatches.filter((m) => (m.teamSetsWon || 0) < (m.opponentSetsWon || 0)).length,
  };
  const awayRecord = {
    won: awayMatches.filter((m) => (m.teamSetsWon || 0) > (m.opponentSetsWon || 0)).length,
    lost: awayMatches.filter((m) => (m.teamSetsWon || 0) < (m.opponentSetsWon || 0)).length,
  };
  const wins30 = matches.filter((m) => m.teamSetsWon === 3 && m.opponentSetsWon === 0).length;
  const tieBreaks = matches.filter((m) => (m.teamSetsWon || 0) + (m.opponentSetsWon || 0) === 5);
  const tieBreaksWon = tieBreaks.filter((m) => (m.teamSetsWon || 0) > (m.opponentSetsWon || 0)).length;

  // Position breakdown for roster
  const positionCounts: Record<string, number> = {};
  playerStats.forEach((p) => {
    const pos = p.position || 'Inne';
    positionCounts[pos] = (positionCounts[pos] || 0) + 1;
  });
  const positionBreakdown = Object.entries(positionCounts)
    .map(([position, count]) => ({ position, count }))
    .sort((a, b) => b.count - a.count);

  const avgTrainingAttendance =
    playerStats.length > 0 && trainingEvents.length > 0
      ? Math.round(playerStats.reduce((acc, p) => acc + p.trainingAttendancePercent, 0) / playerStats.length)
      : 0;

  const specialistAwards = {
    bestAttacker: bestAttacker ? `${bestAttacker.name} (${bestAttacker.totalAttack} pkt)` : '—',
    bestBlocker: bestBlocker ? `${bestBlocker.name} (${bestBlocker.totalBlock} blk)` : '—',
    bestServer: bestServer ? `${bestServer.name} (${bestServer.totalServe} asów)` : '—',
    bestAttendance: bestAttendance ? `${bestAttendance.name} (${bestAttendance.attendancePercent}%)` : '—',
  };
  const teamAverageAttendance =
    playerStats.length > 0
      ? Math.round(playerStats.reduce((acc, p) => acc + p.attendancePercent, 0) / playerStats.length)
      : 0;

  // Dynamic top scorer & MVP leader
  const topScorerPlayer = playerStats.find((p) => p.totalPoints > 0);
  const topScorer = topScorerPlayer ? `${topScorerPlayer.name} (${topScorerPlayer.totalPoints} pkt)` : 'Brak danych';

  const mvpSorted = [...playerStats].filter((p) => p.mvpCount > 0).sort((a, b) => b.mvpCount - a.mvpCount);
  const mvpLeader =
    mvpSorted.length > 0
      ? mvpSorted
          .slice(0, 2)
          .map((p) => `${p.name} (${p.mvpCount}×)`)
          .join(' / ')
      : 'Brak danych';

  // Financials
  const totalFeesCollected = payments
    .filter((p) => p.status === 'OPLACONE' || p.amountPaid > 0)
    .reduce((acc: number, p: any) => acc + (Number(p.amountPaid ?? p.amount) || 0), 0);
  const totalFeesPending = payments
    .filter((p) => p.status === 'OCZEKUJE' || p.status === 'ZALEGLE')
    .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
  const totalExpenses = treasury.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const treasuryBalance = totalFeesCollected - totalExpenses;

  // Staff
  const coachUser = users.find((u) => u.role === 'TRENER') || users.find((u) => u.role === 'KIEROWNIK');
  const captainUser = users.find((u) => u.isCaptain) || users.find((u) => u.role === 'KIEROWNIK');
  const managersList = users.filter((u) => u.role === 'KIEROWNIK').map((u) => ({ name: u.name, email: u.email }));

  // Coach Summary
  const topAttendancePlayers = [...playerStats]
    .sort((a, b) => b.attendancePercent - a.attendancePercent || b.attendedEvents - a.attendedEvents)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      attendancePercent: p.attendancePercent,
      attendedEvents: p.attendedEvents,
      totalEvents: p.totalEvents,
    }));

  const topScorers = [...playerStats]
    .filter((p) => p.totalPoints > 0)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      totalPoints: p.totalPoints,
      totalAttack: p.totalAttack,
      totalBlock: p.totalBlock,
      totalServe: p.totalServe,
      mvpCount: p.mvpCount,
    }));

  const coachSummary = {
    coach: {
      name: coachUser?.name || 'Nieprzypisany',
      role: coachUser?.role || 'TRENER',
      position: coachUser?.position || 'Sztab trenerski',
      email: coachUser?.email || '',
      phone: coachUser?.phone || '',
    },
    managers: managersList,
    matchesManaged: matchesPlayed,
    matchesWon,
    matchesLost,
    winRate,
    setsWon,
    setsLost,
    setsRatio,
    trainingsCompleted: trainingEvents.length,
    trainingPlansCount: trainingPlans.length,
    tacticsCount: tactics.length,
    tacticsSharedCount: tactics.filter((t) => t.isVisibleToPlayers !== false).length,
    scoutingReportsCount: scoutingReports.length,
    announcementsCount: announcements.length,
    sparringsCount,
    tournamentsCount,
    completedEventsCount: completedEvents.length,
    upcomingEventsCount,
    avgTeamAttendance: teamAverageAttendance,
    avgTrainingAttendance,
    rosterSize: playerStats.length,
    form,
    homeRecord,
    awayRecord,
    wins30,
    tieBreaksPlayed: tieBreaks.length,
    tieBreaksWon,
    scoringBreakdown,
    positionBreakdown,
    specialistAwards,
    topAttendancePlayers,
    topScorers,
  };

  return {
    club: {
      name: clubName,
      city: clubCity || 'Polska',
      league: clubLeague || 'Rozgrywki ligowe',
      logoUrl: clubLogo || '',
      coach: { name: coachUser?.name || 'Brak', role: coachUser?.role === 'KIEROWNIK' ? 'Kierownik' : 'Trener' },
      captain: { name: captainUser?.name || 'Brak', role: 'Kapitan zespołu', number: captainUser?.number || null },
    },
    summary: {
      leagueStanding: standing ? `${standing.position}. Miejsce` : '—',
      points: standing?.points ?? 0,
      matchesPlayed,
      matchesWon,
      matchesLost,
      winRate,
      setsWon,
      setsLost,
      setsRatio,
      pointsScored,
      pointsConceded,
      totalTeamPoints,
      averageAttendance: teamAverageAttendance,
      avgTrainingAttendance,
      totalEvents: completedEvents.length,
      totalTrainings: trainingEvents.length,
      topScorer,
      mvpLeader,
      form,
      homeRecord,
      awayRecord,
      wins30,
      tieBreaksPlayed: tieBreaks.length,
      tieBreaksWon,
      scoringBreakdown,
      specialistAwards,
      totalFeesCollected,
      totalFeesPending,
      totalExpenses,
      treasuryBalance,
    },
    matches: matches.map((m) => ({
      id: m.id,
      opponent: m.opponent,
      date: m.date,
      location: m.location,
      isHome: m.isHome,
      matchType: m.matchType || 'Mecz ligowy',
      score: `${m.teamSetsWon}:${m.opponentSetsWon}`,
      won: (m.teamSetsWon || 0) > (m.opponentSetsWon || 0),
      mvp: m.mvp || null,
      sets: m.sets?.map((s: any) => `${s.teamScore}:${s.opponentScore}`).join(', ') || '',
      notes: m.notes || '',
    })),
    leagueTable,
    playerStats,
    coachSummary,
    financials: {
      totalCollected: totalFeesCollected,
      totalPending: totalFeesPending,
      totalSpent: totalExpenses,
      balance: treasuryBalance,
      feesList: fees,
      expensesList: treasury,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('id') || 'current';

    const activeClubId = getActiveClubIdFromCookies();
    const activeClub = await getClubByIdAsync(activeClubId);
    const db = await readDatabaseAsync(activeClubId);

    const isSuper = isPlatformSuperAdmin(user);
    const isManager = isSuper || user.role === 'KIEROWNIK' || Boolean(user.permissions?.isAdmin);
    const isStaff = isManager || user.role === 'TRENER' || Boolean(user.isCaptain);

    const archives = (db.seasonsArchive || []).sort(
      (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
    );
    const availableSeasons = [
      { id: 'current', name: 'Bieżący Sezon (2026/2027)' },
      ...archives.map((a) => ({
        id: a.id,
        name: `${a.name} (${new Date(a.archivedAt).toLocaleDateString('pl-PL')})`,
      })),
    ];

    const clubName = activeClub?.name || (activeClubId === DEFAULT_CLUB_ID ? 'Angels ZTP' : 'Klub Siatkarski');
    const clubCity = activeClub?.city || (activeClubId === DEFAULT_CLUB_ID ? 'Luboń / Poznań' : '');
    const clubLeague = activeClub?.leagueName || 'Rozgrywki ligowe';
    const clubLogo = activeClub?.logoUrl || '';

    let reportData: any = null;

    if (seasonId === 'current') {
      const computed = computeSeasonMetrics({
        clubName,
        clubCity,
        clubLeague,
        clubLogo,
        users: db.users || [],
        matches: db.matches || [],
        events: db.events || [],
        leagueTable: db.leagueTable || [],
        playerRankings: db.leaguePlayerRankings || [],
        fees: db.fees || [],
        payments: db.payments || [],
        treasury: db.treasuryExpenses || [],
        tactics: db.tactics || [],
        trainingPlans: db.trainingPlans || [],
        scoutingReports: db.scoutingReports || [],
        announcements: db.announcements || [],
      });

      reportData = {
        seasonId: 'current',
        seasonName: `Sezon 2026/2027 • ${clubLeague}`,
        isArchive: false,
        archivedAt: null,
        archivedByName: null,
        ...computed,
      };
    } else {
      const archive = archives.find((a) => a.id === seasonId);
      if (!archive) {
        return NextResponse.json({ error: 'Nie znaleziono wybranego sezonu w archiwum' }, { status: 404 });
      }
      const snap = archive.snapshot;
      const computed = computeSeasonMetrics({
        clubName,
        clubCity,
        clubLeague,
        clubLogo,
        users: snap.users || snap.rosterSnapshot || [],
        matches: snap.matches || [],
        events: snap.events || [],
        leagueTable: snap.leagueTable || [],
        playerRankings: [],
        fees: snap.fees || [],
        payments: snap.payments || [],
        treasury: snap.treasuryExpenses || [],
        tactics: snap.tactics || [],
        trainingPlans: [],
        scoutingReports: snap.scoutingReports || [],
        announcements: snap.announcements || [],
      });

      reportData = {
        seasonId: archive.id,
        seasonName: archive.name,
        isArchive: true,
        archivedAt: archive.archivedAt,
        archivedByName: archive.archivedByName,
        ...computed,
      };
    }

    // Hide sensitive financial details from non-staff players
    if (!isStaff && reportData?.financials) {
      reportData.financials = null;
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      availableSeasons,
      viewer: {
        id: user.id,
        name: user.name,
        role: user.role,
        isStaff,
        isManager,
      },
    });
  } catch (error: any) {
    console.error('Błąd generowania raportu sezonu:', error);
    return NextResponse.json({ error: 'Błąd generowania raportu: ' + (error?.message || error) }, { status: 500 });
  }
}
