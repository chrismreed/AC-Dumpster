import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, customerAccounts } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    // Get all bookings
    const allBookings = await db
      .select({
        customerEmail: bookings.customerEmail,
        customerName: bookings.customerName,
      })
      .from(bookings)
      .orderBy(desc(bookings.createdAt));

    // Create a map to track unique customers and their booking counts
    const customerMap = new Map<string, { email: string; name: string; bookingCount: number }>();

    for (const booking of allBookings) {
      const email = booking.customerEmail.toLowerCase();
      if (customerMap.has(email)) {
        const existing = customerMap.get(email)!;
        existing.bookingCount++;
      } else {
        customerMap.set(email, {
          email: booking.customerEmail,
          name: booking.customerName,
          bookingCount: 1
        });
      }
    }

    // Get existing customer accounts to filter them out
    const accounts = await db
      .select({ email: customerAccounts.email })
      .from(customerAccounts);

    const accountEmails = new Set(accounts.map(a => a.email.toLowerCase()));

    // Filter out customers who already have accounts
    const availableCustomers = Array.from(customerMap.values())
      .filter(c => !accountEmails.has(c.email.toLowerCase()))
      .sort((a, b) => b.bookingCount - a.bookingCount);

    return NextResponse.json(availableCustomers);
  } catch (error) {
    console.error('Error fetching unique customers:', error);
    return NextResponse.json(
      { message: 'Failed to fetch unique customers' },
      { status: 500 }
    );
  }
}
