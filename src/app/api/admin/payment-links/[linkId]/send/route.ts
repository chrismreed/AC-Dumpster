import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentLinks, bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getStripeClient } from '@/lib/payment-config';
import { verifyAdminAuth } from '@/lib/admin-auth';

// POST /api/admin/payment-links/[linkId]/send - Get message content to send via email or SMS
export async function POST(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json({ message: 'Stripe is not configured' }, { status: 500 });
    }

    const linkId = parseInt(params.linkId);
    if (isNaN(linkId)) {
      return NextResponse.json({ message: 'Invalid link ID' }, { status: 400 });
    }

    const body = await request.json();
    const { method } = body; // 'email' or 'sms'

    if (!method || !['email', 'sms'].includes(method)) {
      return NextResponse.json({ message: 'Invalid method. Use "email" or "sms"' }, { status: 400 });
    }

    const [link] = await db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.id, linkId));

    if (!link) {
      return NextResponse.json({ message: 'Payment link not found' }, { status: 404 });
    }

    if (link.status === 'paid') {
      return NextResponse.json({ message: 'This payment has already been completed' }, { status: 400 });
    }

    // Get booking details for customer info
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, link.bookingId));

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Get the payment link URL from Stripe
    const stripeLink = await stripe.paymentLinks.retrieve(link.stripePaymentLinkId);

    const amountFormatted = (link.totalAmount / 100).toFixed(2);

    if (method === 'email') {
      const subject = `Payment Required - Alley Cat Dumpsters (Booking #${link.bookingId})`;
      const emailBody = `Hi ${booking.customerName},

You have outstanding charges of $${amountFormatted} for your dumpster rental (Booking #${link.bookingId}).

Please complete your payment using the secure link below:

${stripeLink.url}

This link will expire in 24 hours.

If you have any questions, please contact us.

Thank you,
Alley Cat Dumpsters`;

      return NextResponse.json({
        method: 'email',
        to: booking.customerEmail,
        subject,
        body: emailBody,
        paymentUrl: stripeLink.url,
      });
    } else {
      // SMS
      const smsBody = `Alley Cat Dumpsters: You have outstanding charges of $${amountFormatted} for Booking #${link.bookingId}. Pay securely: ${stripeLink.url}`;

      return NextResponse.json({
        method: 'sms',
        to: booking.customerPhone,
        body: smsBody,
        paymentUrl: stripeLink.url,
      });
    }

  } catch (error) {
    console.error('Error preparing payment link message:', error);
    return NextResponse.json({ message: 'Failed to prepare message' }, { status: 500 });
  }
}
