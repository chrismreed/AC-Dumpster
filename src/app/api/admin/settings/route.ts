import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { businessSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { encrypt, decrypt, maskSecret } from '@/lib/payment-config';

// Keys stored encrypted at rest (same AES-256-GCM pattern as payment secrets)
const NOTIFICATION_SECRET_KEYS = new Set<string>([
  'sendgrid_api_key',
  'twilio_auth_token',
]);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    const settings = await db
      .select()
      .from(businessSettings);

    // Convert to key-value pairs for frontend consumption.
    // Secret fields are decrypted then masked so the UI can show ••••1234
    // without ever exposing the plaintext value over the wire.
    const settingsMap: Record<string, string> = {};
    settings.forEach(setting => {
      if (NOTIFICATION_SECRET_KEYS.has(setting.key)) {
        const plaintext = decrypt(setting.value || '');
        settingsMap[setting.key] = plaintext ? maskSecret(plaintext) : '';
      } else {
        settingsMap[setting.key] = setting.value || '';
      }
    });

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    const body = await request.json();

    // Update multiple settings.
    // Secret keys are encrypted before writing; masked values sent back from
    // GET (••••1234) are skipped so we never overwrite real data with a mask.
    const updates = [];
    for (const [key, value] of Object.entries(body)) {
      const strVal = String(value);
      // Skip if the frontend echoed back a masked value (all bullets)
      if (strVal.includes('••••')) continue;
      const storeVal = NOTIFICATION_SECRET_KEYS.has(key) ? encrypt(strVal) : strVal;
      updates.push(
        db
          .insert(businessSettings)
          .values({ key, value: storeVal })
          .onConflictDoUpdate({
            target: businessSettings.key,
            set: { value: storeVal }
          })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
