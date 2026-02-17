import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { customerAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function generateAccessCode(): Promise<string> {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Customer account ID is required" },
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

    // Generate new access code
    const newAccessCode = await generateAccessCode();

    // Update the account with new access code
    await db
      .update(customerAccounts)
      .set({ accessCode: newAccessCode })
      .where(eq(customerAccounts.id, id));

    return NextResponse.json({
      accessCode: newAccessCode,
      email: account.email,
      message: "Share this new access code with the customer. It cannot be retrieved later."
    });
  } catch (error) {
    console.error('Error regenerating access code:', error);
    return NextResponse.json(
      { message: 'Failed to regenerate access code' },
      { status: 500 }
    );
  }
}