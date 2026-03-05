import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentLinks, additionalCharges, bookings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/payment-config';
import { verifyAdminAuth } from '@/lib/admin-auth';

// POST /api/admin/bookings/[id]/payment-link - Create a payment link for unpaid charges
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json({ message: 'Stripe is not configured' }, { status: 500 });
    }

    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    // Get booking details
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Get unpaid charges for this booking
    const unpaidCharges = await db
      .select()
      .from(additionalCharges)
      .where(
        and(
          eq(additionalCharges.bookingId, bookingId),
          eq(additionalCharges.isPaid, false)
        )
      );

    if (unpaidCharges.length === 0) {
      return NextResponse.json({ message: 'No unpaid charges to create payment link for' }, { status: 400 });
    }

    // Calculate total
    const totalAmount = unpaidCharges.reduce((sum, charge) => sum + charge.amount, 0);

    // Create Stripe products and prices for each charge
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const charge of unpaidCharges) {
      // Create a product for this charge
      const product = await stripe.products.create({
        name: charge.description,
        metadata: {
          chargeId: charge.id.toString(),
          bookingId: bookingId.toString(),
        },
      });

      // Create a price for this charge
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: charge.amount,
        currency: 'usd',
      });

      lineItems.push({
        price: price.id,
        quantity: 1,
      });
    }

    // Create a Stripe Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      metadata: {
        bookingId: bookingId.toString(),
        chargeIds: unpaidCharges.map(c => c.id).join(','),
        type: 'additional_charges',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-success?booking=${bookingId}`,
        },
      },
    });

    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save payment link to database
    const [savedLink] = await db
      .insert(paymentLinks)
      .values({
        bookingId,
        stripePaymentLinkId: paymentLink.id,
        url: paymentLink.url,
        totalAmount,
        status: 'pending',
        expiresAt,
      })
      .returning();

    return NextResponse.json({
      id: savedLink.id,
      url: paymentLink.url,
      totalAmount,
      expiresAt,
      chargeIds: unpaidCharges.map(c => c.id),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return NextResponse.json({
      message: 'Failed to create payment link',
      error: error?.message || String(error)
    }, { status: 500 });
  }
}
