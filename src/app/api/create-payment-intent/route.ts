import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getStripeClient, getPaymentConfig } from '@/lib/payment-config';

export async function POST(request: NextRequest) {
  try {
    console.log("Creating payment intent");

    const stripe = await getStripeClient();
    if (!stripe) {
      console.error("Stripe not configured");
      return NextResponse.json(
        { message: "Stripe not configured" },
        { status: 500 }
      );
    }

    const { amount, bookingId } = await request.json();

    if (!amount) {
      console.error("Amount is required for payment intent");
      return NextResponse.json(
        { message: "Amount is required" },
        { status: 400 }
      );
    }

    // Make sure amount is an integer (in cents) for Stripe
    const amountInteger = Math.round(Number(amount));

    console.log(`Creating payment intent for amount: ${amountInteger} cents, bookingId: ${bookingId || 'none'}`);

    const config = await getPaymentConfig();

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInteger,
        currency: config.currency,
        metadata: {
          bookingId: bookingId ? String(bookingId) : null
        },
        // Only use one of these options, not both
        // payment_method_types: ['card'],
        automatic_payment_methods: {
          enabled: true,
        }
      });

      console.log("Payment intent created successfully:", {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret ? "exists" : "missing"
      });

      // If bookingId is provided, update the booking with the paymentIntentId
      if (bookingId) {
        await db
          .update(bookings)
          .set({
            paymentStatus: "pending",
            stripePaymentIntentId: paymentIntent.id
          })
          .where(eq(bookings.id, Number(bookingId)));

        console.log(`Updated booking ${bookingId} with payment intent ${paymentIntent.id}`);
      }

      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (stripeError: any) {
      console.error("Stripe API error:", stripeError.message);
      console.error("Stripe error type:", stripeError.type);

      return NextResponse.json({
        message: `Stripe API error: ${stripeError.message}`,
        type: stripeError.type
      }, { status: 400 });
    }
  } catch (err) {
    console.error("Error creating payment intent:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
