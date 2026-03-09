import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { swapPricing } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { requestType: string } }
) {
  try {
    const requestType = params.requestType;

    if (!requestType) {
      return NextResponse.json(
        { message: "Request type is required" },
        { status: 400 }
      );
    }

    // Get swap pricing by request type
    const [pricing] = await db
      .select()
      .from(swapPricing)
      .where(eq(swapPricing.requestType, requestType));

    if (!pricing) {
      // Default to no fee if not configured
      return NextResponse.json({ baseFee: 0 });
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error fetching swap pricing:', error);
    return NextResponse.json(
      { message: 'Failed to fetch swap pricing' },
      { status: 500 }
    );
  }
}