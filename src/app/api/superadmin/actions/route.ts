import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerUser, isPlatformSuperAdmin } from '@/lib/auth';
import { listClubsAsync, getClubByIdAsync } from '@/lib/clubs';
import { readDatabaseAsync, writeDatabaseAsync } from '@/lib/db';
import { AnnouncementPriority, PlayerPosition, Role, User } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET: Download backup JSON for a single club (?clubId=...) or entire portal (?all=true)
export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!isPlatformSuperAdmin(user)) {
      return NextResponse.json({ error: 'Brak uprawnień SuperAdmina' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const all = searchParams.get('all');
    const dateStr = new Date().toISOString().slice(0, 10);

    if (all === 'true') {
      const clubs = await listClubsAsync();
      const databases: Record<string, any> = {};
      for (const c of clubs) {
        databases[c.id] = await readDatabaseAsync(c.id);
      }
      const payload = {
        exportedAt: new Date().toISOString(),
        platform: 'VolleyHub',
        clubs,
        databases,
      };
      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="volleyhub_full_backup_${dateStr}.json"`,
        },
      });
    }

    if (clubId) {
      const club = await getClubByIdAsync(clubId);
      if (!club) {
        return NextResponse.json({ error: 'Klub nie istnieje' }, { status: 404 });
      }
      const db = await readDatabaseAsync(club.id);
      return new NextResponse(JSON.stringify({ club, database: db }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup_${club.id}_${dateStr}.json"`,
        },
      });
    }

    return NextResponse.json({ error: 'Podaj clubId lub all=true' }, { status: 400 });
  } catch (error) {
    console.error('SuperAdmin GET error:', error);
    return NextResponse.json({ error: 'Błąd eksportu kopii zapasowej' }, { status: 500 });
  }
}

// POST: Broadcast announcement to all active clubs OR reset a club manager's password
export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!isPlatformSuperAdmin(user)) {
      return NextResponse.json({ error: 'Brak uprawnień SuperAdmina' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'BROADCAST') {
      const { title, content, priority } = body;
      if (!title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: 'Podaj tytuł i treść komunikatu.' }, { status: 400 });
      }

      const clubs = (await listClubsAsync()).filter((c) => c.isActive);
      const validPriority: AnnouncementPriority =
        priority === 'PILNY' || priority === 'WAZNY' ? priority : 'NORMALNY';

      let delivered = 0;
      for (const c of clubs) {
        const db = await readDatabaseAsync(c.id);
        db.announcements = [
          {
            id: `ann_sys_${Date.now()}_${c.id}`,
            title: `[Komunikat] ${String(title).trim()}`,
            content: String(content).trim(),
            priority: validPriority,
            category: 'OGOLNE',
            isPinned: validPriority === 'PILNY',
            createdById: 'platform_superadmin',
            createdByName: 'Administrator Portalu',
            createdByRole: 'KIEROWNIK',
            createdAt: new Date().toISOString(),
            readBy: [],
          },
          ...(db.announcements || []),
        ];
        await writeDatabaseAsync(db, c.id);
        delivered++;
      }

      return NextResponse.json({
        success: true,
        delivered,
        message: `Wysłano komunikat do ${delivered} aktywnych klubów.`,
      });
    }

    if (action === 'RESET_PASSWORD') {
      const { clubId, email, newPassword } = body;
      if (!clubId || !email || !newPassword || String(newPassword).length < 6) {
        return NextResponse.json(
          { error: 'Podaj klub, adres e-mail użytkownika oraz nowe hasło (min. 6 znaków).' },
          { status: 400 }
        );
      }

      const club = await getClubByIdAsync(clubId);
      if (!club) {
        return NextResponse.json({ error: 'Klub nie istnieje' }, { status: 404 });
      }

      const db = await readDatabaseAsync(club.id);
      const targetUser = (db.users || []).find(
        (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
      );
      if (!targetUser) {
        return NextResponse.json({ error: 'Nie znaleziono użytkownika o takim adresie e-mail w tym klubie.' }, { status: 404 });
      }

      targetUser.passwordHash = bcrypt.hashSync(String(newPassword), 8);
      await writeDatabaseAsync(db, club.id);

      return NextResponse.json({
        success: true,
        message: `Hasło dla ${targetUser.name} (${targetUser.email}) zostało zmienione.`,
      });
    }

    if (action === 'CREATE_USER') {
      const { clubId, name, email, password, role, position, number, phone, isCaptain } = body;
      if (!clubId || !name?.trim() || !email?.trim() || !password || String(password).length < 6) {
        return NextResponse.json(
          { error: 'Podaj klub, imię i nazwisko, e-mail oraz hasło (min. 6 znaków).' },
          { status: 400 }
        );
      }

      const club = await getClubByIdAsync(clubId);
      if (!club) {
        return NextResponse.json({ error: 'Klub nie istnieje' }, { status: 404 });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const allClubs = await listClubsAsync();
      for (const c of allClubs) {
        const cDb = await readDatabaseAsync(c.id);
        if ((cDb.users || []).some((u) => u.email.toLowerCase() === normalizedEmail)) {
          return NextResponse.json(
            { error: 'Ten adres e-mail jest już przypisany do istniejącego konta w portalu.' },
            { status: 400 }
          );
        }
      }

      const assignedRole: Role = role === 'KIEROWNIK' || role === 'TRENER' ? role : 'ZAWODNIK';
      const validPositions: PlayerPosition[] = [
        'Przyjmujący',
        'Atakujący',
        'Rozgrywający',
        'Środkowy',
        'Libero',
        'Sztab trenerski',
        'Zarząd',
      ];
      const defaultPos: PlayerPosition =
        assignedRole === 'KIEROWNIK' ? 'Zarząd' : assignedRole === 'TRENER' ? 'Sztab trenerski' : 'Przyjmujący';
      const assignedPosition: PlayerPosition = validPositions.includes(position) ? position : defaultPos;

      const db = await readDatabaseAsync(club.id);
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: String(name).trim(),
        email: normalizedEmail,
        role: assignedRole,
        isCaptain: Boolean(isCaptain),
        number: number !== undefined && number !== '' ? Number(number) : undefined,
        position: assignedPosition,
        phone: phone ? String(phone).trim() : '',
        status: 'Aktywny',
        passwordHash: bcrypt.hashSync(String(password), 8),
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      if (newUser.role === 'ZAWODNIK' && Array.isArray(db.fees)) {
        db.fees.forEach((fee) => {
          db.payments.push({
            id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            feeId: fee.id,
            userId: newUser.id,
            userName: newUser.name,
            amount: fee.amount,
            status: 'OCZEKUJE',
          });
        });
      }

      await writeDatabaseAsync(db, club.id);
      const { passwordHash: _, ...safeUser } = newUser;

      return NextResponse.json({
        success: true,
        user: safeUser,
        message: `Dodano użytkownika ${newUser.name} do klubu ${club.name}.`,
      });
    }

    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
  } catch (error) {
    console.error('SuperAdmin POST error:', error);
    return NextResponse.json({ error: 'Błąd wykonania akcji SuperAdmina' }, { status: 500 });
  }
}
