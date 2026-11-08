import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { Role, UserPermissions } from '@/lib/types';

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    if (user.role !== 'KIEROWNIK' && user.role !== 'TRENER' && !user.isCaptain && !hasPermission(user, 'isAdmin')) {
      return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
    }

    const db = readDatabase();
    const users = db.users.map(({ passwordHash, ...safeUser }) => {
      // Ensure permissions object exists with sensible defaults if undefined
      const defaultPerms: UserPermissions = safeUser.role === 'KIEROWNIK' ? {
        canManageMatches: true,
        canManageEvents: true,
        canManageStats: true,
        canManageTactics: true,
        canManageFees: true,
        canPostAnnouncements: true,
        canCreatePolls: true,
        isAdmin: true
      } : safeUser.role === 'TRENER' ? {
        canManageMatches: true,
        canManageEvents: true,
        canManageStats: true,
        canManageTactics: true,
        canManageFees: false,
        canPostAnnouncements: true,
        canCreatePolls: true,
        isAdmin: false
      } : {
        canManageMatches: false,
        canManageEvents: false,
        canManageStats: false,
        canManageTactics: false,
        canManageFees: false,
        canPostAnnouncements: false,
        canCreatePolls: false,
        isAdmin: false
      };

      return {
        ...safeUser,
        permissions: safeUser.permissions || defaultPerms
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin permissions GET error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Zmiana uprawnień w zarchiwizowanym sezonie jest zablokowana.' }, { status: 403 });
    }

    const currentUser = await getServerUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    if (currentUser.role !== 'KIEROWNIK' && currentUser.role !== 'TRENER' && !currentUser.isCaptain && !hasPermission(currentUser, 'isAdmin')) {
      return NextResponse.json({ error: 'Tylko Kierownik lub Trener może zarządzać uprawnieniami' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, permissions } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Brak ID użytkownika' }, { status: 400 });
    }

    const db = readDatabase();
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    // Update role if provided
    if (role && ['KIEROWNIK', 'TRENER', 'ZAWODNIK'].includes(role)) {
      targetUser.role = role as Role;
    }

    // Update permissions
    if (permissions && typeof permissions === 'object') {
      targetUser.permissions = {
        canManageMatches: Boolean(permissions.canManageMatches),
        canManageEvents: Boolean(permissions.canManageEvents),
        canManageStats: Boolean(permissions.canManageStats),
        canManageTactics: Boolean(permissions.canManageTactics),
        canManageFees: Boolean(permissions.canManageFees),
        canPostAnnouncements: Boolean(permissions.canPostAnnouncements),
        canCreatePolls: Boolean(permissions.canCreatePolls),
        isAdmin: Boolean(permissions.isAdmin)
      };
    }

    writeDatabase(db);

    const { passwordHash: _, ...safeUpdated } = targetUser;
    return NextResponse.json({
      success: true,
      user: safeUpdated,
      message: `Uprawnienia użytkownika ${targetUser.name} zostały pomyślnie zaktualizowane!`
    });
  } catch (error) {
    console.error('Admin permissions PUT error:', error);
    return NextResponse.json({ error: 'Błąd serwera podczas zapisu uprawnień' }, { status: 500 });
  }
}

