import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { LeagueTableTeam, LeaguePhoto, LeaguePhase, VolleyStationScheduleMatch } from '@/lib/types';

const DEFAULT_LALS_SCHEDULE: VolleyStationScheduleMatch[] = [
  // 4 października 2026, Niedziela
  {
    round: 2,
    matchNumber: 1850,
    homeTeam: 'Coco Jumbo',
    awayTeam: 'Czelendż',
    homeSetsWon: 3,
    awaySetsWon: 1,
    isFinished: true,
    timeStr: '17:00',
    date: '2026-10-04T17:00:00',
    dateStr: '4 października 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583851/'
  },
  {
    round: 2,
    matchNumber: 1848,
    homeTeam: 'Afera Volley',
    awayTeam: 'Gladiatorzy BUD-WENT',
    homeSetsWon: 0,
    awaySetsWon: 3,
    isFinished: true,
    timeStr: '18:30',
    date: '2026-10-04T18:30:00',
    dateStr: '4 października 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583852/'
  },
  {
    round: 2,
    matchNumber: 1849,
    homeTeam: 'Volleyboars',
    awayTeam: 'Koty Broniszewice',
    homeSetsWon: 3,
    awaySetsWon: 0,
    isFinished: true,
    timeStr: '20:00',
    date: '2026-10-04T20:00:00',
    dateStr: '4 października 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583853/'
  },
  // 18 października 2026, Niedziela
  {
    round: 5,
    matchNumber: 1889,
    homeTeam: 'Volleyboars',
    awayTeam: 'Coco Jumbo',
    homeSetsWon: 0,
    awaySetsWon: 3,
    isFinished: true,
    timeStr: '17:00',
    date: '2026-10-18T17:00:00',
    dateStr: '18 października 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583848/'
  },
  {
    round: 5,
    matchNumber: 1887,
    homeTeam: 'Angels ZTP',
    awayTeam: 'Koty Broniszewice',
    homeSetsWon: 3,
    awaySetsWon: 0,
    isFinished: true,
    timeStr: '18:30',
    date: '2026-10-18T18:30:00',
    dateStr: '18 października 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583849/'
  },
  {
    round: 5,
    matchNumber: 1888,
    homeTeam: 'Afera Volley',
    awayTeam: 'Czelendż',
    homeSetsWon: 3,
    awaySetsWon: 0,
    isFinished: true,
    timeStr: '20:00',
    date: '2026-10-18T20:00:00',
    dateStr: '18 października 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583850/'
  },
  // 31 października 2026, Sobota
  {
    round: 7,
    matchNumber: 1926,
    homeTeam: 'Gladiatorzy BUD-WENT',
    awayTeam: 'Angels ZTP',
    homeSetsWon: 3,
    awaySetsWon: 2,
    isFinished: true,
    timeStr: '17:00',
    date: '2026-10-31T17:00:00',
    dateStr: '31 października 2026, Sobota',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583864/'
  },
  {
    round: 7,
    matchNumber: 1925,
    homeTeam: 'Koty Broniszewice',
    awayTeam: 'Afera Volley',
    homeSetsWon: 0,
    awaySetsWon: 3,
    isFinished: true,
    timeStr: '18:30',
    date: '2026-10-31T18:30:00',
    dateStr: '31 października 2026, Sobota',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583846/'
  },
  {
    round: 7,
    matchNumber: 1924,
    homeTeam: 'Czelendż',
    awayTeam: 'Volleyboars',
    homeSetsWon: 1,
    awaySetsWon: 3,
    isFinished: true,
    timeStr: '20:00',
    date: '2026-10-31T20:00:00',
    dateStr: '31 października 2026, Sobota',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2583847/'
  },
  // 8 listopada 2026, Niedziela
  {
    round: 9,
    matchNumber: 1949,
    homeTeam: 'Coco Jumbo',
    awayTeam: 'Gladiatorzy BUD-WENT',
    homeSetsWon: 0,
    awaySetsWon: 3,
    isFinished: true,
    timeStr: '17:00',
    date: '2026-11-08T17:00:00',
    dateStr: '8 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584337/'
  },
  {
    round: 9,
    matchNumber: 1950,
    homeTeam: 'Czelendż',
    awayTeam: 'Koty Broniszewice',
    homeSetsWon: 0,
    awaySetsWon: 3,
    isFinished: true,
    timeStr: '18:30',
    date: '2026-11-08T18:30:00',
    dateStr: '8 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584338/'
  },
  {
    round: 9,
    matchNumber: 1948,
    homeTeam: 'Volleyboars',
    awayTeam: 'Angels ZTP',
    homeSetsWon: 0,
    awaySetsWon: 3,
    isFinished: true,
    timeStr: '20:00',
    date: '2026-11-08T20:00:00',
    dateStr: '8 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584336/'
  },
  // 15 listopada 2026, Niedziela (Terminarz)
  {
    round: 11,
    matchNumber: 1971,
    homeTeam: 'Gladiatorzy BUD-WENT',
    awayTeam: 'Czelendż',
    isFinished: false,
    timeStr: '17:00',
    date: '2026-11-15T17:00:00',
    dateStr: '15 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584359/'
  },
  {
    round: 11,
    matchNumber: 1972,
    homeTeam: 'Angels ZTP',
    awayTeam: 'Coco Jumbo',
    isFinished: false,
    timeStr: '18:30',
    date: '2026-11-15T18:30:00',
    dateStr: '15 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584360/'
  },
  {
    round: 11,
    matchNumber: 1973,
    homeTeam: 'Afera Volley',
    awayTeam: 'Volleyboars',
    isFinished: false,
    timeStr: '20:00',
    date: '2026-11-15T20:00:00',
    dateStr: '15 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584361/'
  },
  // 29 listopada 2026, Niedziela (Terminarz)
  {
    round: 13,
    matchNumber: 1996,
    homeTeam: 'Coco Jumbo',
    awayTeam: 'Afera Volley',
    isFinished: false,
    timeStr: '12:30',
    date: '2026-11-29T12:30:00',
    dateStr: '29 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584384/'
  },
  {
    round: 13,
    matchNumber: 1997,
    homeTeam: 'Czelendż',
    awayTeam: 'Angels ZTP',
    isFinished: false,
    timeStr: '17:00',
    date: '2026-11-29T17:00:00',
    dateStr: '29 listopada 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584385/'
  },
  // 13 grudnia 2026, Niedziela (Terminarz)
  {
    round: 16,
    matchNumber: 2036,
    homeTeam: 'Gladiatorzy BUD-WENT',
    awayTeam: 'Volleyboars',
    isFinished: false,
    timeStr: '12:30',
    date: '2026-12-13T12:30:00',
    dateStr: '13 grudnia 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584428/'
  },
  {
    round: 16,
    matchNumber: 2037,
    homeTeam: 'Angels ZTP',
    awayTeam: 'Afera Volley',
    isFinished: false,
    timeStr: '15:30',
    date: '2026-12-13T15:30:00',
    dateStr: '13 grudnia 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584423/'
  },
  {
    round: 16,
    matchNumber: 2035,
    homeTeam: 'Koty Broniszewice',
    awayTeam: 'Coco Jumbo',
    isFinished: false,
    timeStr: '17:00',
    date: '2026-12-13T17:00:00',
    dateStr: '13 grudnia 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584422/'
  },
  // 20 grudnia 2026, Niedziela (Terminarz)
  {
    round: 18,
    matchNumber: 2057,
    homeTeam: 'Koty Broniszewice',
    awayTeam: 'Gladiatorzy BUD-WENT',
    isFinished: false,
    timeStr: '18:30',
    date: '2026-12-20T18:30:00',
    dateStr: '20 grudnia 2026, Niedziela',
    url: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/matches/2584443/'
  }
];

const DEFAULT_LALS_PHASES: LeaguePhase[] = [
  {
    id: 'faza_1',
    name: 'Faza I: Grupa Eliminacyjna (Top 3 awans)',
    shortName: 'Faza I',
    groupName: 'Grupa z udziałem Angels ZTP',
    isActive: true,
    advancementSpots: 3, // 3 drużyny z grupy wychodzą dalej
    advancementTargetName: 'Awans do Grupy Finałowej (Top 3)',
    teamsCount: 7,
    table: [
      {
        id: 'team_gladiatorzy',
        position: 1,
        teamName: 'Gladiatorzy BUD-WENT',
        teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237370-178/',
        points: 8,
        matchesPlayed: 3,
        matchesWon: 3,
        matchesLost: 0,
        setsWon: 9,
        setsLost: 2,
        setRatio: 4.5,
        pointsWon: 258,
        pointsLost: 218,
        pointRatio: 1.1835,
        w3_0: 2,
        w3_1: 0,
        w3_2: 1,
        p2_3: 0,
        p1_3: 0,
        p0_3: 0,
        form: ['W', 'W', 'W']
      },
      {
        id: 'team_angels',
        position: 2,
        teamName: 'Angels ZTP',
        teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237343-52/',
        points: 7,
        matchesPlayed: 3,
        matchesWon: 2,
        matchesLost: 1,
        setsWon: 8,
        setsLost: 3,
        setRatio: 2.6667,
        pointsWon: 252,
        pointsLost: 227,
        pointRatio: 1.1101,
        w3_0: 2,
        w3_1: 0,
        w3_2: 0,
        p2_3: 1,
        p1_3: 0,
        p0_3: 0,
        form: ['W', 'W', 'P']
      },
      {
        id: 'team_afera',
        position: 3,
        teamName: 'Afera Volley',
        teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237344-34/',
        points: 6,
        matchesPlayed: 3,
        matchesWon: 2,
        matchesLost: 1,
        setsWon: 6,
        setsLost: 3,
        setRatio: 2.0,
        pointsWon: 214,
        pointsLost: 172,
        pointRatio: 1.2442,
        w3_0: 2,
        w3_1: 0,
        w3_2: 0,
        p2_3: 0,
        p1_3: 0,
        p0_3: 1,
        form: ['W', 'W', 'P']
      },
      {
        id: 'team_coco',
        position: 4,
        teamName: 'Coco Jumbo',
        teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237363-177/',
        points: 6,
        matchesPlayed: 3,
        matchesWon: 2,
        matchesLost: 1,
        setsWon: 6,
        setsLost: 4,
        setRatio: 1.5,
        pointsWon: 224,
        pointsLost: 216,
        pointRatio: 1.037,
        w3_0: 1,
        w3_1: 1,
        w3_2: 0,
        p2_3: 0,
        p1_3: 0,
        p0_3: 1,
        form: ['W', 'W', 'P']
      },
      {
        id: 'team_volleyboars',
        position: 5,
        teamName: 'Volleyboars',
        teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237367-63/',
        points: 6,
        matchesPlayed: 4,
        matchesWon: 2,
        matchesLost: 2,
        setsWon: 6,
        setsLost: 7,
        setRatio: 0.8571,
        pointsWon: 303,
        pointsLost: 293,
        pointRatio: 1.0341,
        w3_0: 1,
        w3_1: 1,
        w3_2: 0,
        p2_3: 0,
        p1_3: 0,
        p0_3: 2,
        form: ['W', 'W', 'P', 'P']
      },
      {
        id: 'team_koty',
        position: 6,
        teamName: 'Koty Broniszewice',
        teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2311843-225/',
        points: 3,
        matchesPlayed: 4,
        matchesWon: 1,
        matchesLost: 3,
        setsWon: 3,
        setsLost: 9,
        setRatio: 0.3333,
        pointsWon: 247,
        pointsLost: 290,
        pointRatio: 0.8517,
        w3_0: 1,
        w3_1: 0,
        w3_2: 0,
        p2_3: 0,
        p1_3: 0,
        p0_3: 3,
        form: ['W', 'P', 'P', 'P']
      },
      {
        id: 'team_czelendz',
        position: 7,
        teamName: 'Czelendż',
        teamUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/teams/2237346-129/',
        points: 0,
        matchesPlayed: 4,
        matchesWon: 0,
        matchesLost: 4,
        setsWon: 2,
        setsLost: 12,
        setRatio: 0.1667,
        pointsWon: 270,
        pointsLost: 352,
        pointRatio: 0.767,
        w3_0: 0,
        w3_1: 0,
        w3_2: 0,
        p2_3: 0,
        p1_3: 2,
        p0_3: 2,
        form: ['P', 'P', 'P', 'P']
      }
    ]
  }
];

export async function GET(request: Request) {
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);

  // Phases
  const leaguePhases: LeaguePhase[] = (db.leaguePhases && db.leaguePhases.length > 0)
    ? db.leaguePhases
    : DEFAULT_LALS_PHASES;

  const url = new URL(request.url);
  const requestedPhaseId = url.searchParams.get('phaseId');
  const activePhaseId = requestedPhaseId || db.activeLeaguePhaseId || 'faza_1';

  let currentPhase = leaguePhases.find(p => p.id === activePhaseId);
  if (!currentPhase) {
    currentPhase = leaguePhases[0] || DEFAULT_LALS_PHASES[0];
  }

  const leagueTable = (currentPhase && currentPhase.table && currentPhase.table.length > 0)
    ? currentPhase.table
    : (db.leagueTable && db.leagueTable.length > 0)
    ? db.leagueTable
    : DEFAULT_LALS_PHASES[0].table;

  const leaguePhotos = db.leaguePhotos || [];
  const leagueMatches = (db.matches || []).filter(m => m.matchType === 'Mecz ligowy');

  return NextResponse.json({
    leagueName: 'Lubońska Amatorska Liga Siatkówki (LALS)',
    leagueLogo: '/lals_logo.png',
    volleyStationUrl: 'https://panel.volleystation.com/website/809/pl/phase-6925-l3d-20262027/',
    leaguePhases,
    activeLeaguePhaseId: currentPhase.id,
    currentPhase,
    advancementSpots: currentPhase.advancementSpots ?? 3,
    advancementTargetName: currentPhase.advancementTargetName || 'Awans do Grupy Finałowej (Top 3)',
    leagueTable,
    leaguePhotos,
    leagueSchedule: (db.leagueSchedule && db.leagueSchedule.length > 0) ? db.leagueSchedule : DEFAULT_LALS_SCHEDULE,
    matches: leagueMatches
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

    const canManageLeague = hasPermission(user, 'canManageMatches');
    const canManagePhotos = hasPermission(user, 'canManageEvents') || hasPermission(user, 'canManageMatches');
    const body = await request.json();
    const db = readDatabase();

    if (body.action === 'ADD_PHOTO') {
      const { url, title, matchName, caption, category, eventId, matchId, seriesId, seriesTitle } = body;
      if (!url || !title) {
        return NextResponse.json({ error: 'Podaj link do zdjęcia oraz tytuł' }, { status: 400 });
      }

      const newPhoto: LeaguePhoto = {
        id: `ph_${Date.now()}`,
        url: url.trim(),
        title: title.trim(),
        matchName: matchName ? matchName.trim() : undefined,
        category: category || 'MECZ',
        eventId: eventId || undefined,
        matchId: matchId || undefined,
        caption: caption ? caption.trim() : undefined,
        seriesId: seriesId || undefined,
        seriesTitle: seriesTitle ? seriesTitle.trim() : undefined,
        date: new Date().toISOString().slice(0, 10),
        uploadedBy: `${user.name} (${user.role === 'KIEROWNIK' ? 'Kierownik' : user.isCaptain ? 'Kapitan' : user.role === 'TRENER' ? 'Trener' : 'Zawodnik'})`
      };

      if (!db.leaguePhotos) db.leaguePhotos = [];
      db.leaguePhotos.unshift(newPhoto);
      writeDatabase(db);

      return NextResponse.json({
        success: true,
        photo: newPhoto,
        message: 'Zdjęcie zostało dodane do galerii!'
      });
    }

    if (body.action === 'ADD_PHOTOS_BATCH') {
      const { photos, seriesTitle, category, matchName, eventId, matchId, caption } = body;
      if (!Array.isArray(photos) || photos.length === 0) {
        return NextResponse.json({ error: 'Nie wybrano żadnych zdjęć' }, { status: 400 });
      }

      const seriesId = `series_${Date.now()}`;
      const effectiveSeriesTitle = seriesTitle?.trim() || matchName?.trim() || 'Seria zdjęć';
      const uploaderRole = user.role === 'KIEROWNIK' ? 'Kierownik' : user.isCaptain ? 'Kapitan' : user.role === 'TRENER' ? 'Trener' : 'Zawodnik';
      const uploadedBy = `${user.name} (${uploaderRole})`;
      const currentDate = new Date().toISOString().slice(0, 10);

      const newPhotos: LeaguePhoto[] = photos.map((item: any, idx: number) => ({
        id: `ph_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        url: typeof item === 'string' ? item : item.url,
        title: (typeof item === 'object' && item.title) ? item.title.trim() : `${effectiveSeriesTitle} #${idx + 1}`,
        matchName: matchName ? matchName.trim() : undefined,
        category: category || (matchName ? 'MECZ' : 'INNE'),
        eventId: eventId || undefined,
        matchId: matchId || undefined,
        caption: (typeof item === 'object' && item.caption) ? item.caption.trim() : (caption ? caption.trim() : undefined),
        date: currentDate,
        uploadedBy,
        seriesId,
        seriesTitle: effectiveSeriesTitle
      }));

      if (!db.leaguePhotos) db.leaguePhotos = [];
      db.leaguePhotos = [...newPhotos, ...db.leaguePhotos];
      writeDatabase(db);

      return NextResponse.json({
        success: true,
        photos: newPhotos,
        message: `Pomyślnie dodano serię ${newPhotos.length} zdjęć do galerii!`
      });
    }

    if (body.action === 'DELETE_SERIES') {
      if (!canManagePhotos) {
        return NextResponse.json({ error: 'Brak uprawnień do usuwania serii zdjęć' }, { status: 403 });
      }
      const { seriesId } = body;
      if (seriesId) {
        db.leaguePhotos = (db.leaguePhotos || []).filter(p => p.seriesId !== seriesId);
        writeDatabase(db);
        return NextResponse.json({ success: true, message: 'Cała seria zdjęć została usunięta' });
      }
    }

    if (body.action === 'DELETE_PHOTO') {
      if (!canManagePhotos) {
        return NextResponse.json({ error: 'Brak uprawnień do usuwania zdjęć' }, { status: 403 });
      }
      const { photoId } = body;
      db.leaguePhotos = (db.leaguePhotos || []).filter(p => p.id !== photoId);
      writeDatabase(db);
      return NextResponse.json({ success: true, message: 'Zdjęcie usunięte' });
    }

    if (body.action === 'SWITCH_PHASE') {
      const { phaseId } = body;
      if (!phaseId) {
        return NextResponse.json({ error: 'Podaj ID fazy' }, { status: 400 });
      }
      db.activeLeaguePhaseId = phaseId;
      if (db.leaguePhases) {
        db.leaguePhases.forEach(p => {
          p.isActive = (p.id === phaseId);
        });
      }
      writeDatabase(db);
      return NextResponse.json({ success: true, activeLeaguePhaseId: phaseId, message: 'Przełączono aktywną fazę rozgrywek' });
    }

    if (body.action === 'UPDATE_PHASE') {
      if (!canManageLeague) {
        return NextResponse.json({ error: 'Tylko Zarząd (Kamil Pujanek / Łukasz Kremer) może edytować fazy ligowe' }, { status: 403 });
      }
      const { phase } = body;
      if (!phase || !phase.id) {
        return NextResponse.json({ error: 'Nieprawidłowe dane fazy' }, { status: 400 });
      }
      if (!db.leaguePhases || db.leaguePhases.length === 0) {
        db.leaguePhases = [...DEFAULT_LALS_PHASES];
      }
      const idx = db.leaguePhases.findIndex(p => p.id === phase.id);
      if (idx !== -1) {
        db.leaguePhases[idx] = { ...db.leaguePhases[idx], ...phase };
      } else {
        db.leaguePhases.push(phase);
      }
      writeDatabase(db);
      return NextResponse.json({ success: true, phase: db.leaguePhases.find(p => p.id === phase.id), message: 'Faza zaktualizowana' });
    }

    if (body.action === 'CREATE_PHASE') {
      if (!canManageLeague) {
        return NextResponse.json({ error: 'Tylko Zarząd (Kamil Pujanek / Łukasz Kremer) może tworzyć nową fazę ligową' }, { status: 403 });
      }
      const { name, shortName, advancementSpots, advancementTargetName, teamsCount, table } = body;
      if (!name) {
        return NextResponse.json({ error: 'Podaj nazwę nowej fazy' }, { status: 400 });
      }
      if (!db.leaguePhases || db.leaguePhases.length === 0) {
        db.leaguePhases = [...DEFAULT_LALS_PHASES];
      }
      const newPhase: LeaguePhase = {
        id: `faza_${Date.now()}`,
        name: name.trim(),
        shortName: shortName?.trim() || `Faza ${db.leaguePhases.length + 1}`,
        isActive: false,
        advancementSpots: Number(advancementSpots) || 1,
        advancementTargetName: advancementTargetName?.trim() || 'Mistrz Ligi LALS',
        teamsCount: Number(teamsCount) || (Array.isArray(table) ? table.length : 0),
        table: Array.isArray(table) ? table : [],
        createdAt: new Date().toISOString()
      };
      db.leaguePhases.push(newPhase);
      writeDatabase(db);
      return NextResponse.json({ success: true, phase: newPhase, message: 'Nowa faza ligowa została utworzona!' });
    }

    if (body.action === 'DELETE_PHASE') {
      if (!canManageLeague) {
        return NextResponse.json({ error: 'Tylko Zarząd (Kamil Pujanek / Łukasz Kremer) może usuwać fazę ligową' }, { status: 403 });
      }
      const { phaseId } = body;
      if (!phaseId) return NextResponse.json({ error: 'Brak ID fazy' }, { status: 400 });

      if (db.leaguePhases && db.leaguePhases.length > 1) {
        db.leaguePhases = db.leaguePhases.filter(p => p.id !== phaseId);
        if (db.activeLeaguePhaseId === phaseId) {
          db.activeLeaguePhaseId = db.leaguePhases[0].id;
          db.leaguePhases[0].isActive = true;
        }
        writeDatabase(db);
        return NextResponse.json({ success: true, message: 'Faza została usunięta', activeLeaguePhaseId: db.activeLeaguePhaseId });
      } else {
        return NextResponse.json({ error: 'Nie można usunąć jedynej fazy w lidze' }, { status: 400 });
      }
    }

    if (body.action === 'SPLIT_PHASE') {
      if (!canManageLeague) {
        return NextResponse.json({ error: 'Tylko Zarząd (Kamil Pujanek / Łukasz Kremer) może dzielić fazy ligowe' }, { status: 403 });
      }
      const { sourcePhaseId, newPhaseName, newPhaseShortName, startRank, endRank, advancementSpots, advancementTargetName, carryOverStats } = body;
      if (!sourcePhaseId || !newPhaseName) {
        return NextResponse.json({ error: 'Podaj ID fazy źródłowej oraz nazwę nowej grupy' }, { status: 400 });
      }

      const sourcePhase = (db.leaguePhases || []).find(p => p.id === sourcePhaseId);
      if (!sourcePhase || !sourcePhase.table) {
        return NextResponse.json({ error: 'Nie znaleziono fazy źródłowej lub jej tabeli' }, { status: 404 });
      }

      const start = Math.max(1, Number(startRank) || 1) - 1;
      const end = Math.min(sourcePhase.table.length, Number(endRank) || sourcePhase.table.length);
      const selectedTeams = sourcePhase.table.slice(start, end);

      const splitTable: LeagueTableTeam[] = selectedTeams.map((t, idx) => ({
        id: `t_${Date.now()}_${idx}`,
        position: idx + 1,
        teamName: t.teamName,
        matchesPlayed: carryOverStats ? t.matchesPlayed : 0,
        points: carryOverStats ? t.points : 0,
        setsWon: carryOverStats ? t.setsWon : 0,
        setsLost: carryOverStats ? t.setsLost : 0,
        pointsWon: carryOverStats ? t.pointsWon : 0,
        pointsLost: carryOverStats ? t.pointsLost : 0,
        form: carryOverStats ? (t.form || []) : []
      }));

      const newPhase: LeaguePhase = {
        id: `faza_${Date.now()}`,
        name: newPhaseName.trim(),
        shortName: newPhaseShortName?.trim() || `Grupa (${start + 1}-${end})`,
        isActive: false,
        advancementSpots: Number(advancementSpots) || 1,
        advancementTargetName: advancementTargetName?.trim() || 'Mistrz Ligi LALS',
        teamsCount: splitTable.length,
        table: splitTable,
        createdAt: new Date().toISOString()
      };

      if (!db.leaguePhases) db.leaguePhases = [];
      db.leaguePhases.push(newPhase);
      writeDatabase(db);

      return NextResponse.json({
        success: true,
        phase: newPhase,
        message: `Utworzono fazę: "${newPhase.name}" z ${splitTable.length} zespołami (miejsca ${start + 1} do ${end})!`
      });
    }

    if (body.action === 'UPDATE_TABLE') {
      if (!canManageLeague) {
        return NextResponse.json({ error: 'Tylko Zarząd (Kamil Pujanek / Łukasz Kremer) może aktualizować oficjalną tabelę ligową' }, { status: 403 });
      }
      const { table, phaseId } = body;
      if (Array.isArray(table)) {
        if (!db.leaguePhases || db.leaguePhases.length === 0) {
          db.leaguePhases = [...DEFAULT_LALS_PHASES];
        }
        const targetPhaseId = phaseId || db.activeLeaguePhaseId || 'faza_1';
        const targetPhase = db.leaguePhases.find(p => p.id === targetPhaseId);
        if (targetPhase) {
          targetPhase.table = table;
          targetPhase.teamsCount = table.length;
        }
        db.leagueTable = table;
        writeDatabase(db);
        return NextResponse.json({ success: true, message: 'Tabela ligowa zaktualizowana' });
      }
    }

    return NextResponse.json({ error: 'Nieprawidłowa akcja' }, { status: 400 });
  } catch (error) {
    console.error('League API error:', error);
    return NextResponse.json({ error: 'Błąd przetwarzania zapytania ligowego' }, { status: 500 });
  }
}

