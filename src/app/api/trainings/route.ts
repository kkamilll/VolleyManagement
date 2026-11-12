import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { TrainingPlan, TrainingExercise, TrainingConclusion, TrainingComment } from '@/lib/types';

export async function GET(req: NextRequest) {
  const seasonId = getActiveSeasonIdFromRequest(req);
  const db = getEffectiveDatabase(seasonId);
  const plans = db.trainingPlans || [];
  const events = (db.events || []).filter(e => e.type === 'TRENING');
  const players = (db.users || [])
    .filter(u => u.role === 'ZAWODNIK')
    .map(u => ({ id: u.id, name: u.name, number: u.number, position: u.position }));

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const eventId = searchParams.get('eventId');

  if (id) {
    const plan = plans.find(p => p.id === id);
    if (!plan) return NextResponse.json({ error: 'Nie znaleziono planu treningu' }, { status: 404 });
    return NextResponse.json({ plan, players, events });
  }

  if (eventId) {
    const plan = plans.find(p => p.eventId === eventId);
    return NextResponse.json({ plan: plan || null, players, events });
  }

  return NextResponse.json({
    plans: plans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    events,
    players
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

  const canManage = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || hasPermission(user, 'canManageTactics');

  try {
    const body = await req.json();
    const db = readDatabase();
    if (!db.trainingPlans) db.trainingPlans = [];

    // 1. Dodawanie komentarza przez dowolnego zalogowanego użytkownika
    if (body.type === 'ADD_COMMENT') {
      const { planId, content } = body;
      if (!planId || !content?.trim()) {
        return NextResponse.json({ error: 'Brak treści komentarza' }, { status: 400 });
      }

      const plan = db.trainingPlans.find(p => p.id === planId);
      if (!plan) return NextResponse.json({ error: 'Nie znaleziono planu treningu' }, { status: 404 });

      if (!plan.comments) plan.comments = [];
      const newComment: TrainingComment = {
        id: `com_${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        content: content.trim(),
        createdAt: new Date().toISOString()
      };

      plan.comments.push(newComment);
      writeDatabase(db);
      return NextResponse.json({ success: true, comment: newComment });
    }

    // Pozostałe akcje wymagają uprawnień trenerskich
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień trenera do edycji rozpiski treningowej' }, { status: 403 });
    }

    // 2. Utworzenie nowego planu treningowego
    if (body.type === 'CREATE_PLAN') {
      const { title, date, time, location, durationMinutes, mainGoal, secondaryGoals, intensity, equipmentNeeded, eventId, coachNotes } = body.plan || {};
      if (!title || !date || !mainGoal) {
        return NextResponse.json({ error: 'Podaj tytuł, datę oraz cel główny treningu' }, { status: 400 });
      }

      const newPlan: TrainingPlan = {
        id: `train_${Date.now()}`,
        eventId: eventId || undefined,
        title: title.trim(),
        date,
        time: time || '19:30',
        location: location || 'Hala POSiR, ul. Chwiałkowskiego',
        durationMinutes: Number(durationMinutes) || 90,
        mainGoal: mainGoal.trim(),
        secondaryGoals: Array.isArray(secondaryGoals) ? secondaryGoals.filter(Boolean) : [],
        intensity: intensity || 'SREDNIA',
        equipmentNeeded: equipmentNeeded ? equipmentNeeded.trim() : '15 piłek Mikasa V200W, tablica, 4 pachołki, taśmy oporowe',
        exercises: [],
        conclusions: [],
        comments: [],
        coachNotes: coachNotes ? coachNotes.trim() : '',
        videoUrls: [],
        createdById: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString()
      };

      db.trainingPlans.unshift(newPlan);
      writeDatabase(db);
      return NextResponse.json({ success: true, plan: newPlan });
    }

    // 3. Aktualizacja głównych danych planu treningowego
    if (body.type === 'UPDATE_PLAN') {
      const { id, title, date, time, location, durationMinutes, mainGoal, secondaryGoals, intensity, equipmentNeeded, coachNotes, videoUrls } = body.plan || {};
      if (!id) return NextResponse.json({ error: 'Brak ID planu' }, { status: 400 });

      const planIndex = db.trainingPlans.findIndex(p => p.id === id);
      if (planIndex === -1) return NextResponse.json({ error: 'Nie znaleziono planu treningu' }, { status: 404 });

      const current = db.trainingPlans[planIndex];
      db.trainingPlans[planIndex] = {
        ...current,
        title: title ? title.trim() : current.title,
        date: date || current.date,
        time: time || current.time,
        location: location !== undefined ? location.trim() : current.location,
        durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : current.durationMinutes,
        mainGoal: mainGoal ? mainGoal.trim() : current.mainGoal,
        secondaryGoals: secondaryGoals !== undefined ? secondaryGoals : current.secondaryGoals,
        intensity: intensity || current.intensity,
        equipmentNeeded: equipmentNeeded !== undefined ? equipmentNeeded.trim() : current.equipmentNeeded,
        coachNotes: coachNotes !== undefined ? coachNotes.trim() : current.coachNotes,
        videoUrls: videoUrls !== undefined ? videoUrls : current.videoUrls,
        updatedAt: new Date().toISOString()
      };

      writeDatabase(db);
      return NextResponse.json({ success: true, plan: db.trainingPlans[planIndex] });
    }

    // 4. Dodanie lub edycja ćwiczenia (z rysunkiem, grafiką, wideo)
    if (body.type === 'SAVE_EXERCISE') {
      const { planId, exercise } = body;
      if (!planId || !exercise?.title) {
        return NextResponse.json({ error: 'Podaj nazwę ćwiczenia oraz ID planu' }, { status: 400 });
      }

      const plan = db.trainingPlans.find(p => p.id === planId);
      if (!plan) return NextResponse.json({ error: 'Nie znaleziono planu treningu' }, { status: 404 });
      if (!plan.exercises) plan.exercises = [];

      const exId = exercise.id || `ex_${Date.now()}`;
      const exIndex = plan.exercises.findIndex(e => e.id === exId);

      const exerciseData: TrainingExercise = {
        id: exId,
        title: exercise.title.trim(),
        category: exercise.category || 'TECHNIKA',
        durationMinutes: Number(exercise.durationMinutes) || 15,
        description: exercise.description ? exercise.description.trim() : '',
        keyPoints: Array.isArray(exercise.keyPoints) ? exercise.keyPoints.filter(Boolean) : [],
        courtDrawing: exercise.courtDrawing || undefined,
        imageUrl: exercise.imageUrl || undefined,
        videoUrl: exercise.videoUrl ? exercise.videoUrl.trim() : undefined
      };

      if (exIndex >= 0) {
        plan.exercises[exIndex] = exerciseData;
      } else {
        plan.exercises.push(exerciseData);
      }

      plan.updatedAt = new Date().toISOString();
      writeDatabase(db);
      return NextResponse.json({ success: true, plan, exercise: exerciseData });
    }

    // 5. Usunięcie ćwiczenia
    if (body.type === 'DELETE_EXERCISE') {
      const { planId, exerciseId } = body;
      const plan = db.trainingPlans.find(p => p.id === planId);
      if (!plan) return NextResponse.json({ error: 'Nie znaleziono planu' }, { status: 404 });

      plan.exercises = (plan.exercises || []).filter(e => e.id !== exerciseId);
      plan.updatedAt = new Date().toISOString();
      writeDatabase(db);
      return NextResponse.json({ success: true, plan });
    }

    // 6. Dodanie wniosku/podsumowania trenera (plus, minus, uwaga indywidualna)
    if (body.type === 'ADD_CONCLUSION') {
      const { planId, conclusionType, content, targetPlayerId, targetPlayerName } = body;
      if (!planId || !content?.trim()) {
        return NextResponse.json({ error: 'Brak treści wniosku trenerskiego' }, { status: 400 });
      }

      const plan = db.trainingPlans.find(p => p.id === planId);
      if (!plan) return NextResponse.json({ error: 'Nie znaleziono planu treningu' }, { status: 404 });
      if (!plan.conclusions) plan.conclusions = [];

      const newConclusion: TrainingConclusion = {
        id: `concl_${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        type: conclusionType || 'PLUS',
        targetPlayerId: targetPlayerId || undefined,
        targetPlayerName: targetPlayerName || undefined,
        content: content.trim(),
        createdAt: new Date().toISOString()
      };

      plan.conclusions.unshift(newConclusion);
      plan.updatedAt = new Date().toISOString();
      writeDatabase(db);
      return NextResponse.json({ success: true, conclusion: newConclusion, plan });
    }

    // 7. Usunięcie wniosku trenera
    if (body.type === 'DELETE_CONCLUSION') {
      const { planId, conclusionId } = body;
      const plan = db.trainingPlans.find(p => p.id === planId);
      if (!plan) return NextResponse.json({ error: 'Nie znaleziono planu' }, { status: 404 });

      plan.conclusions = (plan.conclusions || []).filter(c => c.id !== conclusionId);
      plan.updatedAt = new Date().toISOString();
      writeDatabase(db);
      return NextResponse.json({ success: true, plan });
    }

    return NextResponse.json({ error: 'Nieprawidłowy typ operacji' }, { status: 400 });
  } catch (err) {
    console.error('Training API error:', err);
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
  if (!id) return NextResponse.json({ error: 'Brak ID planu' }, { status: 400 });

  const db = readDatabase();
  db.trainingPlans = (db.trainingPlans || []).filter(p => p.id !== id);
  writeDatabase(db);
  return NextResponse.json({ success: true, message: 'Plan treningowy został usunięty' });
}
