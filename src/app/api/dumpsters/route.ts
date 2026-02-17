import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsters, fleetUnits } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const allDumpsters = await db
      .select()
      .from(dumpsters)
      .orderBy(dumpsters.sortOrder);

    return NextResponse.json(allDumpsters);
  } catch (error) {
    console.error('Error fetching dumpsters:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dumpsters' },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const availability = body.availability || 1;

    // Create the dumpster
    const [newDumpster] = await db
      .insert(dumpsters)
      .values(body)
      .returning();

    // Auto-generate fleet units based on availability count
    if (availability > 0) {
      const fleetUnitsToCreate = [];

      for (let i = 1; i <= availability; i++) {
        const unitNumber = await generateUnitNumber(newDumpster.id, i);
        fleetUnitsToCreate.push({
          unitNumber,
          dumpsterId: newDumpster.id,
          status: 'available',
          currentLocation: 'hub',
        });
      }

      // Bulk insert fleet units
      await db.insert(fleetUnits).values(fleetUnitsToCreate);

      console.log(`Created ${availability} fleet units for dumpster ${newDumpster.id}`);
    }

    return NextResponse.json(newDumpster, { status: 201 });
  } catch (error) {
    console.error('Error creating dumpster:', error);
    return NextResponse.json(
      { message: 'Failed to create dumpster' },
      { status: 500 }
    );
  }
}
