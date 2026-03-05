import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    // For now, require adminId in request body
    const { adminId, username, email } = await request.json();

    if (!adminId || !username || !email) {
      return NextResponse.json(
        { message: "Admin ID, username and email are required" },
        { status: 400 }
      );
    }

    // Get current admin user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(adminId)));

    if (!currentUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if username is taken by another user
    if (username !== currentUser.username) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { message: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    await db
      .update(users)
      .set({ username, email })
      .where(eq(users.id, currentUser.id));

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
