import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip, 'admin');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) },
        }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find the admin user by username and ensure they are an admin
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.username, username),
        eq(users.isAdmin, true)
      ));

    if (!user) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Verify the password using bcrypt
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Successful auth — reset the rate limit counter for this IP
    await resetRateLimit(ip, 'admin');

    // Issue a signed JWT and set it as the admin_token cookie
    const jwtSecret = process.env.JWT_SECRET_ADMIN;
    if (!jwtSecret) {
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Return user info (excluding password)
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    console.error("Error in admin login:", err);
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}