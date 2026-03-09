import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, authResult.userId!));

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
