import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsterPricing } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { dumpsterId: string } }
) {
  try {
    const dumpsterId = parseInt(params.dumpsterId);
    if (isNaN(dumpsterId)) {
      return NextResponse.json(
        { message: 'Invalid dumpster ID' },
        { status: 400 }
      );
    }

    const pricing = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.dumpsterId, dumpsterId))
      .orderBy(dumpsterPricing.days);

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error fetching dumpster pricing:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dumpster pricing' },
      { status: 500 }
    );
  }
}
