import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { customerAccounts } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';

// POST /api/customer/setup-account
// Validates token and sets the customer's password
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the account with this token that hasn't expired
    const [account] = await db
      .select()
      .from(customerAccounts)
      .where(
        and(
          eq(customerAccounts.verificationToken, token),
          gt(customerAccounts.tokenExpiresAt, new Date())
        )
      );

    if (!account) {
      return NextResponse.json(
        { message: "Invalid or expired setup link. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update the account: set password, verify email, clear token
    await db
      .update(customerAccounts)
      .set({
        passwordHash,
        emailVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(customerAccounts.id, account.id));

    return NextResponse.json({
      message: "Account set up successfully! You can now log in.",
      email: account.email,
    });
  } catch (error) {
    console.error('Error setting up account:', error);
    return NextResponse.json(
      { message: 'Failed to set up account' },
      { status: 500 }
    );
  }
}

// GET /api/customer/setup-account?token=xxx
// Validates the token and returns basic account info
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    // Find the account with this token that hasn't expired
    const [account] = await db
      .select({
        id: customerAccounts.id,
        email: customerAccounts.email,
        name: customerAccounts.name,
        emailVerified: customerAccounts.emailVerified,
      })
      .from(customerAccounts)
      .where(
        and(
          eq(customerAccounts.verificationToken, token),
          gt(customerAccounts.tokenExpiresAt, new Date())
        )
      );

    if (!account) {
      return NextResponse.json(
        { message: "Invalid or expired setup link. Please request a new one.", valid: false },
        { status: 400 }
      );
    }

    // If already verified, let them know
    if (account.emailVerified) {
      return NextResponse.json({
        valid: false,
        alreadyVerified: true,
        message: "This account has already been set up. You can log in.",
        email: account.email,
      });
    }

    return NextResponse.json({
      valid: true,
      email: account.email,
      name: account.name,
    });
  } catch (error) {
    console.error('Error validating setup token:', error);
    return NextResponse.json(
      { message: 'Failed to validate token' },
      { status: 500 }
    );
  }
}
