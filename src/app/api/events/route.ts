import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { EventItem, EventType, EventStatus, Announcement } from '@/lib/types';

export async function GET(request: Request) {
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);
  const sortedEvents = [...db.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return NextResponse.json({ events: sortedEvents });
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

    const canManage = user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canManageEvents');
    if (!canManage) {
      return NextResponse.json({ error: 'Tylko Trener, Kapitan lub Kierownik może tworzyć sparingi i turnieje' }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, date, endDate, location, opponent, description, costPerPerson, tournamentMatches } = body;

    if (!title || !type || !date || !location) {
      return NextResponse.json({ error: 'Uzupełnij wymagane pola (Tytuł, typ wydarzenia, data, miejsce)' }, { status: 400 });
    }

    const db = readDatabase();

    const newEvent: EventItem = {
      id: `evt_${Date.now()}`,
      title: title.trim(),
      type: type as EventType,
      status: 'ANKIETA',
      date,
      endDate: endDate || undefined,
      location: location.trim(),
      opponent: opponent ? opponent.trim() : undefined,
      description: description ? description.trim() : '',
      costPerPerson: costPerPerson ? Number(costPerPerson) : undefined,
      attendees: [],
      actualAttendees: [],
      tournamentMatches: Array.isArray(tournamentMatches) ? tournamentMatches : undefined,
      createdById: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString()
    };

    // If costPerPerson is provided and type is TURNIEJ, automatically create a linked fee for players!
    if (newEvent.costPerPerson && newEvent.costPerPerson > 0 && newEvent.type === 'TURNIEJ') {
      const feeId = `fee_auto_${Date.now()}`;
      newEvent.linkedFeeId = feeId;

      db.fees.push({
        id: feeId,
        title: `Wpisowe: ${newEvent.title}`,
        amount: newEvent.costPerPerson,
        dueDate: newEvent.date.split('T')[0],
        type: 'TURNIEJ',
        description: `Wpisowe na ${newEvent.title} (${newEvent.location})`,
        createdById: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString()
      });

      // Assign to existing players
      db.users.filter(u => u.role === 'ZAWODNIK').forEach(player => {
        db.payments.push({
          id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          feeId,
          userId: player.id,
          userName: player.name,
          amount: newEvent.costPerPerson!,
          status: 'OCZEKUJE'
        });
      });
    }

    db.events.push(newEvent);

    // Auto-create announcement notification for whole team!
    if (!db.announcements) db.announcements = [];
    const typeLabel = newEvent.type === 'MECZ' ? 'Mecz' : newEvent.type === 'SPARING' ? 'Sparing' : newEvent.type === 'TURNIEJ' ? 'Turniej' : 'Trening';
    const dateFormatted = new Date(newEvent.date).toLocaleDateString('pl-PL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const newAnnouncement: Announcement = {
      id: `ann_evt_${newEvent.id}_${Date.now()}`,
      title: `📅 Nowe wydarzenie: ${newEvent.title}`,
      content: `${typeLabel} zaplanowany na ${dateFormatted} (${newEvent.location}). Zadeklaruj swoją obecność w ankiecie!`,
      priority: newEvent.type === 'TRENING' ? 'NORMALNY' : 'WAZNY',
      category: newEvent.type === 'TRENING' ? 'TRENING' : 'MECZ',
      isPinned: false,
      link: `/events?eventId=${newEvent.id}`,
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
    db.announcements.unshift(newAnnouncement);

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      event: newEvent,
      message: `${newEvent.type === 'SPARING' ? 'Sparing' : newEvent.type === 'TURNIEJ' ? 'Turniej' : 'Wydarzenie'} został zorganizowany!`
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas tworzenia wydarzenia' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    const canManage = user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canManageEvents');
    if (!canManage) {
      return NextResponse.json({ error: 'Tylko Trener, Kapitan lub Kierownik może edytować sparingi i turnieje' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, type, date, endDate, location, opponent, description, status, costPerPerson, actualAttendees, result, tournamentMatches, lineup, liveScore, bestAction, socialDraft } = body;

    if (!id) {
      return NextResponse.json({ error: 'Brak ID wydarzenia' }, { status: 400 });
    }

    const db = readDatabase();
    const event = db.events.find(e => e.id === id);
    if (!event) {
      return NextResponse.json({ error: 'Wydarzenie nie istnieje' }, { status: 404 });
    }

    if (title !== undefined) event.title = title.trim();
    if (type !== undefined) event.type = type;
    if (date !== undefined) event.date = date;
    if (endDate !== undefined) event.endDate = endDate;
    if (location !== undefined) event.location = location.trim();
    if (opponent !== undefined) event.opponent = opponent.trim();
    if (description !== undefined) event.description = description.trim();
    if (costPerPerson !== undefined) event.costPerPerson = costPerPerson;
    if (status !== undefined) event.status = status as EventStatus;
    if (actualAttendees !== undefined) event.actualAttendees = actualAttendees;
    if (result !== undefined) {
      event.result = result;
      if (result && (!event.status || event.status !== 'ZAKONCZONY')) {
        event.status = 'ZAKONCZONY';
        
        // Auto-create result notification
        if (!db.announcements) db.announcements = [];
        const won = (result.teamSetsWon || 0) > (result.opponentSetsWon || 0);
        db.announcements.unshift({
          id: `ann_res_${event.id}_${Date.now()}`,
          title: `${won ? '🏆 Wygrana!' : '🏐 Wynik:'} ${event.title} (${result.teamSetsWon}:${result.opponentSetsWon})`,
          content: `Zakończył się ${event.type.toLowerCase()}: ${event.title}. Końcowy wynik: ${result.teamSetsWon}:${result.opponentSetsWon}. Sprawdź szczegóły w terminarzu!`,
          priority: won ? 'WAZNY' : 'NORMALNY',
          category: 'MECZ',
          link: `/events?eventId=${event.id}`,
          createdById: user.id,
          createdByName: user.name,
          createdByRole: user.role,
          createdAt: new Date().toISOString(),
          readBy: [{ userId: user.id, userName: user.name, readAt: new Date().toISOString() }]
        });
      }
    }
    if (tournamentMatches !== undefined) event.tournamentMatches = tournamentMatches;
    if (lineup !== undefined) {
      const hadNoLineup = !event.lineup;
      event.lineup = lineup;
      if (hadNoLineup && lineup) {
        if (!db.announcements) db.announcements = [];
        db.announcements.unshift({
          id: `ann_lin_${event.id}_${Date.now()}`,
          title: `📋 Skład wyjściowy: ${event.title}`,
          content: `Trener opublikował wyjściową szóstkę i założenia taktyczne na wydarzenie: ${event.title}.`,
          priority: 'WAZNY',
          category: 'MECZ',
          link: `/events?eventId=${event.id}`,
          createdById: user.id,
          createdByName: user.name,
          createdByRole: user.role,
          createdAt: new Date().toISOString(),
          readBy: [{ userId: user.id, userName: user.name, readAt: new Date().toISOString() }]
        });
      }
    }
    if (liveScore !== undefined) event.liveScore = liveScore;
    if (bestAction !== undefined) event.bestAction = bestAction;
    if (socialDraft !== undefined) event.socialDraft = socialDraft;

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      event,
      message: 'Wydarzenie zostało pomyślnie zaktualizowane!'
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Błąd podczas aktualizacji wydarzenia' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    const canManage = user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain || hasPermission(user, 'canManageEvents'));
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do usuwania' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Brak ID wydarzenia' }, { status: 400 });
    }

    const db = readDatabase();
    db.events = db.events.filter(e => e.id !== id);
    writeDatabase(db);

    return NextResponse.json({ success: true, message: 'Wydarzenie zostało usunięte' });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas usuwania wydarzenia' }, { status: 500 });
  }
}

