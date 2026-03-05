import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { customerAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip, 'customer');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the customer account by email (case-insensitive)
    const [account] = await db
      .select()
      .from(customerAccounts)
      .where(eq(customerAccounts.email, email.toLowerCase().trim()));

    if (!account) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account has been set up (has a password).
    // Use 401 (not 403) to avoid leaking that the email address exists in the DB.
    if (!account.passwordHash) {
      return NextResponse.json(
        {
          message: "Account not set up yet. Please check your email for the setup link.",
          code: "ACCOUNT_NOT_SETUP",
        },
        { status: 401 }
      );
    }

    // Check if email is verified.
    // Use 401 (not 403) for the same reason — consistent status prevents email enumeration.
    if (!account.emailVerified) {
      return NextResponse.json(
        {
          message: "Email not verified. Please check your email for the verification link.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 401 }
      );
    }

    // Verify the password using bcrypt
    const isValid = await bcrypt.compare(password, account.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Successful auth — reset the rate limit counter for this IP
    await resetRateLimit(ip, 'customer');

    // Update last login time
    await db
      .update(customerAccounts)
      .set({ lastLoginAt: new Date() })
      .where(eq(customerAccounts.id, account.id));

    // Issue a signed JWT session cookie (same pattern as admin auth)
    const jwtSecret = process.env.JWT_SECRET_CUSTOMER;
    if (!jwtSecret) {
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }
    const token = jwt.sign({ customerId: account.id }, jwtSecret, { expiresIn: '7d' });
    const cookieStore = await cookies();
    cookieStore.set('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      id: account.id,
      email: account.email,
      name: account.name,
      companyName: account.companyName,
      isBusinessAccount: account.isBusinessAccount,
    });
  } catch (err) {
    console.error("Error in customer login:", err);
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}
