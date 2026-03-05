import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerAccounts, bookings, insertCustomerAccountSchema } from '@shared/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { sendAccountSetupEmail, generateVerificationToken, getTokenExpiryDate } from '@/lib/email';
import { verifyAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBookings = searchParams.get('includeBookings') === 'true';
    const customerId = searchParams.get('id');

    // If specific customer ID requested, fetch with booking history
    if (customerId) {
      const [account] = await db
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.id, parseInt(customerId)));

      if (!account) {
        return NextResponse.json(
          { message: 'Customer account not found' },
          { status: 404 }
        );
      }

      // Get all bookings for this customer
      const customerBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.customerAccountId, account.id))
        .orderBy(desc(bookings.createdAt));

      return NextResponse.json({
        ...account,
        bookings: customerBookings,
      });
    }

    // List all accounts - fetch all columns
    const accounts = await db
      .select()
      .from(customerAccounts)
      .orderBy(desc(customerAccounts.createdAt));

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching customer accounts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch customer accounts' },
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

    // Validate the customer account data
    const validatedData = insertCustomerAccountSchema.parse(body);

    // Generate verification token for the new account
    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = getTokenExpiryDate();

    // Create the customer account
    const [account] = await db
      .insert(customerAccounts)
      .values({
        ...validatedData,
        emailVerified: false,
        verificationToken,
        tokenExpiresAt,
      })
      .returning();

    // Send account setup email
    try {
      await sendAccountSetupEmail(
        account.email,
        account.name || 'Customer',
        verificationToken
      );
    } catch (emailError) {
      console.error('Failed to send setup email:', emailError);
    }

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating customer account:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid customer account data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create customer account' },
      { status: 500 }
    );
  }
}
