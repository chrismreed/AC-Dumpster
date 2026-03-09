import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsters, serviceZones, dumpsterPricing } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
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
        customerPhone: bookings.customerPhone,
        dumpsterId: bookings.dumpsterId,
        pricingId: bookings.pricingId,
        deliveryAddress: bookings.deliveryAddress,
        deliveryCity: bookings.deliveryCity,
        deliveryZipCode: bookings.deliveryZipCode,
        deliveryInstructions: bookings.deliveryInstructions,
        placementLocation: bookings.placementLocation,
        deliveryDate: bookings.deliveryDate,
        deliveryTimePreference: bookings.deliveryTimePreference,
        serviceZoneId: bookings.serviceZoneId,
        selectedAddOns: bookings.selectedAddOns,
        totalPrice: bookings.totalPrice,
        rentalDays: bookings.rentalDays,
        rentalPrice: bookings.rentalPrice,
        bookingPricingMode: bookings.bookingPricingMode,
        paymentStatus: bookings.paymentStatus,
        status: bookings.status,
        stripePaymentIntentId: bookings.stripePaymentIntentId,
        assignedFleetUnitId: bookings.assignedFleetUnitId,
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
          deliveryFee: serviceZones.deliveryFee,
        },
        pricing: {
          id: dumpsterPricing.id,
          days: dumpsterPricing.days,
          price: dumpsterPricing.price,
        }
      })
      .from(bookings)
      .leftJoin(dumpsters, eq(bookings.dumpsterId, dumpsters.id))
      .leftJoin(serviceZones, eq(bookings.serviceZoneId, serviceZones.id))
      .leftJoin(dumpsterPricing, eq(bookings.pricingId, dumpsterPricing.id))
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { message: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { message: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedBooking = await db
      .update(bookings)
      .set(body)
      .where(eq(bookings.id, bookingId))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedBooking[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { message: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const bookingId = parseInt(params.id);
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { message: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const [existing] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!existing) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    await db.delete(bookings).where(eq(bookings.id, bookingId));

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { message: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}