import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceZones, insertServiceZoneSchema } from '@shared/schema';
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
        { message: "Zone ID is required" },
        { status: 400 }
      );
    }

    const [zone] = await db
      .select()
      .from(serviceZones)
      .where(eq(serviceZones.id, id));

    if (!zone) {
      return NextResponse.json(
        { message: "Service zone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Error fetching service zone:', error);
    return NextResponse.json(
      { message: 'Failed to fetch service zone' },
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
        { message: "Zone ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate the update data (partial update)
    const validatedData = insertServiceZoneSchema.partial().parse(body);

    // Update the service zone
    const [updatedZone] = await db
      .update(serviceZones)
      .set(validatedData)
      .where(eq(serviceZones.id, id))
      .returning();

    if (!updatedZone) {
      return NextResponse.json(
        { message: "Service zone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedZone);
  } catch (error) {
    console.error('Error updating service zone:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid service zone data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to update service zone' },
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
        { message: "Zone ID is required" },
        { status: 400 }
      );
    }

    // Check if zone exists and delete it
    const [deletedZone] = await db
      .delete(serviceZones)
      .where(eq(serviceZones.id, id))
      .returning();

    if (!deletedZone) {
      return NextResponse.json(
        { message: "Service zone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Service zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting service zone:', error);
    return NextResponse.json(
      { message: 'Failed to delete service zone' },
      { status: 500 }
    );
  }
}