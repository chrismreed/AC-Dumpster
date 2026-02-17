import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsters, insertDumpsterSchema } from '@shared/schema';
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
        { message: "Dumpster ID is required" },
        { status: 400 }
      );
    }

    const [dumpster] = await db
      .select()
      .from(dumpsters)
      .where(eq(dumpsters.id, id));

    if (!dumpster) {
      return NextResponse.json(
        { message: "Dumpster not found" },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Dumpster ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Transform frontend fields to database fields
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    // Transform frontend-specific fields to database fields
    if (body.capacity !== undefined) {
      updateData.weightLimit = body.capacity * 2000; // Convert capacity back to weight limit
    }
    if (body.isActive !== undefined) {
      updateData.availability = body.isActive ? 1 : 0; // Convert boolean to number
    }

    // Note: basePrice is stored in dumpsterPricing table, not dumpsters table
    // We only update the dumpsters table fields here

    // Validate the dumpster data
    const validatedData = insertDumpsterSchema.partial().parse(updateData);

    // Update the dumpster
    const [dumpster] = await db
      .update(dumpsters)
      .set(validatedData)
      .where(eq(dumpsters.id, id))
      .returning();

    if (!dumpster) {
      return NextResponse.json(
        { message: "Dumpster not found" },
        { status: 404 }
      );
    }

    // Transform the response to match the format expected by the frontend
    const formattedDumpster = {
      id: dumpster.id,
      name: dumpster.name,
      description: dumpster.description,
      dimensions: dumpster.dimensions,
      capacity: Math.floor(dumpster.weightLimit / 2000),
      basePrice: body.basePrice || 0, // Preserve the basePrice from request since it's not in dumpsters table
      sortOrder: dumpster.sortOrder,
      isActive: dumpster.availability > 0,
      createdAt: dumpster.createdAt,
    };

    return NextResponse.json(formattedDumpster);
  } catch (error) {
    console.error('Error updating dumpster:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid dumpster data",
        errors: error.issues
      }, { status: 400 });
    }

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
    // TODO: Add admin authentication middleware
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Dumpster ID is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(dumpsters)
      .where(eq(dumpsters.id, id));

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Dumpster not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Dumpster deleted successfully" });
  } catch (error) {
    console.error('Error deleting dumpster:', error);
    return NextResponse.json(
      { message: 'Failed to delete dumpster' },
      { status: 500 }
    );
  }
}
