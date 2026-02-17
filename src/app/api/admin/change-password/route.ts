import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    // For now, require adminId in request body
    const { adminId, currentPassword, newPassword } = await request.json();

    if (!adminId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Admin ID, current password, and new password are required" },
        { status: 400 }
      );
    }

    // Basic password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get current admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(adminId)));

    if (!adminUser) {
      return NextResponse.json(
        { message: "Admin user not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, adminUser.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, adminUser.id));

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error('Error changing admin password:', error);
    return NextResponse.json(
      { message: 'Failed to change password' },
      { status: 500 }
    );
  }
}
