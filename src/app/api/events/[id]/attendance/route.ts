import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { AttendanceStatus } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Głosowanie w zarchiwizowanym sezonie jest zablokowane.' }, { status: 403 });
    }

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    const { status, note } = await request.json();
    if (!status || !['BEDE', 'NIE_BEDE', 'NIEPEWNE'].includes(status)) {
      return NextResponse.json({ error: 'Nieprawidłowy status obecności' }, { status: 400 });
    }

    const eventId = params.id;
    const db = readDatabase();
    const event = db.events.find(e => e.id === eventId);

    if (!event) {
      return NextResponse.json({ error: 'Wydarzenie nie istnieje' }, { status: 404 });
    }

    if (!event.attendees) {
      event.attendees = [];
    }

    const existingIndex = event.attendees.findIndex(a => a.userId === user.id);
    const updatedRecord = {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userNumber: user.number,
      position: user.position,
      status: status as AttendanceStatus,
      note: note ? note.trim() : undefined,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      event.attendees[existingIndex] = updatedRecord;
    } else {
      event.attendees.push(updatedRecord);
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Twój status obecności został zaktualizowany!',
      attendees: event.attendees
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ error: 'Błąd podczas aktualizacji obecności' }, { status: 500 });
  }
}

