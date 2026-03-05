import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fleetUnits, insertFleetUnitSchema, bookings, jobs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Fleet unit ID is required" },
        { status: 400 }
      );
    }

    const [fleetUnit] = await db
      .select()
      .from(fleetUnits)
      .where(eq(fleetUnits.id, id));

    if (!fleetUnit) {
      return NextResponse.json(
        { message: "Fleet unit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(fleetUnit);
  } catch (error) {
    console.error('Error fetching fleet unit:', error);
    return NextResponse.json(
      { message: 'Failed to fetch fleet unit' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id) {
      return NextResponse.json({ message: "Fleet unit ID is required" }, { status: 400 });
    }

    const [existing] = await db.select().from(fleetUnits).where(eq(fleetUnits.id, id));
    if (!existing) {
      return NextResponse.json({ message: "Fleet unit not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = insertFleetUnitSchema.partial().parse(body);
    const newBookingId = 'currentBookingId' in validatedData ? validatedData.currentBookingId ?? null : existing.currentBookingId;
    const oldBookingId = existing.currentBookingId;

    const [updatedFleetUnit] = await db
      .update(fleetUnits)
      .set(validatedData)
      .where(eq(fleetUnits.id, id))
      .returning();

    if (!updatedFleetUnit) {
      return NextResponse.json({ message: "Fleet unit not found" }, { status: 404 });
    }

    // Unassign this fleet unit from ALL other bookings/jobs first (one dumpster = one job/booking only)
    await db.update(bookings).set({ assignedFleetUnitId: null }).where(eq(bookings.assignedFleetUnitId, id));
    await db.update(jobs).set({ assignedFleetUnitId: null }).where(eq(jobs.assignedFleetUnitId, id));

    // Assign to new booking if moved to customer location
    if (newBookingId) {
      await db.update(bookings).set({ assignedFleetUnitId: id }).where(eq(bookings.id, newBookingId));
      await db.update(jobs).set({ assignedFleetUnitId: id }).where(eq(jobs.bookingId, newBookingId));
    }

    return NextResponse.json(updatedFleetUnit);
  } catch (error) {
    console.error('Error updating fleet unit:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid fleet unit data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to update fleet unit' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Fleet unit ID is required" },
        { status: 400 }
      );
    }

    // Check if fleet unit exists and delete it
    const [deletedFleetUnit] = await db
      .delete(fleetUnits)
      .where(eq(fleetUnits.id, id))
      .returning();

    if (!deletedFleetUnit) {
      return NextResponse.json(
        { message: "Fleet unit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Fleet unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting fleet unit:', error);
    return NextResponse.json(
      { message: 'Failed to delete fleet unit' },
      { status: 500 }
    );
  }
}