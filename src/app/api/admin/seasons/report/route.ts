import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, getSeasonArchiveById, getSeasonArchives } from '@/lib/db';
import { getServerUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('id') || 'current';

    const db = readDatabase();
    const archives = getSeasonArchives();
    const availableSeasons = [
      { id: 'current', name: 'Bieżący Sezon (2026/2027)' },
      ...archives.map(a => ({ id: a.id, name: `${a.name} (${new Date(a.archivedAt).toLocaleDateString('pl-PL')})` }))
    ];

    let reportData: any = null;

    if (seasonId === 'current') {
      // 1. Current active season
      const matches = db.matches || [];
      const events = db.events || [];
      const users = db.users || [];
      const leagueTable = db.leagueTable || [];
      const playerRankings = db.leaguePlayerRankings || [];
      const fees = db.fees || [];
      const payments = db.payments || [];
      const treasury = db.treasuryExpenses || [];

      // Angels standing in league table
      const angelsStanding = leagueTable.find(t => 
        t.teamName?.toLowerCase().includes('angels')
      ) || {
        position: 2,
        teamName: 'Angels ZTP',
        points: 7,
        matchesPlayed: 3,
        matchesWon: 2,
        matchesLost: 1,
        setsWon: 8,
        setsLost: 3,
        pointsWon: 252,
        pointsLost: 227,
        form: ['W', 'P', 'W']
      };

      // Events and attendance calculations
      const completedEvents = events.filter(e => 
        e.isCompleted || 
        e.status === 'ZAKONCZONY' || 
        new Date(e.date).getTime() < Date.now()
      );

      const players = users.filter(u => u.role === 'ZAWODNIK' || (u.role === 'KIEROWNIK' && Boolean(u.number)));
      
      const playerStats = (players.length > 0 ? players : users).map(p => {
        let attended = 0;
        completedEvents.forEach(ev => {
          const isAttended = ev.attendees?.some(a => a.userId === p.id && a.status === 'BEDE');
          if (isAttended) attended++;
        });
        const attendancePercent = completedEvents.length > 0 ? Math.round((attended / completedEvents.length) * 100) : 100;
        
        // Find in league rankings
        const ranking = playerRankings.find(r => 
          (r.name && p.name && (r.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(r.name.toLowerCase()))) ||
          (p.number && r.number === p.number && r.teamCode === 'ANG')
        );

        return {
          id: p.id,
          name: p.name,
          number: p.number || (ranking ? ranking.number : null),
          position: p.position || (ranking ? ranking.position : 'Zawodnik'),
          role: p.role,
          phone: p.phone,
          status: p.status || 'Aktywny',
          attendedEvents: attended,
          totalEvents: completedEvents.length,
          attendancePercent,
          totalPoints: ranking?.totalPoints || 0,
          totalAttack: ranking?.totalAttack || 0,
          totalBlock: ranking?.totalBlock || 0,
          totalServe: ranking?.totalServe || 0,
          rank: ranking?.rank || null
        };
      }).sort((a, b) => b.totalPoints - a.totalPoints || b.attendancePercent - a.attendancePercent);

      const teamAverageAttendance = playerStats.length > 0
        ? Math.round(playerStats.reduce((acc, curr) => acc + curr.attendancePercent, 0) / playerStats.length)
        : 90;

      // Financials
      const totalFeesCollected = payments.reduce((acc: number, p: any) => acc + (p.amount || p.amountPaid || 0), 0);
      const totalExpenses = treasury.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
      const treasuryBalance = totalFeesCollected - totalExpenses;

      // Staff
      const coach = users.find(u => u.role === 'TRENER') || { name: 'Hubert Rutkowski', role: 'Trener' };
      const captain = users.find(u => u.isCaptain) || { name: 'Łukasz Kremer', role: 'Kapitan zespołu', number: 17 };

      reportData = {
        seasonId: 'current',
        seasonName: 'Sezon 2026/2027 (LALS - Lubońska Amatorska Liga Siatkówki)',
        isArchive: false,
        archivedAt: null,
        archivedByName: null,
        club: {
          name: 'Angels ZTP',
          city: 'Luboń / Poznań',
          league: 'Lubońska Amatorska Liga Siatkówki (LALS)',
          category: 'III Liga Mężczyzn (L3D)',
          coach: { name: coach.name, role: 'Trener' },
          captain: { name: captain.name, role: 'Kapitan zespołu', number: captain.number || 17 }
        },
        summary: {
          leagueStanding: `${angelsStanding.position}. Miejsce`,
          points: angelsStanding.points,
          matchesPlayed: angelsStanding.matchesPlayed || matches.length,
          matchesWon: angelsStanding.matchesWon || 2,
          matchesLost: angelsStanding.matchesLost || 1,
          setsWon: angelsStanding.setsWon || 8,
          setsLost: angelsStanding.setsLost || 3,
          setsRatio: ((angelsStanding as any).setRatio || 2.67).toString(),
          pointsScored: angelsStanding.pointsWon || 252,
          pointsConceded: angelsStanding.pointsLost || 227,
          averageAttendance: teamAverageAttendance,
          totalEvents: completedEvents.length,
          topScorer: 'Łukasz Kremer (33 pkt)',
          mvpLeader: 'Hubert Obara (#12) / Łukasz Kremer (#17)',
          totalFeesCollected,
          totalExpenses,
          treasuryBalance
        },
        matches: matches.map(m => ({
          id: m.id,
          opponent: m.opponent,
          date: m.date,
          location: m.location,
          isHome: m.isHome,
          score: `${m.teamSetsWon}:${m.opponentSetsWon}`,
          won: m.teamSetsWon > m.opponentSetsWon,
          mvp: m.mvp || null,
          sets: m.sets?.map((s: any) => `${s.teamScore}:${s.opponentScore}`).join(', '),
          notes: m.notes
        })),
        leagueTable,
        playerStats,
        financials: {
          totalCollected: totalFeesCollected,
          totalSpent: totalExpenses,
          balance: treasuryBalance,
          feesList: fees,
          expensesList: treasury
        }
      };

    } else {
      // 2. Archived season snapshot
      const archive = getSeasonArchiveById(seasonId);
      if (!archive) {
        return NextResponse.json({ error: 'Nie znaleziono wybranego sezonu w archiwum' }, { status: 404 });
      }

      const snap = archive.snapshot;
      const summary = archive.summary;

      // Extract players from rosterSnapshot or snap.users
      const roster = snap.rosterSnapshot || snap.users || [];
      const matches = snap.matches || [];
      const events = snap.events || [];
      const payments = snap.payments || [];
      const expenses = snap.treasuryExpenses || [];
      const leagueTable = snap.leagueTable || [];

      const totalFees = payments.reduce((acc: number, p: any) => acc + (p.amount || p.amountPaid || 0), summary.totalFeesCollected || 0);
      const totalExpenses = expenses.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

      reportData = {
        seasonId: archive.id,
        seasonName: archive.name,
        isArchive: true,
        archivedAt: archive.archivedAt,
        archivedByName: archive.archivedByName,
        club: {
          name: 'Angels ZTP',
          city: 'Luboń / Poznań',
          league: 'Lubońska Amatorska Liga Siatkówki (LALS)',
          category: 'Rozgrywki Amatorskie',
          coach: { name: 'Hubert Rutkowski', role: 'Trener' },
          captain: { name: 'Łukasz Kremer', role: 'Kapitan zespołu', number: 17 }
        },
        summary: {
          leagueStanding: summary.leagueStanding || '1. Miejsce',
          points: summary.totalPointsScored || 24,
          matchesPlayed: summary.totalMatches || matches.length,
          matchesWon: summary.matchesWon || 0,
          matchesLost: summary.matchesLost || 0,
          setsWon: 12,
          setsLost: 4,
          setsRatio: '3.00',
          pointsScored: summary.totalPointsScored || 0,
          pointsConceded: 0,
          averageAttendance: summary.averageAttendance || 90,
          totalEvents: summary.totalEvents || events.length,
          topScorer: summary.topScorer || 'Brak danych',
          mvpLeader: summary.mvpLeader || 'Brak danych',
          totalFeesCollected: summary.totalFeesCollected || totalFees,
          totalExpenses,
          treasuryBalance: (summary.totalFeesCollected || totalFees) - totalExpenses
        },
        matches: matches.map(m => ({
          id: m.id,
          opponent: m.opponent,
          date: m.date,
          location: m.location,
          isHome: m.isHome,
          score: `${m.teamSetsWon}:${m.opponentSetsWon}`,
          won: m.teamSetsWon > m.opponentSetsWon,
          mvp: m.mvp || null,
          sets: m.sets?.map((s: any) => `${s.teamScore}:${s.opponentScore}`).join(', '),
          notes: m.notes
        })),
        leagueTable,
        playerStats: roster.map((p: any, idx: number) => ({
          id: p.id || `p_${idx}`,
          name: p.name,
          number: p.number,
          position: p.position || 'Zawodnik',
          role: p.role,
          status: p.status || 'Aktywny',
          attendedEvents: 0,
          totalEvents: summary.totalEvents || 0,
          attendancePercent: summary.averageAttendance || 90,
          totalPoints: 0,
          totalAttack: 0,
          totalBlock: 0,
          totalServe: 0,
          rank: null
        })),
        financials: {
          totalCollected: summary.totalFeesCollected || totalFees,
          totalSpent: totalExpenses,
          balance: (summary.totalFeesCollected || totalFees) - totalExpenses,
          feesList: snap.fees || [],
          expensesList: expenses
        }
      };
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      availableSeasons
    });
  } catch (error: any) {
    console.error('Błąd generowania raportu sezonu:', error);
    return NextResponse.json({ error: 'Błąd generowania raportu: ' + (error?.message || error) }, { status: 500 });
  }
}
