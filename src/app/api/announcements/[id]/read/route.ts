import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { getServerUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    const { id } = params;
    const db = readDatabase();
    const announcement = (db.announcements || []).find(a => a.id === id);

    if (!announcement) {
      return NextResponse.json({ error: 'Komunikat nie istnieje' }, { status: 404 });
    }

    if (!announcement.readBy) {
      announcement.readBy = [];
    }

    const alreadyRead = announcement.readBy.some(r => r.userId === user.id);
    if (!alreadyRead) {
      announcement.readBy.push({
        userId: user.id,
        userName: user.name,
        readAt: new Date().toISOString()
      });
      writeDatabase(db);
    }

    return NextResponse.json({
      success: true,
      message: 'Oznaczono komunikat jako przeczytany'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
