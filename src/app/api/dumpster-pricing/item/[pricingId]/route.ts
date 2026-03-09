import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsterPricing } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { pricingId: string } }
) {
  try {
    const pricingId = parseInt(params.pricingId);
    if (isNaN(pricingId)) {
      return NextResponse.json(
        { message: 'Invalid pricing ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { days, price } = body;

    if (days === undefined || price === undefined) {
      return NextResponse.json(
        { message: 'Days and price are required' },
        { status: 400 }
      );
    }

    // Update the pricing option
    const [updated] = await db
      .update(dumpsterPricing)
      .set({ days, price })
      .where(eq(dumpsterPricing.id, pricingId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating dumpster pricing:', error);
    return NextResponse.json(
      { message: 'Failed to update dumpster pricing' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pricingId: string } }
) {
  try {
    // TODO: Add admin authentication middleware
    const pricingId = parseInt(params.pricingId);
    if (isNaN(pricingId)) {
      return NextResponse.json(
        { message: 'Invalid pricing ID' },
        { status: 400 }
      );
    }

    // Delete the pricing option
    await db
      .delete(dumpsterPricing)
      .where(eq(dumpsterPricing.id, pricingId));

    return NextResponse.json({ message: 'Pricing option deleted successfully' });
  } catch (error) {
    console.error('Error deleting dumpster pricing:', error);
    return NextResponse.json(
      { message: 'Failed to delete dumpster pricing' },
      { status: 500 }
    );
  }
}
