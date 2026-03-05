import { NextRequest, NextResponse } from 'next/server';
import { getSquareClient, getSquareLocationId, getPaymentConfig } from '@/lib/payment-config';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const config = await getPaymentConfig();
    if (config.provider !== 'square') {
      return NextResponse.json(
        { error: 'Square is not the active payment provider' },
        { status: 400 }
      );
    }

    const client = await getSquareClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Square is not configured. Please set up Square in admin settings.' },
        { status: 500 }
      );
    }

    const { sourceId, bookingId, note } = await request.json();

    if (!sourceId) {
      return NextResponse.json({ error: 'Payment source token is required' }, { status: 400 });
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Look up the booking server-side — the client must never supply the amount
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, Number(bookingId)));

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
    }

    const locationId = await getSquareLocationId();
    if (!locationId) {
      return NextResponse.json({ error: 'Square location ID is not configured' }, { status: 500 });
    }

    const result = await client.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(booking.totalPrice), // In cents, from DB — never from client
        currency: config.currency.toUpperCase(),
      },
      locationId,
      note: note || `Booking #${bookingId}`,
      referenceId: String(bookingId),
    });

    // Update booking immediately on success — don't rely solely on the webhook
    if (result.payment?.status === 'COMPLETED') {
      await db
        .update(bookings)
        .set({ paymentStatus: 'paid', status: 'confirmed' })
        .where(eq(bookings.id, Number(bookingId)));
    }

    return NextResponse.json({
      paymentId: result.payment?.id,
      status: result.payment?.status,
      orderId: result.payment?.orderId,
    });
  } catch (error: any) {
    console.error('Square payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create Square payment' },
      { status: 500 }
    );
  }
}
