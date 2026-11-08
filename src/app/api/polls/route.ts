import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { Poll, PollOption } from '@/lib/types';

export async function GET(request: Request) {
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);
  const polls: Poll[] = db.polls || [];

  const sorted = [...polls].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ polls: sorted });
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

    const canManage = user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canCreatePolls');
    if (!canManage) {
      return NextResponse.json({ error: 'Tylko Trener, Kapitan lub Kierownik może tworzyć ankiety' }, { status: 403 });
    }

    const body = await request.json();
    const { question, description, options, allowMultiple, expiresAt } = body;

    if (!question?.trim() || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Pytanie i minimum 2 opcje odpowiedzi są wymagane' }, { status: 400 });
    }

    const pollOptions: PollOption[] = options.map((opt: string, idx: number) => ({
      id: `opt_${Date.now()}_${idx}`,
      text: opt.trim(),
      votes: []
    }));

    const newPoll: Poll = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      description: description?.trim() || undefined,
      options: pollOptions,
      allowMultiple: Boolean(allowMultiple),
      expiresAt: expiresAt || undefined,
      isActive: true,
      createdById: user.id,
      createdByName: user.name,
      createdByRole: user.role,
      createdAt: new Date().toISOString()
    };

    const db = readDatabase();
    if (!db.polls) db.polls = [];
    db.polls.unshift(newPoll);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      poll: newPoll,
      message: 'Ankieta została pomyślnie utworzona!'
    });
  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json({ error: 'Błąd podczas tworzenia ankiety' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    const canManage = user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canCreatePolls'));
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do usuwania ankiet' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Brak ID ankiety' }, { status: 400 });
    }

    const db = readDatabase();
    db.polls = (db.polls || []).filter(p => p.id !== id);
    writeDatabase(db);

    return NextResponse.json({ success: true, message: 'Ankieta została usunięta' });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
