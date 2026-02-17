import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addOns } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addOnId = parseInt(id);

    if (isNaN(addOnId)) {
      return NextResponse.json(
        { message: 'Invalid add-on ID' },
        { status: 400 }
      );
    }

    const [addOn] = await db
      .select()
      .from(addOns)
      .where(eq(addOns.id, addOnId));

    if (!addOn) {
      return NextResponse.json(
        { message: 'Add-on not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(addOn);
  } catch (error) {
    console.error('Error fetching add-on:', error);
    return NextResponse.json(
      { message: 'Failed to fetch add-on' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addOnId = parseInt(id);

    if (isNaN(addOnId)) {
      return NextResponse.json(
        { message: 'Invalid add-on ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Convert price from dollars to cents for storage
    const updateData: any = {
      name: body.name,
      description: body.description,
      price: Math.round(body.price * 100), // Convert dollars to cents
      isActive: body.isActive,
    };

    // Only include optional fields if they exist
    if (body.category !== undefined) {
      updateData.category = body.category;
    }
    if (body.isRequired !== undefined) {
      updateData.isRequired = body.isRequired;
    }

    const [updatedAddOn] = await db
      .update(addOns)
      .set(updateData)
      .where(eq(addOns.id, addOnId))
      .returning();

    if (!updatedAddOn) {
      return NextResponse.json(
        { message: 'Add-on not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAddOn);
  } catch (error) {
    console.error('Error updating add-on:', error);
    return NextResponse.json(
      { message: 'Failed to update add-on' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addOnId = parseInt(id);

    if (isNaN(addOnId)) {
      return NextResponse.json(
        { message: 'Invalid add-on ID' },
        { status: 400 }
      );
    }

    const [deletedAddOn] = await db
      .delete(addOns)
      .where(eq(addOns.id, addOnId))
      .returning();

    if (!deletedAddOn) {
      return NextResponse.json(
        { message: 'Add-on not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Add-on deleted successfully' });
  } catch (error) {
    console.error('Error deleting add-on:', error);
    return NextResponse.json(
      { message: 'Failed to delete add-on' },
      { status: 500 }
    );
  }
}
