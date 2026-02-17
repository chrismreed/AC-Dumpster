import { NextRequest, NextResponse } from 'next/server';
import { getSquareClient, getSquareLocationId, getPaymentConfig } from '@/lib/payment-config';
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

    const { sourceId, amount, bookingId, note } = await request.json();

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Payment source token is required' },
        { status: 400 }
      );
    }

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least $1.00' },
        { status: 400 }
      );
    }

    const locationId = await getSquareLocationId();
    if (!locationId) {
      return NextResponse.json(
        { error: 'Square location ID is not configured' },
        { status: 500 }
      );
    }

    const idempotencyKey = randomUUID();

    const result = await client.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amount),
        currency: config.currency.toUpperCase(),
      },
      locationId,
      note: note || `Booking #${bookingId || 'N/A'}`,
      referenceId: bookingId ? String(bookingId) : undefined,
    });

    return NextResponse.json({
      paymentId: result.payment?.id,
      status: result.payment?.status,
      orderId: result.payment?.orderId,
    });
  } catch (error: any) {
    console.error('Square payment error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.detail || 'Failed to create Square payment' },
      { status: 500 }
    );
  }
}
