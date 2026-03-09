import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentLinks } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getStripeClient } from '@/lib/payment-config';
import { verifyAdminAuth } from '@/lib/admin-auth';

// DELETE /api/admin/payment-links/[linkId] - Delete/deactivate a payment link
export async function DELETE(
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

    if (link.status === 'paid') {
      return NextResponse.json(
        { message: 'Cannot delete a paid payment link' },
        { status: 400 }
      );
    }

    // Deactivate the Stripe payment link
    try {
      await stripe.paymentLinks.update(link.stripePaymentLinkId, {
        active: false,
      });
    } catch (stripeError) {
      console.error('Error deactivating Stripe payment link:', stripeError);
      // Continue even if Stripe deactivation fails
    }

    // Delete from database
    await db.delete(paymentLinks).where(eq(paymentLinks.id, linkId));

    return NextResponse.json({ message: 'Payment link deleted' });
  } catch (error) {
    console.error('Error deleting payment link:', error);
    return NextResponse.json({ message: 'Failed to delete payment link' }, { status: 500 });
  }
}
