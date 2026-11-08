import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getEffectiveDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser, hasPermission } from '@/lib/auth';
import { Fee, FeePayment, FeeType } from '@/lib/types';

export async function GET(request: Request) {
  const user = await getServerUser();
  const seasonId = getActiveSeasonIdFromRequest(request);
  const db = getEffectiveDatabase(seasonId);

  const sortedFees = [...db.fees].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Financial summary
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let totalOverpayments = 0;

  db.payments.forEach(p => {
    if (p.status === 'OPLACONE') {
      totalCollected += p.amount;
      if (p.overpayment) {
        totalOverpayments += p.overpayment;
      }
    } else if (p.status === 'OCZEKUJE') {
      totalPending += p.amount;
    } else if (p.status === 'ZALEGLE') {
      totalOverdue += p.amount;
    }
  });

  const rawExpenses = db.treasuryExpenses || [];
  const transactions = rawExpenses.map(t => ({
    ...t,
    type: t.type || 'EXPENSE'
  }));

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalIncomes = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRevenues = totalCollected + totalIncomes;
  const netBalance = totalRevenues - totalExpenses;
  const treasuryBalance = totalOverpayments + totalIncomes - totalExpenses;

  // Filter or augment for current user
  let userPayments: FeePayment[] = [];
  let userOverpayments = 0;
  if (user) {
    userPayments = db.payments.filter(p => p.userId === user.id);
    userOverpayments = userPayments
      .filter(p => p.status === 'OPLACONE' && p.overpayment)
      .reduce((acc, curr) => acc + (curr.overpayment || 0), 0);
  }

  return NextResponse.json({
    fees: sortedFees,
    payments: db.payments,
    userPayments,
    treasury: {
      totalOverpayments,
      totalExpenses,
      totalIncomes,
      totalRevenues,
      netBalance,
      balance: treasuryBalance,
      expenses: transactions,
      transactions,
      userOverpayments
    },
    summary: {
      totalCollected,
      totalPending,
      totalOverdue,
      totalIncomes,
      totalRevenues,
      totalExpenses,
      netBalance,
      totalExpected: totalCollected + totalPending + totalOverdue,
      paymentsCount: db.payments.length,
      paidCount: db.payments.filter(p => p.status === 'OPLACONE').length
    }
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

    const body = await request.json();

    if (body.action === 'ADD_TRANSACTION' || body.action === 'ADD_EXPENSE') {
      const canManage = user.role === 'KIEROWNIK' || user.isCaptain || user.role === 'TRENER' || hasPermission(user, 'canManageFees');
      if (!canManage) {
        return NextResponse.json({ error: 'Brak uprawnień do rejestracji wydatków i przychodów' }, { status: 403 });
      }
      const { title, amount, category, description, type, date } = body;
      if (!title || !amount) {
        return NextResponse.json({ error: 'Podaj cel / źródło oraz kwotę transakcji' }, { status: 400 });
      }
      const db = readDatabase();
      if (!db.treasuryExpenses) db.treasuryExpenses = [];
      const newTransaction = {
        id: `tex_${Date.now()}`,
        type: type === 'INCOME' ? ('INCOME' as const) : ('EXPENSE' as const),
        title: title.trim(),
        amount: Math.abs(Number(amount)),
        date: date || new Date().toISOString().slice(0, 10),
        category: category || (type === 'INCOME' ? 'SPONSOR' : 'SPRZET'),
        description: description ? description.trim() : '',
        createdByName: `${user.name} (${user.role === 'KIEROWNIK' ? 'Kierownik' : user.isCaptain ? 'Kapitan' : user.role === 'TRENER' ? 'Trener' : 'Zarząd'})`
      };
      db.treasuryExpenses.unshift(newTransaction);
      writeDatabase(db);
      return NextResponse.json({
        success: true,
        transaction: newTransaction,
        expense: newTransaction,
        message: `Zarejestrowano ${newTransaction.type === 'INCOME' ? 'przychód' : 'wydatek'}: ${newTransaction.title} (${newTransaction.amount} zł)`
      });
    }

    if (user.role !== 'KIEROWNIK' && !user.isCaptain && !hasPermission(user, 'canManageFees')) {
      return NextResponse.json({ error: 'Tylko Kierownik drużyny lub uprawniona osoba może zarządzać i tworzyć składki' }, { status: 403 });
    }

    const { title, amount, dueDate, type, description } = body;

    if (!title || !amount || !dueDate) {
      return NextResponse.json({ error: 'Uzupełnij tytuł, kwotę oraz termin płatności' }, { status: 400 });
    }

    const db = readDatabase();
    const newFee: Fee = {
      id: `fee_${Date.now()}`,
      title: title.trim(),
      amount: Number(amount),
      dueDate,
      type: (type as FeeType) || 'MIESIECZNA',
      description: description ? description.trim() : '',
      createdById: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString()
    };

    db.fees.push(newFee);

    // Automatically create payment records for all players
    const players = db.users.filter(u => u.role === 'ZAWODNIK');
    players.forEach(player => {
      const payment: FeePayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        feeId: newFee.id,
        userId: player.id,
        userName: player.name,
        amount: newFee.amount,
        status: 'OCZEKUJE',
        note: `Składka: ${newFee.title}`
      };
      db.payments.push(payment);
    });

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      fee: newFee,
      message: `Nowa składka "${newFee.title}" na kwotę ${newFee.amount} zł została utworzona dla ${players.length} zawodników!`
    });
  } catch (error) {
    console.error('Create fee error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas dodawania składki' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Dane archiwalne są wyłącznie do odczytu.' }, { status: 403 });
    }

    const user = await getServerUser();
    const canManage = user && (user.role === 'KIEROWNIK' || user.isCaptain || user.role === 'TRENER' || hasPermission(user, 'canManageFees'));
    if (!canManage) {
      return NextResponse.json({ error: 'Brak uprawnień do usuwania operacji finansowych' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    if (transactionId) {
      const db = readDatabase();
      if (db.treasuryExpenses) {
        db.treasuryExpenses = db.treasuryExpenses.filter(t => t.id !== transactionId);
        writeDatabase(db);
      }
      return NextResponse.json({ success: true, message: 'Wpis z księgi wydatków/przychodów został usunięty' });
    }

    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Brak ID składki lub transakcji' }, { status: 400 });
    }

    const db = readDatabase();
    db.fees = db.fees.filter(f => f.id !== id);
    db.payments = db.payments.filter(p => p.feeId !== id);
    writeDatabase(db);

    return NextResponse.json({ success: true, message: 'Składka oraz powiązane płatności zostały usunięte' });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas usuwania' }, { status: 500 });
  }
}

