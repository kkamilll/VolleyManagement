import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { getSeasonArchiveById, restoreSeasonArchive, deleteSeasonArchive, readDatabase, writeDatabase } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const season = getSeasonArchiveById(id);
    if (!season) {
      return NextResponse.json({ error: 'Zarchiwizowany sezon nie istnieje' }, { status: 404 });
    }

    return NextResponse.json({ season });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
  }
}

// POST: Actions on archive (e.g. { action: 'restore' })
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const isAuthorized = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || user.permissions?.isAdmin;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Brak uprawnień do przywracania sezonu.' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await request.json();

    if (body.action === 'restore') {
      const ok = restoreSeasonArchive(id);
      if (!ok) {
        return NextResponse.json({ error: 'Nie znaleziono archiwum do przywrócenia' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Dane zarchiwizowanego sezonu zostały pomyślnie przywrócone jako bieżący sezon!' });
    }

    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
  }
}

// PATCH: Rename archive
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

    const isAuthorized = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || user.permissions?.isAdmin;
    if (!isAuthorized) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Podaj poprawną nazwę' }, { status: 400 });
    }

    const db = readDatabase();
    const item = (db.seasonsArchive || []).find(s => s.id === id);
    if (!item) return NextResponse.json({ error: 'Nie znaleziono archiwum' }, { status: 404 });

    item.name = name.trim();
    writeDatabase(db);

    return NextResponse.json({ success: true, season: item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
  }
}

// DELETE: Remove archive
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

    const isAuthorized = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || user.permissions?.isAdmin;
    if (!isAuthorized) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const ok = deleteSeasonArchive(id);
    if (!ok) return NextResponse.json({ error: 'Nie znaleziono archiwum do usunięcia' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Archiwum zostało usunięte' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
  }
}

