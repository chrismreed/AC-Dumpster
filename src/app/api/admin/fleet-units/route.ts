import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fleetUnits, insertFleetUnitSchema, dumpsters, hubs, bookings, jobs } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rows = await db
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
        dumpsterName: dumpsters.name,
        dumpsterDimensions: dumpsters.dimensions,
        hubName: hubs.name,
        hubAddress: hubs.address,
        hubCity: hubs.city,
        hubState: hubs.state,
        hubZipCode: hubs.zipCode,
        bookingAddress: bookings.deliveryAddress,
        bookingCity: bookings.deliveryCity,
        bookingZipCode: bookings.deliveryZipCode,
        bookingCustomerName: bookings.customerName,
      })
      .from(fleetUnits)
      .leftJoin(dumpsters, eq(fleetUnits.dumpsterId, dumpsters.id))
      .leftJoin(hubs, eq(fleetUnits.currentHubId, hubs.id))
      .leftJoin(bookings, eq(fleetUnits.currentBookingId, bookings.id))
      .orderBy(desc(fleetUnits.createdAt));

    const allFleetUnits = rows.map((r) => {
      let locationDisplay = '—';
      if (r.currentLocation === 'hub' && r.hubName) {
        locationDisplay = `${r.hubName} - ${r.hubAddress}, ${r.hubCity}, ${r.hubState} ${r.hubZipCode}`;
      } else if (r.currentLocation === 'customer_address' && r.bookingAddress) {
        locationDisplay = `${r.bookingCustomerName || 'Customer'} - ${r.bookingAddress}, ${r.bookingCity} ${r.bookingZipCode}`;
      } else if (r.currentLocation === 'in_transit') {
        locationDisplay = 'In Transit';
      }
      return {
        id: r.id,
        unitNumber: r.unitNumber,
        dumpsterId: r.dumpsterId,
        status: r.status,
        currentLocation: r.currentLocation,
        currentHubId: r.currentHubId,
        currentBookingId: r.currentBookingId,
        locationDisplay,
        needsCleaning: r.needsCleaning,
        needsMaintenance: r.needsMaintenance,
        lastMaintenanceDate: r.lastMaintenanceDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        dumpster: r.dumpsterName ? { name: r.dumpsterName, dimensions: r.dumpsterDimensions } : undefined,
      };
    });

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
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    const body = await request.json();

    // Validate the fleet unit data
    const validatedData = insertFleetUnitSchema.parse(body);

    const [fleetUnit] = await db
      .insert(fleetUnits)
      .values(validatedData)
      .returning();

    if (!fleetUnit) {
      return NextResponse.json({ message: "Failed to create fleet unit" }, { status: 500 });
    }

    // Sync: if created at customer location, assign to that booking and its jobs (unit is new, so no prior assignments)
    if (fleetUnit.currentBookingId) {
      await db.update(bookings).set({ assignedFleetUnitId: fleetUnit.id }).where(eq(bookings.id, fleetUnit.currentBookingId));
      await db.update(jobs).set({ assignedFleetUnitId: fleetUnit.id }).where(eq(jobs.bookingId, fleetUnit.currentBookingId));
    }

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