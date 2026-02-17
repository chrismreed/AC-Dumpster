import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsters, insertDumpsterSchema, dumpsterPricing } from '@shared/schema';
import { eq, desc, min } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    // Get dumpsters with their pricing data
    const dumpstersWithPricing = await db
      .select({
        id: dumpsters.id,
        name: dumpsters.name,
        dimensions: dumpsters.dimensions,
        description: dumpsters.description,
        weightLimit: dumpsters.weightLimit,
        availability: dumpsters.availability,
        imageUrl: dumpsters.imageUrl,
        sortOrder: dumpsters.sortOrder,
        createdAt: dumpsters.createdAt,
        basePrice: min(dumpsterPricing.price),
      })
      .from(dumpsters)
      .leftJoin(dumpsterPricing, eq(dumpsters.id, dumpsterPricing.dumpsterId))
      .groupBy(
        dumpsters.id,
        dumpsters.name,
        dumpsters.dimensions,
        dumpsters.description,
        dumpsters.weightLimit,
        dumpsters.availability,
        dumpsters.imageUrl,
        dumpsters.sortOrder,
        dumpsters.createdAt
      )
      .orderBy(dumpsters.sortOrder);

    // Format the data for the frontend
    const formattedDumpsters = dumpstersWithPricing.map(dumpster => ({
      id: dumpster.id,
      name: dumpster.name,
      description: dumpster.description,
      dimensions: dumpster.dimensions,
      capacity: Math.floor(dumpster.weightLimit / 2000), // Rough estimate: ~2000 lbs per yard
      basePrice: dumpster.basePrice ? dumpster.basePrice / 100 : 0, // Convert cents to dollars, default to 0
      sortOrder: dumpster.sortOrder,
      isActive: dumpster.availability > 0,
      createdAt: dumpster.createdAt,
    }));

    return NextResponse.json(formattedDumpsters);
  } catch (error) {
    console.error('Error fetching admin dumpsters:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dumpsters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();

    // Validate the dumpster data
    const validatedData = insertDumpsterSchema.parse(body);

    // Create the dumpster
    const [dumpster] = await db
      .insert(dumpsters)
      .values(validatedData)
      .returning();

    return NextResponse.json(dumpster, { status: 201 });
  } catch (error) {
    console.error('Error creating dumpster:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid dumpster data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create dumpster' },
      { status: 500 }
    );
  }
}
