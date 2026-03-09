import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentLinks } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

// GET /api/admin/bookings/[id]/payment-links - Get all payment links for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    const links = await db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.bookingId, bookingId))
      .orderBy(desc(paymentLinks.createdAt));

    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching payment links:', error);
    return NextResponse.json({ message: 'Failed to fetch payment links' }, { status: 500 });
  }
}
