import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { businessSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import {
  PAYMENT_SETTINGS_KEYS,
  encrypt,
  decrypt,
  maskSecret,
  clearPaymentConfigCache,
  getPaymentConfig,
} from '@/lib/payment-config';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Secret fields that should be masked in GET responses
const SECRET_FIELDS: Set<string> = new Set([
  PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY,
  PAYMENT_SETTINGS_KEYS.STRIPE_WEBHOOK_SECRET,
  PAYMENT_SETTINGS_KEYS.SQUARE_ACCESS_TOKEN,
]);

// All valid payment setting keys
const ALL_PAYMENT_KEYS = new Set(Object.values(PAYMENT_SETTINGS_KEYS));

export async function GET() {
  try {
    const settings = await db.select().from(businessSettings);
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    const result: Record<string, any> = {};

    for (const [label, key] of Object.entries(PAYMENT_SETTINGS_KEYS)) {
      const dbVal = settingsMap.get(key);
      if (dbVal) {
        if (SECRET_FIELDS.has(key)) {
          const decrypted = decrypt(dbVal);
          result[key] = maskSecret(decrypted);
          // Include boolean flags for whether keys are set
          result[`has_${key}`] = !!decrypted;
        } else {
          result[key] = dbVal;
        }
      } else {
        result[key] = '';
        if (SECRET_FIELDS.has(key)) {
          result[`has_${key}`] = false;
        }
      }
    }

    // Check env var fallbacks for Stripe
    if (!result[`has_${PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY}`] && process.env.STRIPE_SECRET_KEY) {
      result[`has_${PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY}`] = true;
      result[PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY] = maskSecret(process.env.STRIPE_SECRET_KEY);
      result['stripe_secret_key_source'] = 'env';
    }
    if (!result[PAYMENT_SETTINGS_KEYS.STRIPE_PUBLISHABLE_KEY] && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      result[PAYMENT_SETTINGS_KEYS.STRIPE_PUBLISHABLE_KEY] = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      result['stripe_publishable_key_source'] = 'env';
    }
    if (!result[`has_${PAYMENT_SETTINGS_KEYS.STRIPE_WEBHOOK_SECRET}`] && process.env.STRIPE_WEBHOOK_SECRET) {
      result[`has_${PAYMENT_SETTINGS_KEYS.STRIPE_WEBHOOK_SECRET}`] = true;
      result[PAYMENT_SETTINGS_KEYS.STRIPE_WEBHOOK_SECRET] = maskSecret(process.env.STRIPE_WEBHOOK_SECRET);
      result['stripe_webhook_secret_source'] = 'env';
    }

    // Defaults
    if (!result[PAYMENT_SETTINGS_KEYS.PROVIDER]) {
      result[PAYMENT_SETTINGS_KEYS.PROVIDER] = 'stripe';
    }
    if (!result[PAYMENT_SETTINGS_KEYS.CURRENCY]) {
      result[PAYMENT_SETTINGS_KEYS.CURRENCY] = 'usd';
    }
    if (!result[PAYMENT_SETTINGS_KEYS.TEST_MODE]) {
      result[PAYMENT_SETTINGS_KEYS.TEST_MODE] = 'false';
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { validate, ...settings } = body;

    // Filter to only valid payment keys
    const validSettings: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (ALL_PAYMENT_KEYS.has(key as any) && typeof value === 'string') {
        // Don't save masked values (user didn't change the field)
        if (SECRET_FIELDS.has(key as any) && (value.includes('••••') || value === '')) {
          continue;
        }
        validSettings[key] = value;
      }
    }

    // When validating, ensure the active provider has credentials
    if (validate) {
      const provider = validSettings[PAYMENT_SETTINGS_KEYS.PROVIDER] || settings[PAYMENT_SETTINGS_KEYS.PROVIDER] || 'stripe';

      if (provider === 'stripe' && !validSettings[PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY]) {
        // Check if there's an existing DB value
        const existing = await db.select().from(businessSettings).where(
          eq(businessSettings.key, PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY)
        );
        if (!existing.length || !existing[0].value) {
          return NextResponse.json(
            { message: 'Please enter your Stripe secret key before testing the connection.', field: 'stripe_secret_key' },
            { status: 400 }
          );
        }
      }

      if (provider === 'square' && !validSettings[PAYMENT_SETTINGS_KEYS.SQUARE_ACCESS_TOKEN]) {
        const existing = await db.select().from(businessSettings).where(
          eq(businessSettings.key, PAYMENT_SETTINGS_KEYS.SQUARE_ACCESS_TOKEN)
        );
        if (!existing.length || !existing[0].value) {
          return NextResponse.json(
            { message: 'Please enter your Square access token before testing the connection.', field: 'square_access_token' },
            { status: 400 }
          );
        }
      }
    }

    // Optionally validate Stripe keys before saving
    if (validate && validSettings[PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY]) {
      try {
        const testStripe = new Stripe(validSettings[PAYMENT_SETTINGS_KEYS.STRIPE_SECRET_KEY]);
        await testStripe.balance.retrieve();
      } catch (stripeError) {
        return NextResponse.json(
          { message: 'Invalid Stripe secret key. Please check and try again.', field: 'stripe_secret_key' },
          { status: 400 }
        );
      }
    }

    // Optionally validate Square keys before saving
    if (validate && validSettings[PAYMENT_SETTINGS_KEYS.SQUARE_ACCESS_TOKEN]) {
      try {
        const { SquareClient, SquareEnvironment } = await import('square');
        const env = validSettings[PAYMENT_SETTINGS_KEYS.SQUARE_ENVIRONMENT] === 'production'
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox;
        const testSquare = new SquareClient({
          token: validSettings[PAYMENT_SETTINGS_KEYS.SQUARE_ACCESS_TOKEN],
          environment: env,
        });
        await testSquare.locations.list();
      } catch (squareError) {
        return NextResponse.json(
          { message: 'Invalid Square access token. Please check and try again.', field: 'square_access_token' },
          { status: 400 }
        );
      }
    }

    // Save each setting (encrypt secrets)
    const updates = Object.entries(validSettings).map(([key, value]) => {
      const storeValue = SECRET_FIELDS.has(key as any) ? encrypt(value) : value;
      return db
        .insert(businessSettings)
        .values({ key, value: storeValue })
        .onConflictDoUpdate({
          target: businessSettings.key,
          set: { value: storeValue },
        });
    });

    await Promise.all(updates);
    clearPaymentConfigCache();

    return NextResponse.json({ message: 'Payment settings saved successfully' });
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json(
      { message: 'Failed to save payment settings' },
      { status: 500 }
    );
  }
}
