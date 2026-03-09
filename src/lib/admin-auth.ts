import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface AuthResult {
  authorized: boolean;
  error?: string;
  userId?: number;
  user?: any;
}

export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return { authorized: false, error: 'No authentication token found' };
    }

    const jwtSecret = process.env.JWT_SECRET_ADMIN;
    if (!jwtSecret) throw new Error('JWT_SECRET_ADMIN environment variable is not set');
    const decoded = jwt.verify(token, jwtSecret) as { userId: number };

    if (!decoded.userId) {
      return { authorized: false, error: 'Invalid token format' };
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));

    if (!user) {
      return { authorized: false, error: 'User not found' };
    }

    if (!user.isAdmin) {
      return { authorized: false, error: 'Insufficient permissions' };
    }

    return {
      authorized: true,
      userId: user.id,
      user
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authorized: false, error: 'Authentication failed' };
  }
}
