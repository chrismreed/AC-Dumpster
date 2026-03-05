import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

const validStatuses = ['pending', 'confirmed', 'delivered', 'picked_up', 'complete', 'cancelled'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { message: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, bookingId))
      .returning();

    if (!updatedBooking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { message: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
