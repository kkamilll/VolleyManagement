import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, saveBackupSnapshot, listDatabaseBackups, restoreBackupFile } from '@/lib/db';
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

    if (download === 'true') {
      const db = readDatabase();
      const jsonStr = JSON.stringify(db, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `angels_ztp_baza_backup_${dateStr}.json`;

      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    const backups = listDatabaseBackups();
    const db = readDatabase();
    const currentSize = Buffer.byteLength(JSON.stringify(db), 'utf-8');

    return NextResponse.json({
      success: true,
      currentSize,
      teamsCount: db.users?.length || 0,
      matchesCount: db.matches?.length || 0,
      backups
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
    const { action, filename, label, databasePayload } = body;

    // 1. Utwórz ręczny punkt przywracania
    if (action === 'CREATE') {
      const newFilename = saveBackupSnapshot(undefined, label || 'manual');
      return NextResponse.json({
        success: true,
        message: `Utworzono punkt przywracania: ${newFilename}`,
        filename: newFilename,
        backups: listDatabaseBackups()
      });
    }

    // 2. Przywróć z istniejącego pliku na serwerze
    if (action === 'RESTORE') {
      if (!filename) {
        return NextResponse.json({ error: 'Nie podano nazwy pliku kopii do przywrócenia' }, { status: 400 });
      }

      // Kopia bezpieczeństwa stanu obecnego przed przywróceniem
      saveBackupSnapshot(undefined, 'przed_przywroceniem');

      const success = restoreBackupFile(filename);
      if (!success) {
        return NextResponse.json({ error: 'Nie udało się przywrócić bazy z wybranego pliku' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Baza danych została pomyślnie przywrócona z pliku: ${filename}!`,
        backups: listDatabaseBackups()
      });
    }

    // 3. Wgraj plik JSON i przywróć bazę
    if (action === 'UPLOAD_RESTORE') {
      if (!databasePayload || typeof databasePayload !== 'object') {
        return NextResponse.json({ error: 'Nieprawidłowy format danych kopii JSON' }, { status: 400 });
      }

      // Prosta walidacja struktury
      if (!Array.isArray(databasePayload.users)) {
        return NextResponse.json({ error: 'Plik nie zawiera poprawnej struktury bazy Angels ZTP (brak listy użytkowników)' }, { status: 400 });
      }

      // Kopia bezpieczeństwa przed wgraniem
      saveBackupSnapshot(undefined, 'przed_wgraniem_pliku');

      writeDatabase(databasePayload as AppDatabase);

      return NextResponse.json({
        success: true,
        message: 'Baza danych została pomyślnie nadpisana i przywrócona z przesłanego pliku!',
        backups: listDatabaseBackups()
      });
    }

    return NextResponse.json({ error: 'Nieznana akcja backupu' }, { status: 400 });
  } catch (error) {
    console.error('Backup POST error:', error);
    return NextResponse.json({ error: 'Błąd operacji na kopiach zapasowych' }, { status: 500 });
  }
}

