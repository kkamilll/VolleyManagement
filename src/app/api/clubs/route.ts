import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  listClubsAsync,
  getClubByIdAsync,
  createClubRecordAsync,
  updateClubRecordAsync,
  deleteClubRecordAsync,
  generateInviteCode,
  DEFAULT_CLUB_ID,
  ClubTheme,
  ClubPlan,
} from '@/lib/clubs';
import { readDatabaseAsync, writeDatabaseAsync, clearClubCache } from '@/lib/db';
import { isMongoConfigured } from '@/lib/mongodb';
import { getServerUser, isPlatformSuperAdmin } from '@/lib/auth';
import { User, PlayerPosition } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    const superAdmin = isPlatformSuperAdmin(user);
    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get('id');

    // Non-SuperAdmins cannot enumerate all client clubs on the platform
    if (!superAdmin) {
      if (!requestedId) {
        return NextResponse.json({ clubs: [], totalClubs: 0, isSuperAdmin: false });
      }
      const single = await getClubByIdAsync(requestedId);
      if (!single || !single.isActive) {
        return NextResponse.json({ clubs: [], totalClubs: 0, isSuperAdmin: false });
      }
      return NextResponse.json({
        clubs: [
          {
            id: single.id,
            name: single.name,
            shortName: single.shortName,
            leagueName: single.leagueName,
            logoUrl: single.logoUrl,
            themeId: single.themeId,
          },
        ],
        totalClubs: 1,
        isSuperAdmin: false,
      });
    }

    const clubs = await listClubsAsync();

    const enriched = await Promise.all(
      clubs.map(async (c) => {
        const db = await readDatabaseAsync(c.id);
        const users = db.users || [];
        const playersCount = users.filter((u) => u.role === 'ZAWODNIK').length;
        const staffCount = users.filter((u) => u.role !== 'ZAWODNIK').length;
        const eventsCount = (db.events || []).length;
        const matchesCount = (db.matches || []).length;
        const tacticsCount = (db.tactics || []).length;
        const trainingsCount = (db.trainingPlans || []).length;
        const announcementsCount = (db.announcements || []).length;
        const feesCount = (db.fees || []).length;
        const payments = db.payments || [];
        const collectedAmount = payments
          .filter((p) => p.status === 'OPLACONE')
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const pendingAmount = payments
          .filter((p) => p.status === 'OCZEKUJE' || p.status === 'ZALEGLE')
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        const dbSizeKb = Math.round((Buffer.byteLength(JSON.stringify(db), 'utf8') / 1024) * 10) / 10;

        const timestamps: number[] = [];
        const pushTs = (val?: string) => {
          if (!val) return;
          const t = Date.parse(val);
          if (!Number.isNaN(t)) timestamps.push(t);
        };
        pushTs(c.createdAt);
        users.forEach((u) => pushTs(u.createdAt));
        (db.events || []).forEach((e) => pushTs(e.createdAt || e.date));
        (db.matches || []).forEach((m) => pushTs(m.createdAt || m.date));
        (db.announcements || []).forEach((a) => pushTs(a.createdAt));
        (db.trainingPlans || []).forEach((t) => pushTs(t.createdAt || t.date));
        const lastActivityAt = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : c.createdAt;

        const managers = users
          .filter((u) => u.role === 'KIEROWNIK')
          .map((u) => ({ name: u.name, email: u.email }));

        const members = users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          position: u.position || '',
          number: u.number,
        }));

        return {
          ...c,
          managers,
          members,
          playersCount,
          staffCount,
          totalUsers: users.length,
          eventsCount,
          matchesCount,
          tacticsCount,
          trainingsCount,
          announcementsCount,
          feesCount,
          collectedAmount,
          pendingAmount,
          dbSizeKb,
          lastActivityAt,
          mongoDocId: c.id === DEFAULT_CLUB_ID ? 'main' : `club_${c.id}`,
        };
      })
    );

    return NextResponse.json({
      clubs: enriched,
      totalClubs: enriched.length,
      isSuperAdmin: true,
      storageInfo: {
        mode: isMongoConfigured() ? 'MongoDB Atlas' : 'Lokalny JSON',
        dbName: process.env.MONGODB_DB_NAME || 'volleyhub',
      },
    });
  } catch (error) {
    console.error('GET /api/clubs error:', error);
    return NextResponse.json({ error: 'Błąd pobierania listy klubów' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getServerUser();
    const superAdmin = isPlatformSuperAdmin(currentUser);

    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Tylko Administrator Portalu (SuperAdmin) może tworzyć nowe kluby.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      city,
      leagueName,
      logoUrl,
      themeId,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPosition,
      plan,
    } = body;

    if (!name?.trim() || !ownerName?.trim() || !ownerEmail?.trim() || !ownerPassword) {
      return NextResponse.json(
        { error: 'Uzupełnij nazwę drużyny oraz dane konta kierownika (imię, e-mail, hasło).' },
        { status: 400 }
      );
    }

    if (String(ownerPassword).length < 6) {
      return NextResponse.json({ error: 'Hasło musi mieć co najmniej 6 znaków.' }, { status: 400 });
    }

    const normalizedEmail = String(ownerEmail).trim().toLowerCase();

    // Ensure unique email across all clubs
    const allClubs = await listClubsAsync();
    for (const c of allClubs) {
      const cDb = await readDatabaseAsync(c.id);
      if (cDb.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return NextResponse.json(
          { error: 'Ten adres e-mail jest już przypisany do istniejącego konta w portalu.' },
          { status: 400 }
        );
      }
    }

    const newClub = await createClubRecordAsync({
      name: String(name),
      city: String(city || 'Polska'),
      leagueName: String(leagueName || 'Liga Amatorska'),
      logoUrl: logoUrl ? String(logoUrl) : '',
      themeId: (themeId as ClubTheme['id']) || 'navy-gold',
      ownerName: String(ownerName),
      ownerEmail: normalizedEmail,
      plan: plan ? (plan as ClubPlan) : 'FREE',
    });

    // Initialize isolated database for the new club
    const clubDb = await readDatabaseAsync(newClub.id);
    const passwordHash = bcrypt.hashSync(String(ownerPassword), 8);
    const validPositions: PlayerPosition[] = [
      'Zarząd',
      'Sztab trenerski',
      'Rozgrywający',
      'Przyjmujący',
      'Atakujący',
      'Środkowy',
      'Libero',
    ];
    const resolvedOwnerPosition: PlayerPosition = validPositions.includes(ownerPosition)
      ? ownerPosition
      : 'Zarząd';

    const founderUser: User = {
      id: `usr_${Date.now()}`,
      name: String(ownerName).trim(),
      email: normalizedEmail,
      role: 'KIEROWNIK',
      isCaptain: false,
      position: resolvedOwnerPosition,
      status: 'Aktywny',
      passwordHash,
      permissions: {
        isAdmin: true,
        canManageMatches: true,
        canManageEvents: true,
        canManageFees: true,
        canManageTactics: true,
        canManageStats: true,
        canPostAnnouncements: true,
        canCreatePolls: true,
      },
      createdAt: new Date().toISOString(),
    };

    clubDb.users = [founderUser];
    clubDb.announcements = [
      {
        id: `ann_welcome_${Date.now()}`,
        title: `Witamy w panelu drużyny ${newClub.name}!`,
        content: `Twój klub jest gotowy do pracy. Udostępnij zawodnikom kod zaproszenia "${newClub.inviteCode}", aby mogli dołączyć do kadry, zgłaszać obecność na treningach i przeglądać taktyki.`,
        priority: 'NORMALNY',
        category: 'OGOLNE',
        createdById: founderUser.id,
        createdByName: founderUser.name,
        createdByRole: 'KIEROWNIK',
        createdAt: new Date().toISOString(),
        readBy: [],
      },
    ];

    await writeDatabaseAsync(clubDb, newClub.id);

    const { passwordHash: _, ...safeUser } = founderUser;
    return NextResponse.json({
      success: true,
      club: newClub,
      user: { ...safeUser, clubId: newClub.id },
      message: `Klub "${newClub.name}" został pomyślnie utworzony!`,
    });
  } catch (error) {
    console.error('POST /api/clubs error:', error);
    return NextResponse.json({ error: 'Błąd podczas tworzenia nowego klubu' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Wymagane logowanie' }, { status: 401 });
    }
    const superAdmin = isPlatformSuperAdmin(user);
    const body = await req.json();
    const { clubId, name, city, leagueName, logoUrl, themeId, plan, isActive, regenerateInviteCode } = body;

    const targetId = clubId || user.clubId || DEFAULT_CLUB_ID;
    const existing = await getClubByIdAsync(targetId);
    if (!existing) {
      return NextResponse.json({ error: 'Klub nie istnieje' }, { status: 404 });
    }

    // Only SuperAdmin or the club's own KIEROWNIK can update club settings
    const isOwnManager = user.clubId === targetId && (user.role === 'KIEROWNIK' || Boolean(user.permissions?.isAdmin));
    if (!superAdmin && !isOwnManager) {
      return NextResponse.json({ error: 'Brak uprawnień do edycji ustawień klubu' }, { status: 403 });
    }

    const patch: Record<string, any> = {};
    if (name?.trim()) {
      patch.name = String(name).trim();
      patch.shortName = String(name).trim().toUpperCase().slice(0, 22);
    }
    if (city !== undefined) {
      patch.city = String(city).trim();
      patch.subtitle = String(city).trim().toUpperCase() || 'VOLLEYBALL CLUB';
    }
    if (leagueName !== undefined) patch.leagueName = String(leagueName).trim();
    if (logoUrl !== undefined) patch.logoUrl = String(logoUrl).trim();
    if (themeId) patch.themeId = themeId;
    if (regenerateInviteCode) patch.inviteCode = generateInviteCode(patch.name || existing.name);

    // Only SuperAdmin can change plan or active status
    if (superAdmin) {
      if (plan) patch.plan = plan;
      if (typeof isActive === 'boolean' && targetId !== DEFAULT_CLUB_ID) {
        patch.isActive = isActive;
      }
    }

    const updated = await updateClubRecordAsync(targetId, patch);
    return NextResponse.json({ success: true, club: updated });
  } catch (error) {
    console.error('PATCH /api/clubs error:', error);
    return NextResponse.json({ error: 'Błąd aktualizacji klubu' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!isPlatformSuperAdmin(user)) {
      return NextResponse.json({ error: 'Tylko SuperAdmin portalu może usuwać kluby' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('id');
    if (!clubId || clubId === DEFAULT_CLUB_ID) {
      return NextResponse.json({ error: 'Nie można usunąć głównego klubu bazowego' }, { status: 400 });
    }

    const ok = await deleteClubRecordAsync(clubId);
    if (!ok) {
      return NextResponse.json({ error: 'Klub nie został znaleziony' }, { status: 404 });
    }
    clearClubCache(clubId);

    return NextResponse.json({ success: true, message: 'Klub został usunięty' });
  } catch (error) {
    console.error('DELETE /api/clubs error:', error);
    return NextResponse.json({ error: 'Błąd usuwania klubu' }, { status: 500 });
  }
}
