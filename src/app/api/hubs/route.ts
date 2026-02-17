import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hubs } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const activeHubs = await db
      .select()
      .from(hubs)
      .where(eq(hubs.isActive, true))
      .orderBy(hubs.name);

    return NextResponse.json(activeHubs);
  } catch (error) {
    console.error('Error fetching hubs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch hubs' },
      { status: 500 }
    );
  }
}
