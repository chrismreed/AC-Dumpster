import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerAccounts, bookings, jobs, swapRequests, customerCredits, dumpsters, dumpsterPricing, serviceZones } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json({ message: 'Invalid customer ID' }, { status: 400 });
    }

    // Fetch the customer account
    const [account] = await db
      .select()
      .from(customerAccounts)
      .where(eq(customerAccounts.id, customerId));

    if (!account) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    // Fetch bookings by email match (catches both linked and unlinked bookings)
    let mergedBookings: any[] = [];
    try {
      mergedBookings = await db
        .select({
          id: bookings.id,
          customerName: bookings.customerName,
          customerEmail: bookings.customerEmail,
          customerPhone: bookings.customerPhone,
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
          createdAt: bookings.createdAt,
          dumpsterName: dumpsters.name,
          dumpsterDimensions: dumpsters.dimensions,
          serviceZoneName: serviceZones.name,
          rentalDays: dumpsterPricing.days,
        })
        .from(bookings)
        .leftJoin(dumpsters, eq(bookings.dumpsterId, dumpsters.id))
        .leftJoin(serviceZones, eq(bookings.serviceZoneId, serviceZones.id))
        .leftJoin(dumpsterPricing, eq(bookings.pricingId, dumpsterPricing.id))
        .where(eq(bookings.customerEmail, account.email))
        .orderBy(desc(bookings.createdAt));
    } catch (e) {
      console.error('Error fetching bookings:', e);
    }

    // Fetch all jobs for this customer (by email match)
    let customerJobs: any[] = [];
    try {
      customerJobs = await db
        .select({
          id: jobs.id,
          jobType: jobs.jobType,
          bookingId: jobs.bookingId,
          serviceResponseId: jobs.serviceResponseId,
          swapRequestId: jobs.swapRequestId,
          address: jobs.address,
          city: jobs.city,
          scheduledDate: jobs.scheduledDate,
          timePreference: jobs.timePreference,
          status: jobs.status,
          priority: jobs.priority,
          notes: jobs.notes,
          adminNotes: jobs.adminNotes,
          completedAt: jobs.completedAt,
          createdAt: jobs.createdAt,
          dumpsterName: dumpsters.name,
        })
        .from(jobs)
        .leftJoin(dumpsters, eq(jobs.dumpsterId, dumpsters.id))
        .where(eq(jobs.customerEmail, account.email))
        .orderBy(desc(jobs.scheduledDate));
    } catch (e) {
      console.error('Error fetching jobs:', e);
    }

    // Fetch swap requests linked to this customer's bookings
    const bookingIds = mergedBookings.map((b: any) => b.id);
    let customerSwapRequests: any[] = [];
    if (bookingIds.length > 0) {
      try {
        for (const bookingId of bookingIds) {
          const swaps = await db
            .select()
            .from(swapRequests)
            .where(eq(swapRequests.bookingId, bookingId))
            .orderBy(desc(swapRequests.createdAt));
          customerSwapRequests.push(...swaps);
        }
      } catch (e) {
        console.error('Error fetching swap requests:', e);
      }
    }

    // Fetch credits
    let credits: any[] = [];
    try {
      credits = await db
        .select()
        .from(customerCredits)
        .where(eq(customerCredits.customerAccountId, customerId))
        .orderBy(desc(customerCredits.createdAt));
    } catch (e) {
      console.error('Error fetching credits:', e);
    }

    // Calculate total spend
    const totalSpend = mergedBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

    // Format bookings to match frontend interface
    const formattedBookings = mergedBookings.map((b: any) => ({
      id: b.id,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      deliveryAddress: b.deliveryAddress,
      deliveryCity: b.deliveryCity,
      deliveryZipCode: b.deliveryZipCode,
      deliveryDate: b.deliveryDate,
      deliveryTimePreference: b.deliveryTimePreference,
      deliveryInstructions: b.deliveryInstructions,
      placementLocation: b.placementLocation,
      totalPrice: b.totalPrice,
      paymentStatus: b.paymentStatus,
      status: b.status,
      createdAt: b.createdAt,
      dumpster: b.dumpsterName ? { id: 0, name: b.dumpsterName, dimensions: b.dumpsterDimensions } : null,
      serviceZone: b.serviceZoneName ? { id: 0, name: b.serviceZoneName } : null,
      rentalDays: b.rentalDays,
    }));

    // Format jobs to match frontend interface
    const formattedJobs = customerJobs.map((j: any) => ({
      id: j.id,
      jobType: j.jobType,
      bookingId: j.bookingId,
      serviceResponseId: j.serviceResponseId,
      swapRequestId: j.swapRequestId,
      address: j.address,
      city: j.city,
      scheduledDate: j.scheduledDate,
      timePreference: j.timePreference,
      status: j.status,
      priority: j.priority,
      notes: j.notes,
      adminNotes: j.adminNotes,
      completedAt: j.completedAt,
      createdAt: j.createdAt,
      dumpster: j.dumpsterName ? { id: 0, name: j.dumpsterName } : null,
    }));

    return NextResponse.json({
      customer: account,
      bookings: formattedBookings,
      jobs: formattedJobs,
      swapRequests: customerSwapRequests,
      credits,
      stats: {
        totalBookings: formattedBookings.length,
        totalJobs: formattedJobs.length,
        totalSpend,
        activeBookings: formattedBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'pending' || b.status === 'active').length,
        completedBookings: formattedBookings.filter((b: any) => b.status === 'completed').length,
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch customer details', error: String(error) },
      { status: 500 }
    );
  }
}
