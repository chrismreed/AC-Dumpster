import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const id = Number(params.id);
    const { accessCode } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Customer account ID is required" },
        { status: 400 }
      );
    }

    if (!accessCode) {
      return NextResponse.json(
        { message: "Access code is required to send credentials" },
        { status: 400 }
      );
    }

    // Get the customer account
    const [account] = await db
      .select()
      .from(customerAccounts)
      .where(eq(customerAccounts.id, id));

    if (!account) {
      return NextResponse.json(
        { message: "Customer account not found" },
        { status: 404 }
      );
    }

    // TODO: Implement email service for sending credentials
    // For now, just return success
    console.log(`Would send credentials email to ${account.email} with access code: ${accessCode}`);

    return NextResponse.json({
      message: "Credentials email sent successfully (placeholder implementation)"
    });
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return NextResponse.json(
      { message: 'Failed to send credentials email' },
      { status: 500 }
    );
  }
}