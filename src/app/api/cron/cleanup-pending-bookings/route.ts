import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, jobs } from '@shared/schema';
import { eq, and, lt, inArray } from 'drizzle-orm';

// Must be dynamic — reads request headers and the current time at runtime
export const dynamic = 'force-dynamic';

// Bookings that are still unpaid after this long are considered abandoned
const EXPIRY_HOURS = 2;

/**
 * Cleanup cron job: cancel bookings that were created but never paid.
 *
 * Vercel invokes this route hourly and sets:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Can also be triggered manually by calling GET /api/cron/cleanup-pending-bookings
 * with the same Authorization header (useful for testing or backfilling).
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel's scheduler (or an authorised manual call).
  // If CRON_SECRET is not set we skip the check — useful in local dev.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

    // Find all bookings that are still pending payment after the cutoff
    const abandonedBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.paymentStatus, 'pending'),
          eq(bookings.status, 'pending'),
          lt(bookings.createdAt, cutoff)
        )
      );

    if (abandonedBookings.length === 0) {
      console.log('Cleanup cron: no abandoned bookings found.');
      return NextResponse.json({ cancelled: 0 });
    }

    const ids = abandonedBookings.map((b) => b.id);

    // Cancel the bookings themselves
    await db
      .update(bookings)
      .set({ status: 'cancelled' })
      .where(inArray(bookings.id, ids));

    // Cancel any pending driver jobs that were pre-created for these bookings
    await db
      .update(jobs)
      .set({ status: 'cancelled' })
      .where(
        and(
          inArray(jobs.bookingId, ids),
          eq(jobs.status, 'pending')
        )
      );

    console.log(
      `Cleanup cron: cancelled ${ids.length} abandoned booking(s): [${ids.join(', ')}]`
    );

    return NextResponse.json({ cancelled: ids.length, bookingIds: ids });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json({ message: 'Cleanup failed' }, { status: 500 });
  }
}
