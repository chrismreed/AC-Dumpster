import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerCredits, insertCustomerCreditSchema } from '@shared/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const { customerAccountId, amount, type, description, bookingId } = await request.json();

    if (!customerAccountId || !amount || !type) {
      return NextResponse.json(
        { message: "customerAccountId, amount, and type are required" },
        { status: 400 }
      );
    }

    // Validate the input data
    const validation = insertCustomerCreditSchema.safeParse({
      customerAccountId,
      bookingId: bookingId || null,
      amount,
      type,
      description: description || null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
    });

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: validation.error.errors },
        { status: 400 }
      );
    }

    // Create the credit
    const [credit] = await db
      .insert(customerCredits)
      .values(validation.data)
      .returning();

    return NextResponse.json(credit, { status: 201 });
  } catch (error) {
    console.error('Error creating customer credit:', error);
    return NextResponse.json(
      { message: 'Failed to create credit' },
      { status: 500 }
    );
  }
}
