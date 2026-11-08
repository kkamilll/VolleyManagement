import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { getMongoDb, isMongoConfigured, getMongoClient } from '@/lib/mongodb';
import { readDatabase, writeDatabaseAsync, readDatabaseAsync, writeDatabase } from '@/lib/db';

export async function GET() {
  const user = await getServerUser();
  const configured = isMongoConfigured();
  
  if (!configured) {
    return NextResponse.json({
      configured: false,
      mode: 'Lokalny plik JSON (data/db.json)',
      connected: false,
      message: 'Brak zdefiniowanej zmiennej MONGODB_URI w pliku .env. Aplikacja korzysta z lokalnego pliku data/db.json.'
    });
  }

  try {
    const mongoDb = await getMongoDb();
    if (!mongoDb) {
      return NextResponse.json({
        configured: true,
        mode: 'MongoDB Atlas (Chmura)',
        connected: false,
        error: 'Nie udało się połączyć z bazą MongoDB Atlas. Sprawdź poprawność MONGODB_URI w .env.'
      });
    }

    const appStateCol = mongoDb.collection('app_state');
    const doc = await appStateCol.findOne({ _id: 'main' as any });

    return NextResponse.json({
      configured: true,
      mode: 'MongoDB Atlas (Chmura)',
      connected: true,
      databaseName: mongoDb.databaseName,
      hasData: Boolean(doc && doc.data),
      lastUpdated: doc?.updatedAt || null,
      stats: doc?.data ? {
        usersCount: doc.data.users?.length || 0,
        matchesCount: doc.data.matches?.length || 0,
        eventsCount: doc.data.events?.length || 0,
        feesCount: doc.data.fees?.length || 0,
        announcementsCount: doc.data.announcements?.length || 0
      } : null
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      mode: 'MongoDB Atlas (Chmura)',
      connected: false,
      error: err?.message || 'Błąd połączenia z MongoDB Atlas'
    });
  }
}

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user || (user.role !== 'KIEROWNIK' && !user.isCaptain)) {
    return NextResponse.json({ error: 'Brak uprawnień administratorskich' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'PUSH_LOCAL_TO_MONGO') {
      if (!isMongoConfigured()) {
        return NextResponse.json({ error: 'MongoDB Atlas nie jest skonfigurowane w .env' }, { status: 400 });
      }
      const localData = readDatabase();
      await writeDatabaseAsync(localData);
      return NextResponse.json({
        success: true,
        message: 'Pomyślnie wyeksportowano wszystkie lokalne dane z db.json do klastra MongoDB Atlas!'
      });
    }

    if (action === 'PULL_MONGO_TO_LOCAL') {
      if (!isMongoConfigured()) {
        return NextResponse.json({ error: 'MongoDB Atlas nie jest skonfigurowane w .env' }, { status: 400 });
      }
      const mongoData = await readDatabaseAsync();
      writeDatabase(mongoData);
      return NextResponse.json({
        success: true,
        message: 'Pomyślnie pobrano najnowsze dane z MongoDB Atlas i zapisano je do lokalnego pliku db.json!'
      });
    }

    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Błąd operacji' }, { status: 500 });
  }
}

