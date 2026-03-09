import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsterPricing } from '@shared/schema';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();

    const { dumpsterId, days, price, sortOrder } = body;

    // Validate required fields
    if (!dumpsterId || !days || price === undefined || sortOrder === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: dumpsterId, days, price, sortOrder' },
        { status: 400 }
      );
    }

    // Create the pricing option
    const [newPricing] = await db
      .insert(dumpsterPricing)
      .values({
        dumpsterId: parseInt(dumpsterId),
        days: parseInt(days),
        price: parseInt(price),
        sortOrder: parseInt(sortOrder),
      })
      .returning();

    return NextResponse.json(newPricing, { status: 201 });
  } catch (error) {
    console.error('Error creating dumpster pricing:', error);
    return NextResponse.json(
      { message: 'Failed to create dumpster pricing' },
      { status: 500 }
    );
  }
}
