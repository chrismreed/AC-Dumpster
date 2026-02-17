import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getStripeClient } from '@/lib/payment-config';

export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { message: 'Payment system is not configured' },
        { status: 500 }
      );
    }

    const { paymentIntentId, bookingId } = await request.json();

    if (!paymentIntentId || !bookingId) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update booking with successful payment
      await db
        .update(bookings)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          stripePaymentIntentId: paymentIntentId,
        })
        .where(eq(bookings.id, Number(bookingId)));

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment not completed',
        status: paymentIntent.status,
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { message: 'Failed to confirm payment', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
