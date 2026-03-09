import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rentalDurations } from '@shared/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const durations = await db
      .select()
      .from(rentalDurations)
      .orderBy(rentalDurations.days);

    return NextResponse.json(durations);
  } catch (error) {
    console.error('Error fetching rental durations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch rental durations' },
      { status: 500 }
    );
  }
}
