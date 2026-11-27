import { NextRequest, NextResponse } from 'next/server';
import {
  getClubByIdAsync,
  listClubsAsync,
  ACTIVE_CLUB_COOKIE_NAME,
  DEFAULT_CLUB_ID,
} from '@/lib/clubs';
import {
  getServerUser,
  isPlatformSuperAdmin,
  getActiveClubIdFromCookies,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getServerUser();
    const superAdmin = isPlatformSuperAdmin(user);
    const activeClubId = getActiveClubIdFromCookies();
    const allClubs = await listClubsAsync();
    const club =
      allClubs.find((c) => c.id === activeClubId) ||
      allClubs.find((c) => c.id === DEFAULT_CLUB_ID) ||
      allClubs[0];

    const publicClub = {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      subtitle: club.subtitle,
      city: club.city,
      leagueName: club.leagueName,
      logoUrl: club.logoUrl,
      themeId: club.themeId,
      isActive: club.isActive,
    };

    return NextResponse.json({
      club: user ? club : publicClub,
      isSuperAdmin: superAdmin,
      allClubs: superAdmin ? allClubs : undefined,
    });
  } catch (error) {
    console.error('GET /api/clubs/current error:', error);
    return NextResponse.json({ error: 'Błąd pobierania aktywnego klubu' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' ||
      req.url.startsWith('https://');
    const user = await getServerUser();
    if (!isPlatformSuperAdmin(user)) {
      return NextResponse.json({ error: 'Tylko SuperAdmin może przełączać się między klubami' }, { status: 403 });
    }

    const body = await req.json();
    const { clubId } = body;
    const targetClub = await getClubByIdAsync(clubId);
    if (!targetClub) {
      return NextResponse.json({ error: 'Wybrany klub nie istnieje' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      club: targetClub,
      message: `Przełączono na klub: ${targetClub.name}`,
    });

    response.cookies.set({
      name: ACTIVE_CLUB_COOKIE_NAME,
      value: targetClub.id,
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('POST /api/clubs/current error:', error);
    return NextResponse.json({ error: 'Błąd przełączania klubu' }, { status: 500 });
  }
}
