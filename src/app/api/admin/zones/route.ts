import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceZones, insertServiceZoneSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    const zones = await db
      .select()
      .from(serviceZones)
      .orderBy(desc(serviceZones.createdAt));

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching admin service zones:', error);
    return NextResponse.json(
      { message: 'Failed to fetch service zones' },
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

    // Validate the service zone data
    const validatedData = insertServiceZoneSchema.parse(body);

    // Create the service zone
    const [zone] = await db
      .insert(serviceZones)
      .values(validatedData)
      .returning();

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error('Error creating service zone:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid service zone data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create service zone' },
      { status: 500 }
    );
  }
}