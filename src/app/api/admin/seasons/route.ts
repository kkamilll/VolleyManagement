import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { archiveSeason, getSeasonArchives } from '@/lib/db';

export async function GET() {
  try {
    const archives = getSeasonArchives();
    // Return summaries without full large snapshots for fast list display
    const summaries = archives.map(a => ({
      id: a.id,
      name: a.name,
      archivedAt: a.archivedAt,
      archivedById: a.archivedById,
      archivedByName: a.archivedByName,
      summary: a.summary
    }));
    return NextResponse.json({ seasons: summaries });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const isAuthorized = user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || user.permissions?.isAdmin;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Brak uprawnień. Tylko Kierownik Klubu lub Trener może zakończyć i zarchiwizować sezon.' }, { status: 403 });
    }

    const body = await request.json();
    const { seasonName } = body;

    if (!seasonName || typeof seasonName !== 'string' || seasonName.trim().length < 3) {
      return NextResponse.json({ error: 'Podaj poprawną nazwę sezonu (min. 3 znaki)' }, { status: 400 });
    }

    const archivedRecord = archiveSeason(seasonName.trim(), {
      id: user.id,
      name: user.name
    });

    return NextResponse.json({ 
      success: true, 
      season: archivedRecord,
      message: `Sezon "${archivedRecord.name}" został pomyślnie zarchiwizowany. Rozpoczęto nowy sezon.`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Błąd serwera' }, { status: 500 });
  }
}

