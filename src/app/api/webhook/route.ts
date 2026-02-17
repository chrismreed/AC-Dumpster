import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/payment-config';

export async function POST(request: NextRequest) {
  const stripe = await getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { message: "Stripe not configured" },
      { status: 500 }
    );
  }

  const sig = request.headers.get('stripe-signature');
  const webhookSecret = await getStripeWebhookSecret();

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { message: "Missing Stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;

  try {
    const body = await request.text(); // Get raw body as text

    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { message: `Webhook Error: ${err.message || 'Unknown error'}` },
      { status: 400 }
    );
  }

  // Handle specific events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;

      // Update booking status if bookingId exists in metadata
      if (paymentIntent.metadata?.bookingId) {
        const bookingId = Number(paymentIntent.metadata.bookingId);
        await db
          .update(bookings)
          .set({
            paymentStatus: "paid",
            stripePaymentIntentId: paymentIntent.id
          })
          .where(eq(bookings.id, bookingId));

        console.log(`Payment for booking ${bookingId} succeeded`);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;

      // Update booking status if bookingId exists in metadata
      if (failedPaymentIntent.metadata?.bookingId) {
        const bookingId = Number(failedPaymentIntent.metadata.bookingId);
        await db
          .update(bookings)
          .set({
            paymentStatus: "failed",
            stripePaymentIntentId: failedPaymentIntent.id
          })
          .where(eq(bookings.id, bookingId));

        console.log(`Payment for booking ${bookingId} failed`);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
