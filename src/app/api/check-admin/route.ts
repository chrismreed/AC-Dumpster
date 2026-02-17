import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allUsers = await db.select().from(users);
    const adminUsers = await db.select().from(users).where(eq(users.isAdmin, true));

    return NextResponse.json({
      allUsers: allUsers.length,
      adminUsers: adminUsers.length,
      adminUsersList: adminUsers.map(u => ({ id: u.id, username: u.username, email: u.email }))
    });
  } catch (error) {
    console.error('Error checking admin users:', error);
    return NextResponse.json(
      { message: 'Failed to check admin users' },
      { status: 500 }
    );
  }
}