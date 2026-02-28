import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loadRecords, insertLoadRecordSchema, bookings, fleetUnits, customerAccounts } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingIdParam = searchParams.get('bookingId');
    const bookingId = bookingIdParam ? parseInt(bookingIdParam, 10) : null;

    const conditions = bookingId ? [eq(loadRecords.bookingId, bookingId)] : [];

    const allLoadRecords = await db
      .select({
        id: loadRecords.id,
        bookingId: loadRecords.bookingId,
        swapRequestId: loadRecords.swapRequestId,
        loadNumber: loadRecords.loadNumber,
        priceCharged: loadRecords.priceCharged,
        loadWeight: loadRecords.loadWeight,
        notes: loadRecords.notes,
        receiptPhotoUrl: loadRecords.receiptPhotoUrl,
        completedAt: loadRecords.completedAt,
        createdAt: loadRecords.createdAt,
        // Join with booking
        booking: {
          id: bookings.id,
          customerName: bookings.customerName,
          deliveryAddress: bookings.deliveryAddress,
          status: bookings.status,
          totalPrice: bookings.totalPrice,
        },
        customerAccount: {
          id: customerAccounts.id,
          companyName: customerAccounts.companyName,
        },
        fleetUnit: {
          id: fleetUnits.id,
          unitNumber: fleetUnits.unitNumber,
        }
      })
      .from(loadRecords)
      .leftJoin(bookings, eq(loadRecords.bookingId, bookings.id))
      .leftJoin(customerAccounts, eq(bookings.customerAccountId, customerAccounts.id))
      .leftJoin(fleetUnits, eq(bookings.assignedFleetUnitId, fleetUnits.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(loadRecords.createdAt));

    return NextResponse.json(allLoadRecords);
  } catch (error) {
    console.error('Error fetching load records:', error);
    return NextResponse.json(
      { message: 'Failed to fetch load records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();

    // Validate the load record data
    const validatedData = insertLoadRecordSchema.parse(body);

    // Create the load record
    const [loadRecord] = await db
      .insert(loadRecords)
      .values(validatedData)
      .returning();

    return NextResponse.json(loadRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating load record:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid load record data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create load record' },
      { status: 500 }
    );
  }
}