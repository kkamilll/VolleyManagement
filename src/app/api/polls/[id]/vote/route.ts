import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { getServerUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany, aby zagłosować' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { optionId } = body;

    if (!optionId) {
      return NextResponse.json({ error: 'Brak ID wybranej opcji' }, { status: 400 });
    }

    const db = readDatabase();
    const poll = (db.polls || []).find(p => p.id === id);

    if (!poll) {
      return NextResponse.json({ error: 'Ankieta nie istnieje' }, { status: 404 });
    }

    if (!poll.isActive) {
      return NextResponse.json({ error: 'Ta ankieta została już zakończona' }, { status: 400 });
    }

    // Check if allowMultiple
    if (!poll.allowMultiple) {
      // Remove user's previous votes from all options in this poll
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(uId => uId !== user.id);
      });
    }

    const targetOption = poll.options.find(opt => opt.id === optionId);
    if (!targetOption) {
      return NextResponse.json({ error: 'Nieprawidłowa opcja' }, { status: 400 });
    }

    // Toggle vote if allowMultiple and already voted for this option
    const alreadyVotedThisOption = targetOption.votes.includes(user.id);
    if (alreadyVotedThisOption && poll.allowMultiple) {
      targetOption.votes = targetOption.votes.filter(uId => uId !== user.id);
    } else if (!alreadyVotedThisOption) {
      targetOption.votes.push(user.id);
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      poll,
      message: 'Głos został pomyślnie zarejestrowany!'
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Błąd podczas głosowania' }, { status: 500 });
  }
}
