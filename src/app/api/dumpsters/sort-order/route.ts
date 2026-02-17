import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsters } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();
    const { dumpsterOrders } = body;

    if (!dumpsterOrders || !Array.isArray(dumpsterOrders)) {
      return NextResponse.json(
        { message: 'Invalid dumpster orders data' },
        { status: 400 }
      );
    }

    // Update sort order for each dumpster
    for (const { id, sortOrder } of dumpsterOrders) {
      await db
        .update(dumpsters)
        .set({ sortOrder })
        .where(eq(dumpsters.id, id));
    }

    return NextResponse.json({ message: 'Dumpster order updated successfully' });
  } catch (error) {
    console.error('Error updating dumpster order:', error);
    return NextResponse.json(
      { message: 'Failed to update dumpster order' },
      { status: 500 }
    );
  }
}
