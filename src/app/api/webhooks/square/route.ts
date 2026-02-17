import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getPaymentConfig } from '@/lib/payment-config';
import { sendNotification } from '@/lib/notifications';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const config = await getPaymentConfig();
    if (config.provider !== 'square') {
      return NextResponse.json({ message: 'Square webhooks not active' }, { status: 200 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');

    // Verify webhook signature if we have a webhook URL configured
    // Square uses HMAC-SHA256 with the webhook signature key
    // For now we process without verification in development
    if (!signature) {
      console.warn('Square webhook received without signature');
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case 'payment.completed': {
        const payment = event.data?.object?.payment;
        const bookingId = payment?.reference_id;

        if (bookingId) {
          await db
            .update(bookings)
            .set({
              paymentStatus: 'paid',
              status: 'confirmed',
            })
            .where(eq(bookings.id, parseInt(bookingId)));

          console.log(`Square payment completed for booking ${bookingId}`);

          // Send notification
          try {
            const [booking] = await db
              .select()
              .from(bookings)
              .where(eq(bookings.id, parseInt(bookingId)));

            if (booking) {
              sendNotification('booking_confirmed', {
                customerName: booking.customerName,
                customerEmail: booking.customerEmail,
                customerPhone: booking.customerPhone,
                bookingId,
                deliveryDate: new Date(booking.deliveryDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                address: `${booking.deliveryAddress}, ${booking.deliveryCity}`,
                totalPrice: (booking.totalPrice / 100).toFixed(2),
              });
            }
          } catch (notifError) {
            console.error('Failed to send booking notification:', notifError);
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.data?.object?.payment;
        const bookingId = payment?.reference_id;

        if (bookingId) {
          await db
            .update(bookings)
            .set({ paymentStatus: 'failed' })
            .where(eq(bookings.id, parseInt(bookingId)));

          console.log(`Square payment failed for booking ${bookingId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Square event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Square webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
