import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceZones } from '@shared/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const zones = await db
      .select()
      .from(serviceZones)
      .orderBy(asc(serviceZones.name));

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching service zones:', error);
    return NextResponse.json(
      { message: 'Failed to fetch service zones' },
      { status: 500 }
    );
  }
}
