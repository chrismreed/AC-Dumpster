import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsters, fleetUnits } from '@shared/schema';
import { eq, sql, count } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid dumpster ID' },
        { status: 400 }
      );
    }

    const [dumpster] = await db
      .select()
      .from(dumpsters)
      .where(eq(dumpsters.id, id));

    if (!dumpster) {
      return NextResponse.json(
        { message: 'Dumpster not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dumpster);
  } catch (error) {
    console.error('Error fetching dumpster:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dumpster' },
      { status: 500 }
    );
  }
}

async function generateUnitNumber(dumpsterId: number, sequence: number): Promise<string> {
  // Get dumpster info to create a prefix
  const [dumpster] = await db
    .select()
    .from(dumpsters)
    .where(eq(dumpsters.id, dumpsterId))
    .limit(1);

  if (!dumpster) return `UNIT-${sequence}`;

  // Extract size from name (e.g., "15 Yard" -> "15Y")
  const sizeMatch = dumpster.name.match(/(\d+)\s*[Yy]ard/);
  const prefix = sizeMatch ? `${sizeMatch[1]}Y` : 'UNIT';

  // Format: "15Y-001", "15Y-002", etc.
  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid dumpster ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Get current dumpster to check if availability changed
    const [currentDumpster] = await db
      .select()
      .from(dumpsters)
      .where(eq(dumpsters.id, id));

    if (!currentDumpster) {
      return NextResponse.json(
        { message: 'Dumpster not found' },
        { status: 404 }
      );
    }

    // Update the dumpster
    const [updatedDumpster] = await db
      .update(dumpsters)
      .set(body)
      .where(eq(dumpsters.id, id))
      .returning();

    // Sync fleet units if availability changed
    if (body.availability !== undefined && body.availability !== currentDumpster.availability) {
      const newAvailability = body.availability;

      // Count existing fleet units for this dumpster
      const existingUnits = await db
        .select()
        .from(fleetUnits)
        .where(eq(fleetUnits.dumpsterId, id));

      const currentCount = existingUnits.length;

      if (newAvailability > currentCount) {
        // Add more fleet units
        const unitsToAdd = newAvailability - currentCount;
        const fleetUnitsToCreate = [];

        for (let i = 1; i <= unitsToAdd; i++) {
          const sequence = currentCount + i;
          const unitNumber = await generateUnitNumber(id, sequence);
          fleetUnitsToCreate.push({
            unitNumber,
            dumpsterId: id,
            status: 'available',
            currentLocation: 'hub',
          });
        }

        await db.insert(fleetUnits).values(fleetUnitsToCreate);
        console.log(`Added ${unitsToAdd} fleet units for dumpster ${id}`);

      } else if (newAvailability < currentCount) {
        // Remove excess fleet units (only available ones, starting from the end)
        const unitsToRemove = currentCount - newAvailability;
        const availableUnits = existingUnits
          .filter(unit => unit.status === 'available')
          .sort((a, b) => b.id - a.id); // Sort by ID descending (newest first)

        if (availableUnits.length < unitsToRemove) {
          return NextResponse.json(
            {
              message: `Cannot reduce availability to ${newAvailability}. Only ${availableUnits.length} units are available (not in use). Current total: ${currentCount}`,
              code: 'UNITS_IN_USE'
            },
            { status: 409 }
          );
        }

        // Delete the excess available units
        for (let i = 0; i < unitsToRemove; i++) {
          await db
            .delete(fleetUnits)
            .where(eq(fleetUnits.id, availableUnits[i].id));
        }

        console.log(`Removed ${unitsToRemove} fleet units for dumpster ${id}`);
      }
    }

    return NextResponse.json(updatedDumpster);
  } catch (error) {
    console.error('Error updating dumpster:', error);
    return NextResponse.json(
      { message: 'Failed to update dumpster' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid dumpster ID' },
        { status: 400 }
      );
    }

    const deletedDumpster = await db
      .delete(dumpsters)
      .where(eq(dumpsters.id, id))
      .returning();

    if (deletedDumpster.length === 0) {
      return NextResponse.json(
        { message: 'Dumpster not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Dumpster deleted successfully' });
  } catch (error) {
    console.error('Error deleting dumpster:', error);
    return NextResponse.json(
      { message: 'Failed to delete dumpster' },
      { status: 500 }
    );
  }
}