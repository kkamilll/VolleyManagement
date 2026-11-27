import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { getServerUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user || (user.role !== 'TRENER' && user.role !== 'KIEROWNIK')) {
      return NextResponse.json({ error: 'Tylko Trener lub Kierownik może ustalać skład meczowy' }, { status: 403 });
    }

    const eventId = params.id;
    const body = await request.json();
    const { lineup } = body;

    const db = readDatabase();
    const event = db.events.find(e => e.id === eventId);
    if (!event) {
      return NextResponse.json({ error: 'Wydarzenie nie istnieje' }, { status: 404 });
    }

    event.lineup = lineup;
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Skład meczowy został zaktualizowany!',
      lineup: event.lineup
    });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas zapisywania składu' }, { status: 500 });
  }
}

