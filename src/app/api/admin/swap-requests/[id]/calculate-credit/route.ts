import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { swapRequests, bookings, dumpsterPricing } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: "Swap request ID is required" },
        { status: 400 }
      );
    }

    // Get the swap request
    const [swapRequest] = await db
      .select()
      .from(swapRequests)
      .where(eq(swapRequests.id, id));

    if (!swapRequest) {
      return NextResponse.json(
        { message: "Swap request not found" },
        { status: 404 }
      );
    }

    if (swapRequest.requestType !== "early_complete") {
      return NextResponse.json(
        { message: "Credit calculation only applies to early completion requests" },
        { status: 400 }
      );
    }

    // Get the associated booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, swapRequest.bookingId));

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // Calculate unused days
    const deliveryDate = new Date(booking.deliveryDate);

    // Use stored rentalDays, fall back to pricing tier lookup for legacy bookings
    let rentalDays = booking.rentalDays;
    if (!rentalDays && booking.pricingId) {
      const [pricing] = await db
        .select()
        .from(dumpsterPricing)
        .where(eq(dumpsterPricing.id, booking.pricingId));
      rentalDays = pricing?.days ?? null;
    }

    if (!rentalDays || rentalDays <= 0 || !booking.totalPrice || booking.totalPrice <= 0) {
      // Return with zero values - this is a valid scenario, not an error
      return NextResponse.json({
        message: "Cannot calculate credit: booking is missing rental days or total price data",
        unusedDays: 0,
        dailyRate: 0,
        suggestedCredit: 0
      });
    }

    const expectedEndDate = new Date(deliveryDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + rentalDays);

    // Use requested date or today as completion date
    const completionDate = swapRequest.requestedDate ? new Date(swapRequest.requestedDate) : new Date();

    // Calculate unused days
    const msPerDay = 24 * 60 * 60 * 1000;
    const unusedDays = Math.max(0, Math.floor((expectedEndDate.getTime() - completionDate.getTime()) / msPerDay));

    // Calculate daily rate from total price
    const dailyRate = Math.round(booking.totalPrice / rentalDays);
    const suggestedCredit = unusedDays * dailyRate;

    return NextResponse.json({
      unusedDays,
      dailyRate,
      suggestedCredit,
      deliveryDate: booking.deliveryDate,
      expectedEndDate: expectedEndDate.toISOString(),
      completionDate: completionDate.toISOString(),
      rentalDays,
      totalPrice: booking.totalPrice,
    });
  } catch (error) {
    console.error('Error calculating credit:', error);
    return NextResponse.json(
      { message: 'Failed to calculate credit' },
      { status: 500 }
    );
  }
}