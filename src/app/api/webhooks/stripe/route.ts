import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsters } from '@shared/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { sendNotification } from '@/lib/notifications';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/payment-config';

export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { message: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { message: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = await getStripeWebhookSecret();
    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { message: 'Stripe webhook not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { message: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
          console.error('No bookingId in session metadata');
          return NextResponse.json({ message: 'No bookingId found' }, { status: 400 });
        }

        // Update booking payment status
        await db
          .update(bookings)
          .set({
            paymentStatus: 'paid',
            status: 'confirmed',
            stripePaymentIntentId: session.payment_intent as string || session.id,
          })
          .where(eq(bookings.id, parseInt(bookingId)));

        console.log(`Booking ${bookingId} payment confirmed`);

        // Send booking confirmation notification
        try {
          const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, parseInt(bookingId)));

          if (booking) {
            let dumpsterName = '';
            try {
              const [dumpster] = await db
                .select()
                .from(dumpsters)
                .where(eq(dumpsters.id, booking.dumpsterId));
              dumpsterName = dumpster?.name || '';
            } catch {}

            sendNotification('booking_confirmed', {
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              customerPhone: booking.customerPhone,
              bookingId: bookingId,
              deliveryDate: new Date(booking.deliveryDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              dumpsterSize: dumpsterName,
              address: `${booking.deliveryAddress}, ${booking.deliveryCity}`,
              totalPrice: (booking.totalPrice / 100).toFixed(2),
            });
          }
        } catch (notifError) {
          console.error('Failed to send booking notification:', notifError);
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (bookingId) {
          // Only update + notify if not already marked paid (checkout.session.completed
          // may have already handled this for Checkout-based flows).
          const [existing] = await db
            .select({ paymentStatus: bookings.paymentStatus })
            .from(bookings)
            .where(eq(bookings.id, parseInt(bookingId)));

          if (existing && existing.paymentStatus !== 'paid') {
            await db
              .update(bookings)
              .set({
                paymentStatus: 'paid',
                status: 'confirmed',
                stripePaymentIntentId: paymentIntent.id,
              })
              .where(eq(bookings.id, parseInt(bookingId)));

            console.log(`Payment intent succeeded for booking ${bookingId}`);

            // Send booking confirmation notification
            try {
              const [booking] = await db
                .select()
                .from(bookings)
                .where(eq(bookings.id, parseInt(bookingId)));

              if (booking) {
                let dumpsterName = '';
                try {
                  const [dumpster] = await db
                    .select()
                    .from(dumpsters)
                    .where(eq(dumpsters.id, booking.dumpsterId));
                  dumpsterName = dumpster?.name || '';
                } catch {}

                sendNotification('booking_confirmed', {
                  customerName: booking.customerName,
                  customerEmail: booking.customerEmail,
                  customerPhone: booking.customerPhone,
                  bookingId: bookingId,
                  deliveryDate: new Date(booking.deliveryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  dumpsterSize: dumpsterName,
                  address: `${booking.deliveryAddress}, ${booking.deliveryCity}`,
                  totalPrice: (booking.totalPrice / 100).toFixed(2),
                });
              }
            } catch (notifError) {
              console.error('Failed to send booking notification:', notifError);
            }
          } else {
            console.log(`Booking ${bookingId} already paid — skipping duplicate payment_intent.succeeded`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (bookingId) {
          await db
            .update(bookings)
            .set({
              paymentStatus: 'failed',
            })
            .where(eq(bookings.id, parseInt(bookingId)));

          console.log(`Payment failed for booking ${bookingId}`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await db
            .update(bookings)
            .set({
              paymentStatus: 'cancelled',
              status: 'cancelled',
            })
            .where(eq(bookings.id, parseInt(bookingId)));

          console.log(`Checkout session expired for booking ${bookingId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
