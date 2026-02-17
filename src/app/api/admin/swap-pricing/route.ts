import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { swapPricing, insertSwapPricingSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const pricing = await db
      .select()
      .from(swapPricing)
      .orderBy(desc(swapPricing.updatedAt));

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error fetching swap pricing:', error);
    return NextResponse.json(
      { message: 'Failed to fetch swap pricing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const data = await request.json();

    // Validate the input data
    const validation = insertSwapPricingSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid pricing data", errors: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if pricing already exists for this request type
    const [existing] = await db
      .select()
      .from(swapPricing)
      .where(eq(swapPricing.requestType, validation.data.requestType));

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(swapPricing)
        .set({
          ...validation.data,
          updatedAt: new Date(),
        })
        .where(eq(swapPricing.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    } else {
      // Create new
      const [pricing] = await db
        .insert(swapPricing)
        .values(validation.data)
        .returning();

      return NextResponse.json(pricing, { status: 201 });
    }
  } catch (error) {
    console.error('Error saving swap pricing:', error);
    return NextResponse.json(
      { message: 'Failed to save swap pricing' },
      { status: 500 }
    );
  }
}
