import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { TacticalPlay, ScoutingReport, TacticScope, TacticalMaterial } from '@/lib/types';

export async function GET(req: NextRequest) {
  const seasonId = getActiveSeasonIdFromRequest(req);
  const db = getEffectiveDatabase(seasonId);
  const tactics = db.tactics || [];
  const scoutingReports = db.scoutingReports || [];
  const materials = db.tacticalMaterials || [];
  const matches = db.matches || [];
  const events = db.events || [];
  
  // Extract players from users
  const players = db.users
    .filter(u => u.role === 'ZAWODNIK')
    .map(u => ({
      id: u.id,
      name: u.name,
      number: u.number,
      position: u.position,
      height: u.height,
      status: u.status
    }));

  return NextResponse.json({
    tactics,
    scoutingReports,
    materials,
    players,
    matches,
    events
  });
}

export async function POST(req: NextRequest) {
  const seasonId = getActiveSeasonIdFromRequest(req);
  if (seasonId) {
    return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
  }

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = readDatabase();

    // 1. Player or Coach writes a post/suggestion to a tactic
    if (body.type === 'ADD_POST') {
      const { tacticId, content } = body;
      if (!tacticId || !content?.trim()) {
        return NextResponse.json({ error: 'Brak treści uwagi taktycznej' }, { status: 400 });
      }
      const tactic = (db.tactics || []).find(t => t.id === tacticId);
      if (!tactic) {
        return NextResponse.json({ error: 'Taktyka nie istnieje' }, { status: 404 });
      }
      if (!tactic.posts) tactic.posts = [];

      const isStaff = user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain;
      const newPost = {
        id: `post_${Date.now()}`,
        tacticId,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        authorNumber: user.number,
        content: content.trim(),
        status: isStaff ? ('ZAAKCEPTOWANY' as const) : ('OCZEKUJE' as const),
        coachComment: isStaff ? 'Wpis sztabu trenerskiego' : undefined,
        createdAt: new Date().toISOString()
      };

      tactic.posts.unshift(newPost);
      writeDatabase(db);

      return NextResponse.json({
        success: true,
        post: newPost,
        message: isStaff ? 'Wytyczna została opublikowana!' : 'Twoja sugestia została wysłana do akceptacji trenera!'
      });
    }

    // 2. Coach/Captain accepts, rejects or edits a player suggestion
    if (body.type === 'UPDATE_POST_STATUS') {
      const canManage = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || hasPermission(user, 'canManageTactics');
      if (!canManage) {
        return NextResponse.json({ error: 'Tylko Trener lub Kapitan może zatwierdzać sugestie taktyczne' }, { status: 403 });
      }

      const { tacticId, postId, status, coachComment, editedContent } = body;
      const tactic = (db.tactics || []).find(t => t.id === tacticId);
      if (!tactic || !tactic.posts) {
        return NextResponse.json({ error: 'Nie znaleziono taktyki' }, { status: 404 });
      }

      const post = tactic.posts.find(p => p.id === postId);
      if (!post) {
        return NextResponse.json({ error: 'Wpis nie istnieje' }, { status: 404 });
      }

      if (status) post.status = status;
      if (coachComment !== undefined) post.coachComment = coachComment.trim();
      if (editedContent !== undefined) post.content = editedContent.trim();

      writeDatabase(db);

      return NextResponse.json({
        success: true,
        post,
        message: status === 'ZAAKCEPTOWANY' ? 'Sugestia została zaakceptowana i włączona do taktyki!' : 'Status sugestii został zaktualizowany!'
      });
    }

    // 3. Create or Save Tactic (Requires staff permission)
    const canManage = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || hasPermission(user, 'canManageTactics');
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień trenera/kapitana do zarządzania taktyką' }, { status: 403 });
    }

    if (body.type === 'TACTIC') {
      const { title, phase, rotation, scope, targetOpponent, matchId, eventId, description, courtPositions, directives, drawingData, tacticalNotes } = body.tactic || {};
      if (!title) {
        return NextResponse.json({ error: 'Podaj tytuł taktyki' }, { status: 400 });
      }

      let detectedScope: TacticScope = 'OGOLNA';
      if (matchId) {
        detectedScope = 'MECZ_LIGOWY';
      } else if (eventId) {
        const ev = (db.events || []).find((e: any) => e.id === eventId);
        if (ev) {
          if (ev.type === 'TRENING') detectedScope = 'TRENING';
          else if (ev.type === 'TURNIEJ') detectedScope = 'TURNIEJ';
          else detectedScope = 'SPARING';
        } else {
          detectedScope = 'SPARING';
        }
      }
      const validScope: TacticScope = scope || detectedScope;

      const newTactic: TacticalPlay = {
        id: `tac_${Date.now()}`,
        title: title.trim(),
        phase: phase || 'PRZYJECIE',
        rotation: rotation || 'P1',
        scope: validScope,
        targetOpponent: targetOpponent ? targetOpponent.trim() : undefined,
        matchId: matchId || undefined,
        eventId: eventId || undefined,
        description: description ? description.trim() : '',
        courtPositions: courtPositions || [],
        directives: Array.isArray(directives) ? directives.filter(Boolean) : [],
        drawingData: drawingData || undefined,
        tacticalNotes: tacticalNotes || undefined,
        posts: [],
        createdById: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString()
      };

      if (!db.tactics) db.tactics = [];
      db.tactics.unshift(newTactic);
      writeDatabase(db);

      return NextResponse.json({ success: true, tactic: newTactic });
    }

    if (body.type === 'SCOUTING') {
      const { opponentTeam, matchDate, threatLevel, keyPlayers, serveTargetZones, blockingDirective, coachNotes } = body.report || {};
      if (!opponentTeam) {
        return NextResponse.json({ error: 'Brak nazwy rywala' }, { status: 400 });
      }

      const newScouting: ScoutingReport = {
        id: `scout_${Date.now()}`,
        opponentTeam: opponentTeam.trim(),
        matchDate,
        threatLevel: threatLevel || 'SREDNI',
        keyPlayers: keyPlayers || [],
        serveTargetZones: serveTargetZones || [1, 5],
        blockingDirective: blockingDirective || '',
        coachNotes: coachNotes || '',
        createdAt: new Date().toISOString()
      };

      if (!db.scoutingReports) db.scoutingReports = [];
      db.scoutingReports.unshift(newScouting);
      writeDatabase(db);

      return NextResponse.json({ success: true, report: newScouting });
    }

    if (body.type === 'ADD_MATERIAL') {
      const canManage = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || hasPermission(user, 'canManageTactics');
      if (!canManage) {
        return NextResponse.json({ error: 'Tylko Trener lub Sztab może dodawać materiały taktyczne' }, { status: 403 });
      }

      const { title, type, fileUrl, fileName, fileSize, scope, eventId, matchId, opponentName, description } = body.material || {};
      if (!title?.trim() || !fileUrl) {
        return NextResponse.json({ error: 'Podaj tytuł materiału oraz wgraj plik (PDF lub grafikę)' }, { status: 400 });
      }

      const newMaterial: TacticalMaterial = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        type: type === 'PDF' ? 'PDF' : 'IMAGE',
        fileUrl,
        fileName: fileName ? fileName.trim() : undefined,
        fileSize: fileSize ? fileSize.trim() : undefined,
        scope: scope || 'OGOLNE',
        eventId: eventId || undefined,
        matchId: matchId || undefined,
        opponentName: opponentName ? opponentName.trim() : undefined,
        description: description ? description.trim() : undefined,
        uploadedById: user.id,
        uploadedByName: user.name,
        uploadedAt: new Date().toISOString()
      };

      if (!db.tacticalMaterials) db.tacticalMaterials = [];
      db.tacticalMaterials.unshift(newMaterial);
      writeDatabase(db);

      return NextResponse.json({
        success: true,
        material: newMaterial,
        message: 'Materiał taktyczny został pomyślnie dodany!'
      });
    }

    return NextResponse.json({ error: 'Nieprawidłowy typ operacji' }, { status: 400 });
  } catch (err) {
    console.error('Tactics API error:', err);
    return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const seasonId = getActiveSeasonIdFromRequest(req);
  if (seasonId) {
    return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
  }

  const user = await getServerUser();
  if (!user || !hasPermission(user, 'canManageTactics')) {
    return NextResponse.json({ error: 'Brak uprawnień trenera' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');

  if (!id) {
    return NextResponse.json({ error: 'Brak ID elementu' }, { status: 400 });
  }

  const db = readDatabase();

  if (type === 'SCOUTING') {
    db.scoutingReports = (db.scoutingReports || []).filter(s => s.id !== id);
    writeDatabase(db);
    return NextResponse.json({ success: true });
  } else if (type === 'MATERIAL') {
    db.tacticalMaterials = (db.tacticalMaterials || []).filter(m => m.id !== id);
    writeDatabase(db);
    return NextResponse.json({ success: true, message: 'Materiał usunięty' });
  } else {
    db.tactics = (db.tactics || []).filter(t => t.id !== id);
    writeDatabase(db);
    return NextResponse.json({ success: true });
  }
}
