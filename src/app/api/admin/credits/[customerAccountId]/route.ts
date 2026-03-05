import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerCredits } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerAccountId: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const customerAccountId = Number(params.customerAccountId);

    if (!customerAccountId) {
      return NextResponse.json(
        { message: "Customer account ID is required" },
        { status: 400 }
      );
    }

    // Get all credits for this customer account
    const credits = await db
      .select()
      .from(customerCredits)
      .where(eq(customerCredits.customerAccountId, customerAccountId))
      .orderBy(desc(customerCredits.createdAt));

    return NextResponse.json(credits);
  } catch (error) {
    console.error('Error fetching customer credits:', error);
    return NextResponse.json(
      { message: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}