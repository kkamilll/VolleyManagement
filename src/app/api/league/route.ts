import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { LeagueTableTeam, LeaguePhoto, LeaguePhase } from '@/lib/types';

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
        id: 'team_angels',
        position: 1,
        teamName: 'Angels ZTP',
        matchesPlayed: 5,
        points: 13,
        setsWon: 14,
        setsLost: 4,
        pointsWon: 432,
        pointsLost: 370,
        form: ['W', 'W', 'W', 'W', 'P']
      },
      {
        id: 'team_gladiatorzy',
        position: 2,
        teamName: 'Gladiatorzy BUD-WENT',
        matchesPlayed: 5,
        points: 12,
        setsWon: 13,
        setsLost: 6,
        pointsWon: 435,
        pointsLost: 395,
        form: ['W', 'W', 'P', 'W', 'W']
      },
      {
        id: 'team_afera',
        position: 3,
        teamName: 'Afera Volley',
        matchesPlayed: 5,
        points: 10,
        setsWon: 11,
        setsLost: 7,
        pointsWon: 410,
        pointsLost: 390,
        form: ['W', 'P', 'W', 'W', 'P']
      },
      {
        id: 'team_coco',
        position: 4,
        teamName: 'Coco Jumbo',
        matchesPlayed: 4,
        points: 7,
        setsWon: 8,
        setsLost: 6,
        pointsWon: 320,
        pointsLost: 305,
        form: ['W', 'W', 'P', 'P']
      },
      {
        id: 'team_volleyboars',
        position: 5,
        teamName: 'Volleyboars',
        matchesPlayed: 5,
        points: 6,
        setsWon: 7,
        setsLost: 10,
        pointsWon: 360,
        pointsLost: 385,
        form: ['W', 'P', 'W', 'P', 'P']
      },
      {
        id: 'team_koty',
        position: 6,
        teamName: 'Koty Broniszewice',
        matchesPlayed: 4,
        points: 2,
        setsWon: 2,
        setsLost: 12,
        pointsWon: 270,
        pointsLost: 340,
        form: ['P', 'P', 'P', 'P']
      },
      {
        id: 'team_czelendz',
        position: 7,
        teamName: 'Czelendż',
        matchesPlayed: 4,
        points: 1,
        setsWon: 2,
        setsLost: 12,
        pointsWon: 250,
        pointsLost: 345,
        form: ['P', 'P', 'P', 'P']
      }
    ]
  },
  {
    id: 'faza_2',
    name: 'Faza II: Grupa Finałowa (7 zespołów)',
    shortName: 'Faza II',
    groupName: 'Grupa Mistrzowska (o miejsca 1-7)',
    isActive: false,
    advancementSpots: 1,
    advancementTargetName: 'Mistrz Ligi LALS',
    teamsCount: 7,
    table: [
      {
        id: 'fin_1',
        position: 1,
        teamName: 'Angels ZTP',
        matchesPlayed: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        form: []
      },
      {
        id: 'fin_2',
        position: 2,
        teamName: 'Gladiatorzy BUD-WENT',
        matchesPlayed: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        form: []
      },
      {
        id: 'fin_3',
        position: 3,
        teamName: 'Afera Volley',
        matchesPlayed: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        form: []
      },
      {
        id: 'fin_4',
        position: 4,
        teamName: 'Rywal 1 (Awans)',
        matchesPlayed: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        form: []
      },
      {
        id: 'fin_5',
        position: 5,
        teamName: 'Rywal 2 (Awans)',
        matchesPlayed: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        form: []
      },
      {
        id: 'fin_6',
        position: 6,
        teamName: 'Rywal 3 (Awans)',
        matchesPlayed: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        form: []
      },
      {
        id: 'fin_7',
        position: 7,
        teamName: 'Rywal 4 (Awans)',
        matchesPlayed: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        form: []
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

    const canManage = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain;
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
      if (!canManage) {
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
      if (!canManage) {
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
      if (!canManage) {
        return NextResponse.json({ error: 'Brak uprawnień do edycji fazy' }, { status: 403 });
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
      if (!canManage) {
        return NextResponse.json({ error: 'Brak uprawnień do tworzenia fazy' }, { status: 403 });
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
        teamsCount: Number(teamsCount) || 7,
        table: Array.isArray(table) ? table : [],
        createdAt: new Date().toISOString()
      };
      db.leaguePhases.push(newPhase);
      writeDatabase(db);
      return NextResponse.json({ success: true, phase: newPhase, message: 'Nowa faza ligowa została utworzona!' });
    }

    if (body.action === 'UPDATE_TABLE') {
      if (!canManage) {
        return NextResponse.json({ error: 'Tylko Trener lub Kapitan może aktualizować tabelę ligową' }, { status: 403 });
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

