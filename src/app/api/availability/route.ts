import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { ne, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const allBookings = await db
      .select({
        deliveryDate: bookings.deliveryDate,
        dumpsterId: bookings.dumpsterId
      })
      .from(bookings)
      .where(
        and(
          ne(bookings.status, 'cancelled'),
          ne(bookings.status, 'completed')
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
