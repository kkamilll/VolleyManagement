import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, getActiveSeasonIdFromRequest } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { PaymentMethod } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const seasonId = getActiveSeasonIdFromRequest(request);
    if (seasonId) {
      return NextResponse.json({ error: 'Tryb archiwalny: Rejestracja wpłat w zarchiwizowanym sezonie jest zablokowana.' }, { status: 403 });
    }

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, method, blikCode, note, customAmount, splitTarget } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Brak ID płatności' }, { status: 400 });
    }

    const db = readDatabase();
    const payment = db.payments.find(p => p.id === paymentId);

    if (!payment) {
      return NextResponse.json({ error: 'Płatność nie została znaleziona' }, { status: 404 });
    }

    // Check permissions: either own payment or Manager/Captain
    const isOwner = payment.userId === user.id;
    const canManage = user.role === 'KIEROWNIK' || user.isCaptain || user.role === 'TRENER';
    if (!isOwner && !canManage) {
      return NextResponse.json({ error: 'Nie masz uprawnień do opłacenia tej składki' }, { status: 403 });
    }

    const paymentMethod: PaymentMethod = method || 'BLIK';
    let transactionId = '';

    if (paymentMethod === 'BLIK') {
      if (!blikCode || blikCode.replace(/\s+/g, '').length !== 6) {
        return NextResponse.json({ error: 'Podaj poprawny 6-cyfrowy kod BLIK' }, { status: 400 });
      }
      transactionId = `BLK-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (paymentMethod === 'KARTA') {
      transactionId = `CRD-${Date.now().toString().slice(-8)}`;
    } else if (paymentMethod === 'PRZELEW') {
      transactionId = `PRZ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    } else {
      transactionId = `GOT-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const originalFeeAmount = payment.amount;
    const finalAmount = customAmount && Number(customAmount) > 0 ? Number(customAmount) : originalFeeAmount;
    
    payment.baseAmount = originalFeeAmount;
    payment.amount = finalAmount;
    if (finalAmount > originalFeeAmount) {
      payment.overpayment = finalAmount - originalFeeAmount;
      payment.splitTarget = splitTarget || 'FUNDUSZ_DRUZYNY';
    }

    payment.status = 'OPLACONE';
    payment.paidAt = new Date().toISOString();
    payment.paymentMethod = paymentMethod;
    payment.transactionId = transactionId;
    payment.verifiedByManager = true;
    if (note) {
      payment.note = note;
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      payment,
      transactionId,
      message: payment.overpayment && payment.overpayment > 0 
        ? `Płatność na kwotę ${payment.amount} zł (${paymentMethod}) zrealizowana! Nadpłata ${payment.overpayment} zł została zasilona do wspólnego skarbca drużyny.`
        : `Płatność na kwotę ${payment.amount} zł (${paymentMethod}) została pomyślnie zrealizowana!`,
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas przetwarzania płatności' }, { status: 500 });
  }
}

