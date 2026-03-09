import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsterPricing, dumpsters, fleetUnits, jobs } from '@shared/schema';
import { eq, and, or, gt } from 'drizzle-orm';

// Pending bookings older than this are considered abandoned and don't block availability
const PENDING_EXPIRY_HOURS = 2;

export async function POST(request: NextRequest) {
  try {
    const { dumpsterId, deliveryDate, pricingId } = await request.json();

    if (!dumpsterId || !deliveryDate || !pricingId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get rental duration from pricing option
    const [pricing] = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.id, Number(pricingId)));

    if (!pricing) {
      return NextResponse.json(
        { message: "Pricing option not found" },
        { status: 404 }
      );
    }

    // Calculate rental period
    const startDate = new Date(deliveryDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pricing.days);

    // Pending bookings expire after PENDING_EXPIRY_HOURS — don't count abandoned ones
    const pendingCutoff = new Date(Date.now() - PENDING_EXPIRY_HOURS * 60 * 60 * 1000);

    // Get all active bookings for this dumpster that overlap with the requested period
    const overlappingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.dumpsterId, Number(dumpsterId)),
          or(
            // Confirmed/delivered always block
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'delivered'),
            // Pending only blocks if created recently (not abandoned)
            and(
              eq(bookings.status, 'pending'),
              gt(bookings.createdAt, pendingCutoff)
            )
          )
        )
      );

    // Get total fleet units for this dumpster type
    const totalFleetUnits = await db
      .select()
      .from(fleetUnits)
      .where(eq(fleetUnits.dumpsterId, Number(dumpsterId)));

    const totalAvailable = totalFleetUnits.length;

    if (totalAvailable === 0) {
      return NextResponse.json({
        available: false,
        message: "No fleet units available for this dumpster type"
      });
    }

    // Count how many dumpsters are in use during the requested period
    let unitsInUse = 0;

    // Check bookings
    for (const booking of overlappingBookings) {
      const bookingStart = new Date(booking.deliveryDate);
      const [bookingPricing] = await db
        .select()
        .from(dumpsterPricing)
        .where(eq(dumpsterPricing.id, booking.pricingId));

      if (bookingPricing) {
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setDate(bookingEnd.getDate() + bookingPricing.days);

        // Check if periods overlap
        if (startDate < bookingEnd && endDate > bookingStart) {
          unitsInUse++;
        }
      }
    }

    // Also check service jobs that reserve dumpsters
    const serviceJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.dumpsterId, Number(dumpsterId)),
          eq(jobs.jobType, 'service'),
          or(
            eq(jobs.status, 'pending'),
            eq(jobs.status, 'scheduled'),
            eq(jobs.status, 'in_progress')
          )
        )
      );

    // Service jobs typically use the dumpster for a single day
    for (const job of serviceJobs) {
      const jobDate = new Date(job.scheduledDate);
      jobDate.setHours(0, 0, 0, 0);
      const jobEndDate = new Date(jobDate);
      jobEndDate.setHours(23, 59, 59, 999);

      // Check if the job date falls within the requested rental period
      if (startDate <= jobEndDate && endDate >= jobDate) {
        unitsInUse++;
      }
    }

    // Check if we have available units
    const availableUnits = totalAvailable - unitsInUse;
    const isAvailable = availableUnits > 0;

    return NextResponse.json({
      available: isAvailable,
      availableUnits,
      totalUnits: totalAvailable,
      unitsInUse
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { message: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
