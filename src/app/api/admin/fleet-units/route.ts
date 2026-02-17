import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fleetUnits, insertFleetUnitSchema, dumpsters, bookings } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const allFleetUnits = await db
      .select({
        id: fleetUnits.id,
        unitNumber: fleetUnits.unitNumber,
        dumpsterId: fleetUnits.dumpsterId,
        status: fleetUnits.status,
        currentLocation: fleetUnits.currentLocation,
        currentHubId: fleetUnits.currentHubId,
        currentBookingId: fleetUnits.currentBookingId,
        needsCleaning: fleetUnits.needsCleaning,
        needsMaintenance: fleetUnits.needsMaintenance,
        lastMaintenanceDate: fleetUnits.lastMaintenanceDate,
        createdAt: fleetUnits.createdAt,
        updatedAt: fleetUnits.updatedAt,
        // Join with dumpster type
        dumpsterName: dumpsters.name,
        dumpsterDimensions: dumpsters.dimensions,
      })
      .from(fleetUnits)
      .leftJoin(dumpsters, eq(fleetUnits.dumpsterId, dumpsters.id))
      .orderBy(desc(fleetUnits.createdAt));

    return NextResponse.json(allFleetUnits);
  } catch (error) {
    console.error('Error fetching fleet units:', error);
    return NextResponse.json(
      { message: 'Failed to fetch fleet units' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();

    // Validate the fleet unit data
    const validatedData = insertFleetUnitSchema.parse(body);

    // Create the fleet unit
    const [fleetUnit] = await db
      .insert(fleetUnits)
      .values(validatedData)
      .returning();

    return NextResponse.json(fleetUnit, { status: 201 });
  } catch (error) {
    console.error('Error creating fleet unit:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid fleet unit data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create fleet unit' },
      { status: 500 }
    );
  }
}