import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { ne, and, or, eq, gt } from 'drizzle-orm';

const PENDING_EXPIRY_HOURS = 2;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const pendingCutoff = new Date(Date.now() - PENDING_EXPIRY_HOURS * 60 * 60 * 1000);

    const allBookings = await db
      .select({
        deliveryDate: bookings.deliveryDate,
        dumpsterId: bookings.dumpsterId
      })
      .from(bookings)
      .where(
        or(
          // Confirmed/delivered/active always show as unavailable
          and(
            ne(bookings.status, 'cancelled'),
            ne(bookings.status, 'completed'),
            ne(bookings.status, 'pending')
          ),
          // Pending only counts if not expired
          and(
            eq(bookings.status, 'pending'),
            gt(bookings.createdAt, pendingCutoff)
          )
        )
      );

    return NextResponse.json(allBookings);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { message: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
