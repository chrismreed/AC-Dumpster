import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addOns, insertAddOnSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const allAddOns = await db
      .select()
      .from(addOns)
      .orderBy(desc(addOns.createdAt));

    return NextResponse.json(allAddOns);
  } catch (error) {
    console.error('Error fetching admin add-ons:', error);
    return NextResponse.json(
      { message: 'Failed to fetch add-ons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();

    // Convert price from dollars to cents for storage
    const dataWithCentsPrice = {
      ...body,
      price: Math.round(body.price * 100), // Convert dollars to cents
    };

    // Validate the add-on data
    const validatedData = insertAddOnSchema.parse(dataWithCentsPrice);

    // Create the add-on
    const [addOn] = await db
      .insert(addOns)
      .values(validatedData)
      .returning();

    return NextResponse.json(addOn, { status: 201 });
  } catch (error) {
    console.error('Error creating add-on:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid add-on data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create add-on' },
      { status: 500 }
    );
  }
}
