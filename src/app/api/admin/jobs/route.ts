import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, dumpsters, fleetUnits, bookings, serviceResponses, services, customerAccounts } from '@shared/schema';
import { eq, desc, and, or, gte, lte, sql } from 'drizzle-orm';
import { insertJobSchema } from '@shared/schema';

export const dynamic = 'force-dynamic';

// GET: List all jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobType = searchParams.get('jobType');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const dumpsterId = searchParams.get('dumpsterId');

    // Build where conditions
    const conditions = [];

    if (jobType) {
      conditions.push(eq(jobs.jobType, jobType));
    }

    if (status) {
      conditions.push(eq(jobs.status, status));
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      conditions.push(gte(jobs.scheduledDate, fromDate));
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(jobs.scheduledDate, toDate));
    }

    if (dumpsterId) {
      conditions.push(eq(jobs.dumpsterId, parseInt(dumpsterId)));
    }

    // Query with joins for related data
    const allJobs = await db
      .select({
        id: jobs.id,
        jobType: jobs.jobType,
        bookingId: jobs.bookingId,
        serviceResponseId: jobs.serviceResponseId,
        swapRequestId: jobs.swapRequestId,
        customerName: jobs.customerName,
        customerEmail: jobs.customerEmail,
        customerPhone: jobs.customerPhone,
        address: jobs.address,
        city: jobs.city,
        zipCode: jobs.zipCode,
        placementInstructions: jobs.placementInstructions,
        scheduledDate: jobs.scheduledDate,
        timePreference: jobs.timePreference,
        dumpsterId: jobs.dumpsterId,
        assignedFleetUnitId: jobs.assignedFleetUnitId,
        status: jobs.status,
        priority: jobs.priority,
        notes: jobs.notes,
        adminNotes: jobs.adminNotes,
        rentalEndDate: jobs.rentalEndDate,
        completedAt: jobs.completedAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        // Joined data
        dumpster: {
          id: dumpsters.id,
          name: dumpsters.name,
          dimensions: dumpsters.dimensions,
        },
        fleetUnit: {
          id: fleetUnits.id,
          unitNumber: fleetUnits.unitNumber,
          status: fleetUnits.status,
        },
        // Service name for service jobs
        serviceName: services.name,
        // Original delivery date from booking (may differ from scheduledDate if rescheduled)
        bookingDeliveryDate: bookings.deliveryDate,
        // Payment status from the linked booking
        paymentStatus: bookings.paymentStatus,
        // Customer account info (for repeat customer tracking)
        customerAccount: {
          id: customerAccounts.id,
          totalBookings: customerAccounts.totalBookings,
        },
      })
      .from(jobs)
      .leftJoin(dumpsters, eq(jobs.dumpsterId, dumpsters.id))
      .leftJoin(fleetUnits, eq(jobs.assignedFleetUnitId, fleetUnits.id))
      .leftJoin(serviceResponses, eq(jobs.serviceResponseId, serviceResponses.id))
      .leftJoin(services, eq(serviceResponses.serviceId, services.id))
      .leftJoin(bookings, eq(jobs.bookingId, bookings.id))
      .leftJoin(customerAccounts, eq(bookings.customerAccountId, customerAccounts.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobs.scheduledDate), desc(jobs.createdAt));

    return NextResponse.json(allJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST: Create a new job manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the input
    const validatedData = insertJobSchema.parse(body);

    // Create the job
    const [newJob] = await db
      .insert(jobs)
      .values(validatedData)
      .returning();

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Invalid job data', errors: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create job' },
      { status: 500 }
    );
  }
}
