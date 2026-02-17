import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsterPricing } from '@shared/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const allPricing = await db
      .select()
      .from(dumpsterPricing)
      .orderBy(dumpsterPricing.dumpsterId, dumpsterPricing.sortOrder);

    return NextResponse.json(allPricing);
  } catch (error) {
    console.error('Error fetching all dumpster pricing:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dumpster pricing' },
      { status: 500 }
    );
  }
}
