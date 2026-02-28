import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsterPricing, fleetUnits, jobs } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { dumpsterId, pricingId, startDate, endDate, rentalDays: bodyRentalDays } = await request.json();

    if (!dumpsterId || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Determine rental days: either passed directly (per_day mode) or from pricing tier
    let rentalDays: number;

    if (bodyRentalDays) {
      // Per-day mode: rentalDays passed directly
      rentalDays = Number(bodyRentalDays);
    } else if (pricingId) {
      // Tier mode: look up from pricing option
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
      rentalDays = pricing.days;
    } else {
      return NextResponse.json(
        { message: "Either pricingId or rentalDays is required" },
        { status: 400 }
      );
    }

    // Get total fleet units for this dumpster type
    const totalFleetUnits = await db
      .select()
      .from(fleetUnits)
      .where(eq(fleetUnits.dumpsterId, Number(dumpsterId)));

    const totalAvailable = totalFleetUnits.length;

    if (totalAvailable === 0) {
      return NextResponse.json({
        availability: {},
        message: "No fleet units available for this dumpster type"
      });
    }

    // Get all active bookings for this dumpster
    const overlappingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.dumpsterId, Number(dumpsterId)),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'delivered')
          )
        )
      );

    // Get service jobs that reserve dumpsters
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

    // Pre-fetch pricing info for bookings that don't have rentalDays stored
    const bookingPricingMap = new Map();
    for (const booking of overlappingBookings) {
      if (!booking.rentalDays && booking.pricingId && !bookingPricingMap.has(booking.pricingId)) {
        const [bookingPricing] = await db
          .select()
          .from(dumpsterPricing)
          .where(eq(dumpsterPricing.id, booking.pricingId));
        bookingPricingMap.set(booking.pricingId, bookingPricing);
      }
    }

    // Generate availability for each date in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const availability: Record<string, { available: boolean; unitsAvailable: number; totalUnits: number }> = {};

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const checkDate = new Date(date);
      const checkEndDate = new Date(checkDate);
      checkEndDate.setDate(checkEndDate.getDate() + rentalDays);

      let unitsInUse = 0;

      // Check bookings
      for (const booking of overlappingBookings) {
        const bookingStart = new Date(booking.deliveryDate);

        // Use stored rentalDays first, fall back to pricing tier lookup for legacy bookings
        let bookingDuration: number | null = booking.rentalDays;
        if (!bookingDuration && booking.pricingId) {
          const bookingPricing = bookingPricingMap.get(booking.pricingId);
          bookingDuration = bookingPricing?.days ?? null;
        }

        if (bookingDuration) {
          const bookingEnd = new Date(bookingStart);
          bookingEnd.setDate(bookingEnd.getDate() + bookingDuration);

          // Check if periods overlap
          if (checkDate < bookingEnd && checkEndDate > bookingStart) {
            unitsInUse++;
          }
        }
      }

      // Check service jobs
      for (const job of serviceJobs) {
        const jobDate = new Date(job.scheduledDate);
        jobDate.setHours(0, 0, 0, 0);
        const jobEndDate = new Date(jobDate);
        jobEndDate.setHours(23, 59, 59, 999);

        if (checkDate <= jobEndDate && checkEndDate >= jobDate) {
          unitsInUse++;
        }
      }

      const unitsAvailable = totalAvailable - unitsInUse;
      const dateKey = checkDate.toISOString().split('T')[0];

      availability[dateKey] = {
        available: unitsAvailable > 0,
        unitsAvailable,
        totalUnits: totalAvailable
      };
    }

    return NextResponse.json({
      availability,
      rentalDays,
      totalUnits: totalAvailable
    });
  } catch (error) {
    console.error('Error checking date range availability:', error);
    return NextResponse.json(
      { message: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
