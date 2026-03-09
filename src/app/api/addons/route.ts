import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addOns } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const allAddOns = await db
      .select()
      .from(addOns)
      .where(eq(addOns.isActive, true))
      .orderBy(addOns.id);

    return NextResponse.json(allAddOns);
  } catch (error) {
    console.error('Error fetching add-ons:', error);
    return NextResponse.json(
      { message: 'Failed to fetch add-ons' },
      { status: 500 }
    );
  }
}
