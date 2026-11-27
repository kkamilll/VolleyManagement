import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabaseAsync, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { TacticalPlay, ScoutingReport, TacticScope, TacticalMaterial } from '@/lib/types';

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }
  const seasonId = getActiveSeasonIdFromRequest(req);
  const db = await getEffectiveDatabaseAsync(seasonId);
  const canSeeHidden = Boolean(
    user && (
      user.role === 'TRENER' ||
      user.role === 'KIEROWNIK' ||
      user.isCaptain ||
      hasPermission(user, 'canManageTactics') ||
      hasPermission(user, 'isAdmin')
    )
  );
  const allTactics = db.tactics || [];
  const tactics = canSeeHidden
    ? allTactics
    : allTactics.filter(t => t.isVisibleToPlayers !== false);
  const scoutingReports = db.scoutingReports || [];
  const materials = db.tacticalMaterials || [];
  const matches = db.matches || [];
  const events = db.events || [];
  
  // Extract players and coaching staff from users
  const players = (db.users || []).map(u => ({
    id: u.id,
    name: u.name,
    number: u.number,
    role: u.role,
    position: u.position,
    height: u.height,
    status: u.status,
    isCaptain: u.isCaptain,
    isCoach: u.role === 'TRENER' || Boolean((u as any).isCoach)
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

      const isStaff = hasPermission(user, 'canManageTactics');
      const newPost = {
        id: `post_${Date.now()}`,
        tacticId,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        authorNumber: user.number,
        content: content.trim(),
        status: isStaff ? ('ZAAKCEPTOWANY' as const) : ('OCZEKUJE' as const),
        coachComment: isStaff ? `Wpis sztabu: ${user.name}` : undefined,
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
      const canManage = hasPermission(user, 'canManageTactics');
      if (!canManage) {
        return NextResponse.json({ error: 'Tylko Trener lub Zarząd może zarządzać sugestiami taktycznymi' }, { status: 403 });
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

    // 2b. Coach or Captain grants tactical editing permission to a requesting player
    if (body.type === 'GRANT_PLAYER_TACTIC_EDIT') {
      const canManage = hasPermission(user, 'canManageTactics');
      if (!canManage) {
        return NextResponse.json({ error: 'Tylko Trener lub Zarząd może nadawać uprawnienia edycji' }, { status: 403 });
      }

      const { targetUserId, postId, tacticId, comment } = body;
      const targetUser = (db.users || []).find(u => u.id === targetUserId);
      if (!targetUser) {
        return NextResponse.json({ error: 'Zawodnik nie został znaleziony' }, { status: 404 });
      }

      if (!targetUser.permissions) {
        targetUser.permissions = {};
      }
      targetUser.permissions.canManageTactics = true;

      // Update post status if associated
      if (tacticId && postId) {
        const tactic = (db.tactics || []).find(t => t.id === tacticId);
        const post = tactic?.posts?.find(p => p.id === postId);
        if (post) {
          post.status = 'ZAAKCEPTOWANY';
          post.coachComment = comment || `🔑 Trener ${user.name} zaakceptował Twoją prośbę i odblokował Ci uprawnienia edycji tablicy taktycznej!`;
        }
      }

      writeDatabase(db);

      return NextResponse.json({
        success: true,
        message: `Uprawnienia edycji taktyki zostały pomyślnie nadane dla: ${targetUser.name}!`
      });
    }

    // 2d. Coach/Captain toggles visibility of a tactic for players (visible vs hidden)
    if (body.type === 'TOGGLE_VISIBILITY') {
      const canManage = hasPermission(user, 'canManageTactics') || user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain;
      if (!canManage) {
        return NextResponse.json({ error: 'Brak uprawnień do zmiany widoczności taktyki' }, { status: 403 });
      }
      const { tacticId, isVisibleToPlayers } = body;
      if (!tacticId) {
        return NextResponse.json({ error: 'Brak ID taktyki' }, { status: 400 });
      }
      const tactic = (db.tactics || []).find(t => t.id === tacticId);
      if (!tactic) {
        return NextResponse.json({ error: 'Nie znaleziono taktyki' }, { status: 404 });
      }
      tactic.isVisibleToPlayers = Boolean(isVisibleToPlayers);
      tactic.updatedAt = new Date().toISOString();
      writeDatabase(db);
      return NextResponse.json({
        success: true,
        tactic,
        message: tactic.isVisibleToPlayers
          ? 'Taktyka jest teraz widoczna dla zawodników.'
          : 'Taktyka została ukryta przed zawodnikami (widoczna tylko dla sztabu).'
      });
    }

    // 2c. Coach updates existing tactic directly (overwrites positions / drawing / title)
    if (body.type === 'UPDATE_TACTIC') {
      const canManage = hasPermission(user, 'canManageTactics');
      if (!canManage) {
        return NextResponse.json({ error: 'Brak uprawnień trenera/kapitana do edycji taktyki' }, { status: 403 });
      }

      if (!db.tactics) db.tactics = [];

      const { id, title, phase, rotation, scope, targetOpponent, matchId, eventId, description, courtPositions, directives, drawingData, tacticalNotes, isVisibleToPlayers } = body.tactic || {};
      if (!id) {
        return NextResponse.json({ error: 'Brak ID taktyki do aktualizacji' }, { status: 400 });
      }

      const tacticIndex = db.tactics.findIndex(t => t.id === id);
      if (tacticIndex === -1) {
        return NextResponse.json({ error: 'Nie znaleziono taktyki' }, { status: 404 });
      }

      const existing = db.tactics[tacticIndex];

      // Resolve opponent if matchId or eventId provided
      let resolvedOpponent = targetOpponent || existing.targetOpponent;
      let resolvedMatchId = matchId !== undefined ? (matchId || undefined) : existing.matchId;
      let resolvedEventId = eventId !== undefined ? (eventId || undefined) : existing.eventId;

      if (resolvedEventId && !resolvedMatchId) {
        const ev = (db.events || []).find((e: any) => e.id === resolvedEventId);
        if (ev) {
          const m = (db.matches || []).find((match: any) =>
            match.id === resolvedEventId.replace('evt_', 'mat_') ||
            (ev.opponent && match.opponent && match.opponent.toLowerCase() === ev.opponent.toLowerCase())
          );
          if (m) resolvedMatchId = m.id;
        }
      } else if (resolvedMatchId && !resolvedEventId) {
        const m = (db.matches || []).find((match: any) => match.id === resolvedMatchId);
        if (m) {
          const ev = (db.events || []).find((e: any) =>
            e.id === resolvedMatchId.replace('mat_', 'evt_') ||
            (m.opponent && e.opponent && e.opponent.toLowerCase() === m.opponent.toLowerCase())
          );
          if (ev) resolvedEventId = ev.id;
        }
      }

      if (resolvedMatchId) {
        const m = (db.matches || []).find((match: any) => match.id === resolvedMatchId);
        if (m) resolvedOpponent = m.opponent;
      } else if (resolvedEventId) {
        const ev = (db.events || []).find((e: any) => e.id === resolvedEventId);
        if (ev && ev.opponent) resolvedOpponent = ev.opponent;
      }

      db.tactics[tacticIndex] = {
        ...existing,
        title: title ? title.trim() : existing.title,
        phase: phase || existing.phase,
        rotation: rotation || existing.rotation,
        scope: scope || existing.scope,
        targetOpponent: resolvedOpponent,
        matchId: resolvedMatchId,
        eventId: resolvedEventId,
        description: description !== undefined ? description.trim() : existing.description,
        courtPositions: courtPositions || existing.courtPositions,
        directives: Array.isArray(directives) ? directives.filter(Boolean) : existing.directives,
        drawingData: drawingData !== undefined ? drawingData : existing.drawingData,
        tacticalNotes: tacticalNotes !== undefined ? tacticalNotes : existing.tacticalNotes,
        isVisibleToPlayers: isVisibleToPlayers !== undefined ? Boolean(isVisibleToPlayers) : existing.isVisibleToPlayers,
        updatedAt: new Date().toISOString()
      };

      writeDatabase(db);
      return NextResponse.json({
        success: true,
        tactic: db.tactics[tacticIndex],
        message: 'Taktyka została pomyślnie zaktualizowana!'
      });
    }

    // 3. Create or Save Tactic (Requires staff permission)
    const canManage = hasPermission(user, 'canManageTactics');
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do edycji taktyki (skontaktuj się z Trenerem lub Zarządem)' }, { status: 403 });
    }

    if (body.type === 'TACTIC') {
      const { title, phase, rotation, scope, targetOpponent, matchId, eventId, description, courtPositions, directives, drawingData, tacticalNotes, isVisibleToPlayers } = body.tactic || {};
      if (!title) {
        return NextResponse.json({ error: 'Podaj tytuł taktyki' }, { status: 400 });
      }

      let resolvedMatchId = matchId || undefined;
      let resolvedEventId = eventId || undefined;

      if (resolvedEventId && !resolvedMatchId) {
        const ev = (db.events || []).find((e: any) => e.id === resolvedEventId);
        if (ev) {
          const m = (db.matches || []).find((match: any) =>
            match.id === resolvedEventId.replace('evt_', 'mat_') ||
            (ev.opponent && match.opponent && match.opponent.toLowerCase() === ev.opponent.toLowerCase())
          );
          if (m) resolvedMatchId = m.id;
        }
      } else if (resolvedMatchId && !resolvedEventId) {
        const m = (db.matches || []).find((match: any) => match.id === resolvedMatchId);
        if (m) {
          const ev = (db.events || []).find((e: any) =>
            e.id === resolvedMatchId.replace('mat_', 'evt_') ||
            (m.opponent && e.opponent && e.opponent.toLowerCase() === m.opponent.toLowerCase())
          );
          if (ev) resolvedEventId = ev.id;
        }
      }

      let detectedScope: TacticScope = 'OGOLNA';
      if (resolvedMatchId) {
        detectedScope = 'MECZ_LIGOWY';
      } else if (resolvedEventId) {
        const ev = (db.events || []).find((e: any) => e.id === resolvedEventId);
        if (ev) {
          if (ev.type === 'TRENING') detectedScope = 'TRENING';
          else if (ev.type === 'TURNIEJ') detectedScope = 'TURNIEJ';
          else if (ev.type === 'MECZ') detectedScope = 'MECZ_LIGOWY';
          else detectedScope = 'SPARING';
        } else {
          detectedScope = 'SPARING';
        }
      }
      const validScope: TacticScope = scope || detectedScope;

      let resolvedOpponent = targetOpponent ? targetOpponent.trim() : undefined;
      if (!resolvedOpponent && resolvedMatchId) {
        const m = (db.matches || []).find((match: any) => match.id === resolvedMatchId);
        if (m) resolvedOpponent = m.opponent;
      } else if (!resolvedOpponent && resolvedEventId) {
        const ev = (db.events || []).find((e: any) => e.id === resolvedEventId);
        if (ev && ev.opponent) resolvedOpponent = ev.opponent;
      }

      const newTactic: TacticalPlay = {
        id: `tac_${Date.now()}`,
        title: title.trim(),
        phase: phase || 'PRZYJECIE',
        rotation: rotation || 'P1',
        scope: validScope,
        targetOpponent: resolvedOpponent,
        matchId: resolvedMatchId,
        eventId: resolvedEventId,
        description: description ? description.trim() : '',
        courtPositions: courtPositions || [],
        directives: Array.isArray(directives) ? directives.filter(Boolean) : [],
        drawingData: drawingData || undefined,
        tacticalNotes: tacticalNotes || undefined,
        isVisibleToPlayers: isVisibleToPlayers !== undefined ? Boolean(isVisibleToPlayers) : true,
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
      const canManage = hasPermission(user, 'canManageTactics');
      if (!canManage) {
        return NextResponse.json({ error: 'Tylko Trener lub Sztab może dodawać materiały taktyczne' }, { status: 403 });
      }

      const { title, type, fileUrl, fileName, fileSize, scope, eventId, matchId, opponentName, description } = body.material || {};
      if (!title?.trim() || !fileUrl) {
        return NextResponse.json({ error: 'Podaj tytuł materiału oraz wgraj plik (PDF lub grafikę)' }, { status: 400 });
      }

      let resolvedMatchId = matchId || undefined;
      let resolvedEventId = eventId || undefined;

      if (resolvedEventId && !resolvedMatchId) {
        const ev = (db.events || []).find((e: any) => e.id === resolvedEventId);
        if (ev) {
          const m = (db.matches || []).find((match: any) =>
            match.id === resolvedEventId.replace('evt_', 'mat_') ||
            (ev.opponent && match.opponent && match.opponent.toLowerCase() === ev.opponent.toLowerCase())
          );
          if (m) resolvedMatchId = m.id;
        }
      } else if (resolvedMatchId && !resolvedEventId) {
        const m = (db.matches || []).find((match: any) => match.id === resolvedMatchId);
        if (m) {
          const ev = (db.events || []).find((e: any) =>
            e.id === resolvedMatchId.replace('mat_', 'evt_') ||
            (m.opponent && e.opponent && e.opponent.toLowerCase() === m.opponent.toLowerCase())
          );
          if (ev) resolvedEventId = ev.id;
        }
      }

      let resolvedOpponent = opponentName ? opponentName.trim() : undefined;
      if (!resolvedOpponent && resolvedMatchId) {
        const m = (db.matches || []).find((match: any) => match.id === resolvedMatchId);
        if (m) resolvedOpponent = m.opponent;
      } else if (!resolvedOpponent && resolvedEventId) {
        const ev = (db.events || []).find((e: any) => e.id === resolvedEventId);
        if (ev && ev.opponent) resolvedOpponent = ev.opponent;
      }

      const newMaterial: TacticalMaterial = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        type: type === 'PDF' ? 'PDF' : type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        fileUrl,
        fileName: fileName ? fileName.trim() : undefined,
        fileSize: fileSize ? fileSize.trim() : undefined,
        scope: scope || 'OGOLNE',
        eventId: resolvedEventId,
        matchId: resolvedMatchId,
        opponentName: resolvedOpponent,
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
