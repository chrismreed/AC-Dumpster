import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getPaymentConfig } from '@/lib/payment-config';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const { bookingId, collectBillingAddress } = await request.json();

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

    const config = await getPaymentConfig();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalPrice, // In cents, from DB — never from client
      currency: config.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: String(bookingId), // Required for confirm-payment security binding
        source: 'booking_checkout',
        collectBillingAddress: collectBillingAddress ? 'true' : 'false',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
