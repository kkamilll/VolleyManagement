import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { PaymentStatus } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user || user.role !== 'KIEROWNIK') {
      return NextResponse.json({ error: 'Tylko Kierownik może ręcznie zatwierdzać płatności' }, { status: 403 });
    }

    const { paymentId, status, method, note } = await request.json();
    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Brak ID płatności lub statusu' }, { status: 400 });
    }

    const db = readDatabase();
    const payment = db.payments.find(p => p.id === paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Płatność nie została znaleziona' }, { status: 404 });
    }

    payment.status = status as PaymentStatus;
    if (status === 'OPLACONE') {
      if (!payment.paidAt) payment.paidAt = new Date().toISOString();
      if (!payment.paymentMethod) payment.paymentMethod = method || 'GOTOWKA';
      if (!payment.transactionId) payment.transactionId = `MAN-${Date.now().toString().slice(-6)}`;
      payment.verifiedByManager = true;
    } else {
      payment.verifiedByManager = false;
    }

    if (note) payment.note = note;

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      payment,
      message: `Status płatności został zaktualizowany na "${payment.status}"`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas aktualizacji płatności' }, { status: 500 });
  }
}

