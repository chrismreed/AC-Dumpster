import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getPaymentConfig } from '@/lib/payment-config';

export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const { amount, collectBillingAddress } = await request.json();
    const config = await getPaymentConfig();

    // Validate amount
    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least $0.50' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: config.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: 'custom_form',
        collectBillingAddress: collectBillingAddress ? 'true' : 'false',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
