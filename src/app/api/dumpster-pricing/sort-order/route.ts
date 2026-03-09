import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsterPricing } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();
    const { pricingOrders } = body;

    if (!pricingOrders || !Array.isArray(pricingOrders)) {
      return NextResponse.json(
        { message: 'Invalid pricing orders data' },
        { status: 400 }
      );
    }

    // Update sort order for each pricing option
    for (const { id, sortOrder } of pricingOrders) {
      await db
        .update(dumpsterPricing)
        .set({ sortOrder })
        .where(eq(dumpsterPricing.id, id));
    }

    return NextResponse.json({ message: 'Pricing order updated successfully' });
  } catch (error) {
    console.error('Error updating pricing order:', error);
    return NextResponse.json(
      { message: 'Failed to update pricing order' },
      { status: 500 }
    );
  }
}
