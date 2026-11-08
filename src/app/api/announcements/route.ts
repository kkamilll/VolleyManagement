import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { Announcement, AnnouncementCategory, AnnouncementPriority } from '@/lib/types';

export async function GET(request: Request) {
  const user = await getServerUser();
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);
  const announcements: Announcement[] = db.announcements || [];

  // Sort pinned first, then by date descending
  const sorted = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unreadCount = user 
    ? sorted.filter(a => !a.readBy.some(r => r.userId === user.id)).length
    : 0;

  return NextResponse.json({
    announcements: sorted,
    unreadCount,
  });
}

export async function POST(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    const canManage = user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canPostAnnouncements');
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do dodawania komunikatów' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, priority, category, isPinned } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Podaj tytuł i treść komunikatu' }, { status: 400 });
    }

    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      priority: (priority as AnnouncementPriority) || 'NORMALNY',
      category: (category as AnnouncementCategory) || 'OGOLNE',
      isPinned: Boolean(isPinned),
      createdById: user.id,
      createdByName: user.name,
      createdByRole: user.role,
      createdAt: new Date().toISOString(),
      readBy: [
        {
          userId: user.id,
          userName: user.name,
          readAt: new Date().toISOString()
        }
      ]
    };

    const db = readDatabase();
    if (!db.announcements) db.announcements = [];
    db.announcements.unshift(newAnnouncement);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement,
      message: 'Komunikat został opublikowany!'
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Błąd podczas tworzenia komunikatu' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    const canManage = user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canPostAnnouncements'));
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do usuwania komunikatów' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Brak ID komunikatu' }, { status: 400 });
    }

    const db = readDatabase();
    db.announcements = (db.announcements || []).filter(a => a.id !== id);
    writeDatabase(db);

    return NextResponse.json({ success: true, message: 'Komunikat został usunięty' });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas usuwania' }, { status: 500 });
  }
}
