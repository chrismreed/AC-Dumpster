import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsters, serviceZones } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const allBookings = await db
      .select({
        id: bookings.id,
        customerName: bookings.customerName,
        customerEmail: bookings.customerEmail,
        customerPhone: bookings.customerPhone,
        dumpsterId: bookings.dumpsterId,
        pricingId: bookings.pricingId,
        deliveryAddress: bookings.deliveryAddress,
        deliveryCity: bookings.deliveryCity,
        deliveryZipCode: bookings.deliveryZipCode,
        deliveryDate: bookings.deliveryDate,
        deliveryTimePreference: bookings.deliveryTimePreference,
        serviceZoneId: bookings.serviceZoneId,
        totalPrice: bookings.totalPrice,
        paymentStatus: bookings.paymentStatus,
        status: bookings.status,
        stripePaymentIntentId: bookings.stripePaymentIntentId,
        createdAt: bookings.createdAt,
        // Join with related tables
        dumpster: {
          id: dumpsters.id,
          name: dumpsters.name,
          dimensions: dumpsters.dimensions,
        },
        serviceZone: {
          id: serviceZones.id,
          name: serviceZones.name,
        }
      })
      .from(bookings)
      .leftJoin(dumpsters, eq(bookings.dumpsterId, dumpsters.id))
      .leftJoin(serviceZones, eq(bookings.serviceZoneId, serviceZones.id))
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json(allBookings);
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
