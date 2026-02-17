import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { businessSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const settings = await db
      .select()
      .from(businessSettings);

    // Convert to key-value pairs for easier frontend consumption
    const settingsMap: Record<string, any> = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
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
    // TODO: Add admin authentication middleware
    const body = await request.json();

    // Update multiple settings
    const updates = [];
    for (const [key, value] of Object.entries(body)) {
      updates.push(
        db
          .insert(businessSettings)
          .values({ key, value: String(value) })
          .onConflictDoUpdate({
            target: businessSettings.key,
            set: { value: String(value) }
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
