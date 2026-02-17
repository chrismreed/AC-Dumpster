import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { additionalCharges, bookings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

// GET /api/admin/bookings/[id]/additional-charges - Get all charges for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    const charges = await db
      .select({
        id: additionalCharges.id,
        bookingId: additionalCharges.bookingId,
        description: additionalCharges.description,
        amount: additionalCharges.amount,
        isPaid: additionalCharges.isPaid,
        createdBy: additionalCharges.createdBy,
        createdAt: additionalCharges.createdAt,
      })
      .from(additionalCharges)
      .where(eq(additionalCharges.bookingId, bookingId));

    return NextResponse.json(charges);
  } catch (error) {
    console.error('Error fetching additional charges:', error);
    return NextResponse.json({ message: 'Failed to fetch charges' }, { status: 500 });
  }
}

// POST /api/admin/bookings/[id]/additional-charges - Create a new charge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Re-enable auth after testing
    // const authResult = await verifyAdminAuth(request);
    // if (!authResult.authorized) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const { id } = await params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    // Verify booking exists
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json();
    const { description, amount } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Valid amount is required' }, { status: 400 });
    }

    const [newCharge] = await db
      .insert(additionalCharges)
      .values({
        bookingId,
        description: description.trim(),
        amount: Math.round(amount), // Ensure cents are integer
        isPaid: false,
        createdBy: 1, // Default admin user ID for now
      })
      .returning();

    return NextResponse.json(newCharge, { status: 201 });
  } catch (error: any) {
    console.error('Error creating additional charge:', error);
    return NextResponse.json({
      message: 'Failed to create charge',
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}
