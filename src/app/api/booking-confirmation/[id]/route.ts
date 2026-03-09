import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsters, serviceZones, dumpsterPricing } from '@shared/schema';
import { eq, and, ne } from 'drizzle-orm';

// Public endpoint — no admin auth required.
// Returns only customer-facing fields for the post-payment confirmation page.
// Restricted to non-cancelled bookings to avoid leaking data on invalid IDs.
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { message: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    const [booking] = await db
      .select({
        id: bookings.id,
        customerName: bookings.customerName,
        customerEmail: bookings.customerEmail,
        deliveryDate: bookings.deliveryDate,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        selectedAddOns: bookings.selectedAddOns,
        dumpster: {
          id: dumpsters.id,
          name: dumpsters.name,
        },
        serviceZone: {
          id: serviceZones.id,
          name: serviceZones.name,
          deliveryFee: serviceZones.deliveryFee,
        },
        pricing: {
          id: dumpsterPricing.id,
          days: dumpsterPricing.days,
          price: dumpsterPricing.price,
        },
      })
      .from(bookings)
      .leftJoin(dumpsters, eq(bookings.dumpsterId, dumpsters.id))
      .leftJoin(serviceZones, eq(bookings.serviceZoneId, serviceZones.id))
      .leftJoin(dumpsterPricing, eq(bookings.pricingId, dumpsterPricing.id))
      .where(
        and(
          eq(bookings.id, bookingId),
          ne(bookings.status, 'cancelled')
        )
      );

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking confirmation:', error);
    return NextResponse.json(
      { message: 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}
