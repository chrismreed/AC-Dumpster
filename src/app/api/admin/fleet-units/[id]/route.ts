import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fleetUnits, insertFleetUnitSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware
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
    // TODO: Add admin authentication middleware
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Fleet unit ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate the update data (partial update)
    const validatedData = insertFleetUnitSchema.partial().parse(body);

    // Update the fleet unit
    const [updatedFleetUnit] = await db
      .update(fleetUnits)
      .set(validatedData)
      .where(eq(fleetUnits.id, id))
      .returning();

    if (!updatedFleetUnit) {
      return NextResponse.json(
        { message: "Fleet unit not found" },
        { status: 404 }
      );
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
    // TODO: Add admin authentication middleware
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