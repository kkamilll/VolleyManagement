import { NextRequest, NextResponse } from 'next/server';
import { readDatabaseAsync, writeDatabaseAsync } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { AppDatabase } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user || (!hasPermission(user, 'isAdmin') && user.role !== 'KIEROWNIK' && !user.isCaptain)) {
      return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download');
    const db = await readDatabaseAsync();

    if (download === 'true') {
      const jsonStr = JSON.stringify(db, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `baza_backup_${dateStr}.json`;

      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    const currentSize = Buffer.byteLength(JSON.stringify(db), 'utf-8');

    return NextResponse.json({
      success: true,
      currentSize,
      teamsCount: db.users?.length || 0,
      matchesCount: db.matches?.length || 0,
      backups: []
    });
  } catch (error) {
    console.error('Backup GET error:', error);
    return NextResponse.json({ error: 'Błąd pobierania kopii zapasowych' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user || (!hasPermission(user, 'isAdmin') && user.role !== 'KIEROWNIK' && !user.isCaptain)) {
      return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
    }

    const body = await req.json();
    const { action, databasePayload } = body;

    if (action === 'UPLOAD_RESTORE') {
      if (!databasePayload || typeof databasePayload !== 'object') {
        return NextResponse.json({ error: 'Nieprawidłowy format danych kopii JSON' }, { status: 400 });
      }

      if (!Array.isArray(databasePayload.users)) {
        return NextResponse.json({ error: 'Plik nie zawiera poprawnej struktury bazy (brak listy użytkowników)' }, { status: 400 });
      }

      await writeDatabaseAsync(databasePayload as AppDatabase);

      return NextResponse.json({
        success: true,
        message: 'Baza danych została przywrócona z pliku.'
      });
    }

    return NextResponse.json({ error: 'Nieznana akcja backupu' }, { status: 400 });
  } catch (error) {
    console.error('Backup POST error:', error);
    return NextResponse.json({ error: 'Błąd operacji na kopiach zapasowych' }, { status: 500 });
  }
}

