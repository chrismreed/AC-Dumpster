import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentLinks, additionalCharges } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { getStripeClient } from '@/lib/payment-config';

// POST /api/admin/payment-links/[linkId]/check-status - Check and update payment status
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

    const [link] = await db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.id, linkId));

    if (!link) {
      return NextResponse.json({ message: 'Payment link not found' }, { status: 404 });
    }

    // If already paid, return current status
    if (link.status === 'paid') {
      return NextResponse.json({
        status: 'paid',
        paidAt: link.paidAt,
        message: 'Payment already completed',
      });
    }

    // Check for checkout sessions using this payment link
    const sessions = await stripe.checkout.sessions.list({
      payment_link: link.stripePaymentLinkId,
      limit: 10,
    });

    // Look for a completed session
    const completedSession = sessions.data.find(
      (session) => session.payment_status === 'paid'
    );

    if (completedSession) {
      const paidAt = new Date();

      // Update payment link status
      await db
        .update(paymentLinks)
        .set({ status: 'paid', paidAt })
        .where(eq(paymentLinks.id, linkId));

      // Mark associated charges as paid
      // Get charge IDs from the payment link metadata (not session metadata)
      const stripePaymentLink = await stripe.paymentLinks.retrieve(link.stripePaymentLinkId);
      const chargeIds = stripePaymentLink.metadata?.chargeIds?.split(',').map(Number).filter(Boolean);

      if (chargeIds && chargeIds.length > 0) {
        await db
          .update(additionalCharges)
          .set({ isPaid: true })
          .where(inArray(additionalCharges.id, chargeIds));
      }

      return NextResponse.json({
        status: 'paid',
        paidAt,
        message: 'Payment confirmed!',
        receiptUrl: completedSession.receipt_url || null,
      });
    }

    // Check if expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      await db
        .update(paymentLinks)
        .set({ status: 'expired' })
        .where(eq(paymentLinks.id, linkId));

      return NextResponse.json({
        status: 'expired',
        message: 'Payment link has expired',
      });
    }

    return NextResponse.json({
      status: 'pending',
      message: 'Payment not yet received',
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ message: 'Failed to check payment status' }, { status: 500 });
  }
}
