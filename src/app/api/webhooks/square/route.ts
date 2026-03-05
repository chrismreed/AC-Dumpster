import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getPaymentConfig } from '@/lib/payment-config';
import { sendNotification } from '@/lib/notifications';
import { createHmac, timingSafeEqual } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const config = await getPaymentConfig();
    if (config.provider !== 'square') {
      return NextResponse.json({ message: 'Square webhooks not active' }, { status: 200 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');

    if (!signature) {
      return NextResponse.json(
        { message: 'Missing Square webhook signature' },
        { status: 401 }
      );
    }

    const squareWebhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!squareWebhookSignatureKey) {
      console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
      return NextResponse.json(
        { message: 'Square webhook not configured' },
        { status: 500 }
      );
    }

    // Square signature: HMAC-SHA256(key, notificationUrl + body), base64-encoded
    const notificationUrl = (process.env.NEXT_PUBLIC_APP_URL || '') + '/api/webhooks/square';
    const hmac = createHmac('sha256', squareWebhookSignatureKey);
    hmac.update(notificationUrl + body);
    const expectedSig = hmac.digest('base64');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      console.error('Square webhook signature verification failed');
      return NextResponse.json(
        { message: 'Webhook signature verification failed' },
        { status: 401 }
      );
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
