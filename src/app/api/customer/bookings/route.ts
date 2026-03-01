import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { bookings, dumpsters, dumpsterPricing, serviceZones } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch bookings by email (catches both linked and unlinked bookings)
    const customerBookings = await db
      .select({
        id: bookings.id,
        customerName: bookings.customerName,
        deliveryAddress: bookings.deliveryAddress,
        deliveryCity: bookings.deliveryCity,
        deliveryZipCode: bookings.deliveryZipCode,
        deliveryDate: bookings.deliveryDate,
        deliveryTimePreference: bookings.deliveryTimePreference,
        deliveryInstructions: bookings.deliveryInstructions,
        placementLocation: bookings.placementLocation,
        totalPrice: bookings.totalPrice,
        paymentStatus: bookings.paymentStatus,
        status: bookings.status,
        rentalDays: bookings.rentalDays,
        bookingPricingMode: bookings.bookingPricingMode,
        createdAt: bookings.createdAt,
        dumpsterName: dumpsters.name,
        dumpsterDimensions: dumpsters.dimensions,
        serviceZoneName: serviceZones.name,
        pricingDays: dumpsterPricing.days,
      })
      .from(bookings)
      .leftJoin(dumpsters, eq(bookings.dumpsterId, dumpsters.id))
      .leftJoin(serviceZones, eq(bookings.serviceZoneId, serviceZones.id))
      .leftJoin(dumpsterPricing, eq(bookings.pricingId, dumpsterPricing.id))
      .where(eq(bookings.customerEmail, session.email))
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json({ bookings: customerBookings });
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
