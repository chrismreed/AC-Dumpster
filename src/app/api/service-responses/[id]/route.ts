import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceResponses } from '@shared/schema';
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
        { message: "Response ID is required" },
        { status: 400 }
      );
    }

    const [response] = await db
      .select()
      .from(serviceResponses)
      .where(eq(serviceResponses.id, id));

    if (!response) {
      return NextResponse.json(
        { message: "Response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching service response:', error);
    return NextResponse.json(
      { message: 'Failed to fetch service response' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Response ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, adminNotes, quotedPrice, quotedBy } = body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (quotedPrice !== undefined) {
      updateData.quotedPrice = quotedPrice;
      updateData.quotedAt = new Date();
    }
    if (quotedBy !== undefined) updateData.quotedBy = quotedBy;

    const [response] = await db
      .update(serviceResponses)
      .set(updateData)
      .where(eq(serviceResponses.id, id))
      .returning();

    if (!response) {
      return NextResponse.json(
        { message: "Response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating service response:', error);
    return NextResponse.json(
      { message: 'Failed to update service response' },
      { status: 500 }
    );
  }
}
