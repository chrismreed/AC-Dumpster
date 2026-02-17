import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, paymentLinks } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getStripeClient } from '@/lib/payment-config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Fetch the booking
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    let updatedCount = 0;
    const updates: string[] = [];

    const stripe = await getStripeClient();

    // Check original booking payment status if it has a payment intent
    if (booking.stripePaymentIntentId && booking.paymentStatus !== 'paid' && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          booking.stripePaymentIntentId
        );
        console.log(
          `Checking payment intent ${booking.stripePaymentIntentId}: status=${paymentIntent.status}, current booking status=${booking.paymentStatus}`
        );

        if (paymentIntent.status === 'succeeded' && booking.paymentStatus !== 'paid') {
          await db
            .update(bookings)
            .set({ paymentStatus: 'paid' })
            .where(eq(bookings.id, bookingId));
          console.log(`Updated booking ${bookingId} payment status to paid`);
          updatedCount++;
          updates.push('Updated booking payment to paid status');
        } else if (paymentIntent.status === 'succeeded') {
          updates.push('Booking payment already marked as paid');
        } else {
          updates.push(`Payment intent status: ${paymentIntent.status}`);
        }
      } catch (stripeError: any) {
        console.warn(
          `Error checking Stripe payment intent ${booking.stripePaymentIntentId}:`,
          stripeError
        );
        updates.push(`Error checking payment: ${stripeError.message}`);
      }
    }

    // Check payment links for additional charges
    const links = await db.select().from(paymentLinks).where(eq(paymentLinks.bookingId, bookingId));

    for (const link of links) {
      if (link.status !== 'paid' && stripe && link.stripePaymentLinkId) {
        try {
          // Check if there are any successful checkout sessions
          const sessions = await stripe.checkout.sessions.list({
            payment_link: link.stripePaymentLinkId,
            status: 'complete',
          });

          if (sessions.data.length > 0) {
            // Payment was completed, update status
            await db
              .update(paymentLinks)
              .set({
                status: 'paid',
                paidAt: new Date(),
              })
              .where(eq(paymentLinks.id, link.id));
            updatedCount++;
            updates.push('Updated payment link to paid status');
          }
        } catch (stripeError) {
          console.warn(
            `Error checking Stripe payment link ${link.stripePaymentLinkId}:`,
            stripeError
          );
        }
      }
    }

    const message =
      updatedCount > 0 ? `${updates.join(', ')}` : 'All payment statuses are current';

    return NextResponse.json({ message, updatedCount, updates });
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status', details: error.message },
      { status: 500 }
    );
  }
}
