/**
 * DEPRECATED — This route has been disabled.
 * The canonical Stripe webhook handler is at /api/webhooks/stripe
 * Point your Stripe dashboard webhook URL there instead.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Use /api/webhooks/stripe' },
    { status: 410 }
  );
}
