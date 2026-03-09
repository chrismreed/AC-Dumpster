import { NextResponse } from 'next/server';
import { getPaymentConfig } from '@/lib/payment-config';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint that returns only what the client needs for payment processing.
 * No secrets are exposed - only publishable keys, provider type, and configuration.
 */
export async function GET() {
  try {
    const config = await getPaymentConfig();

    const enabled = config.provider !== 'none';

    return NextResponse.json({
      provider: config.provider,
      enabled,
      testMode: config.testMode,
      currency: config.currency,
      // Stripe public config
      stripePublishableKey: config.provider === 'stripe' ? config.stripePublishableKey : '',
      // Square public config
      squareApplicationId: config.provider === 'square' ? config.squareApplicationId : '',
      squareLocationId: config.provider === 'square' ? config.squareLocationId : '',
      squareEnvironment: config.provider === 'square' ? config.squareEnvironment : '',
    });
  } catch (error) {
    console.error('Error fetching payment config:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payment configuration' },
      { status: 500 }
    );
  }
}
