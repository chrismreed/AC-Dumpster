import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loadRecords, insertLoadRecordSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Load record ID is required" },
        { status: 400 }
      );
    }

    const [loadRecord] = await db
      .select()
      .from(loadRecords)
      .where(eq(loadRecords.id, id));

    if (!loadRecord) {
      return NextResponse.json(
        { message: "Load record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(loadRecord);
  } catch (error) {
    console.error('Error fetching load record:', error);
    return NextResponse.json(
      { message: 'Failed to fetch load record' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Load record ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate the update data (partial update)
    const validatedData = insertLoadRecordSchema.partial().parse(body);

    // Update the load record
    const [updatedLoadRecord] = await db
      .update(loadRecords)
      .set(validatedData)
      .where(eq(loadRecords.id, id))
      .returning();

    if (!updatedLoadRecord) {
      return NextResponse.json(
        { message: "Load record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLoadRecord);
  } catch (error) {
    console.error('Error updating load record:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid load record data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to update load record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Load record ID is required" },
        { status: 400 }
      );
    }

    // Check if load record exists and delete it
    const [deletedLoadRecord] = await db
      .delete(loadRecords)
      .where(eq(loadRecords.id, id))
      .returning();

    if (!deletedLoadRecord) {
      return NextResponse.json(
        { message: "Load record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Load record deleted successfully' });
  } catch (error) {
    console.error('Error deleting load record:', error);
    return NextResponse.json(
      { message: 'Failed to delete load record' },
      { status: 500 }
    );
  }
}