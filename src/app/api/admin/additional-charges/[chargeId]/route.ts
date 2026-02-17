import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { additionalCharges } from '@shared/schema';
import { eq } from 'drizzle-orm';

// DELETE /api/admin/additional-charges/[chargeId] - Delete an unpaid charge
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chargeId: string } }
) {
  try {
    const chargeId = parseInt(params.chargeId);
    if (isNaN(chargeId)) {
      return NextResponse.json({ message: 'Invalid charge ID' }, { status: 400 });
    }

    // Get the charge first to check if it's paid
    const [charge] = await db
      .select()
      .from(additionalCharges)
      .where(eq(additionalCharges.id, chargeId));

    if (!charge) {
      return NextResponse.json({ message: 'Charge not found' }, { status: 404 });
    }

    if (charge.isPaid) {
      return NextResponse.json(
        { message: 'Cannot delete a paid charge' },
        { status: 400 }
      );
    }

    await db.delete(additionalCharges).where(eq(additionalCharges.id, chargeId));

    return NextResponse.json({ message: 'Charge deleted successfully' });
  } catch (error) {
    console.error('Error deleting charge:', error);
    return NextResponse.json({ message: 'Failed to delete charge' }, { status: 500 });
  }
}
