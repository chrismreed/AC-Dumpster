import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, dumpsters, fleetUnits, bookings, serviceResponses, services } from '@shared/schema';
import { eq } from 'drizzle-orm';

// GET: Get a single job by ID with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { message: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Get job with related data
    const [job] = await db
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
          imageUrl: dumpsters.imageUrl,
        },
        fleetUnit: {
          id: fleetUnits.id,
          unitNumber: fleetUnits.unitNumber,
          status: fleetUnits.status,
        },
      })
      .from(jobs)
      .leftJoin(dumpsters, eq(jobs.dumpsterId, dumpsters.id))
      .leftJoin(fleetUnits, eq(jobs.assignedFleetUnitId, fleetUnits.id))
      .where(eq(jobs.id, jobId));

    if (!job) {
      return NextResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      );
    }

    // If this job is linked to a booking, fetch booking details
    let bookingDetails = null;
    if (job.bookingId) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, job.bookingId));
      bookingDetails = booking;
    }

    // If this job is linked to a service response, fetch service details
    let serviceResponseDetails = null;
    if (job.serviceResponseId) {
      const [response] = await db
        .select({
          id: serviceResponses.id,
          serviceId: serviceResponses.serviceId,
          responses: serviceResponses.responses,
          calculatedPrice: serviceResponses.calculatedPrice,
          status: serviceResponses.status,
          serviceName: services.name,
        })
        .from(serviceResponses)
        .leftJoin(services, eq(serviceResponses.serviceId, services.id))
        .where(eq(serviceResponses.id, job.serviceResponseId));
      serviceResponseDetails = response;
    }

    return NextResponse.json({
      ...job,
      booking: bookingDetails,
      serviceResponse: serviceResponseDetails,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { message: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PUT: Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { message: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    // Basic fields
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode;
    if (body.placementInstructions !== undefined) updateData.placementInstructions = body.placementInstructions;
    if (body.timePreference !== undefined) updateData.timePreference = body.timePreference;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
    if (body.status !== undefined) updateData.status = body.status;

    // Fleet assignment
    if (body.dumpsterId !== undefined) updateData.dumpsterId = body.dumpsterId;
    if (body.assignedFleetUnitId !== undefined) updateData.assignedFleetUnitId = body.assignedFleetUnitId;

    // Date fields - parse properly
    if (body.scheduledDate !== undefined) {
      const dateParts = body.scheduledDate.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        updateData.scheduledDate = new Date(year, month, day, 12, 0, 0, 0);
      }
    }

    if (body.rentalEndDate !== undefined) {
      if (body.rentalEndDate === null) {
        updateData.rentalEndDate = null;
      } else {
        const dateParts = body.rentalEndDate.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1;
          const day = parseInt(dateParts[2]);
          updateData.rentalEndDate = new Date(year, month, day, 12, 0, 0, 0);
        }
      }
    }

    // Completion tracking
    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    // When assigning a fleet unit, unassign it from all other jobs/bookings first (one dumpster = one job)
    if (body.assignedFleetUnitId) {
      await db.update(bookings).set({ assignedFleetUnitId: null }).where(eq(bookings.assignedFleetUnitId, body.assignedFleetUnitId));
      await db.update(jobs).set({ assignedFleetUnitId: null }).where(eq(jobs.assignedFleetUnitId, body.assignedFleetUnitId));
      // Sync fleet unit location to this job's booking
      const [job] = await db.select({ bookingId: jobs.bookingId }).from(jobs).where(eq(jobs.id, jobId));
      if (job?.bookingId) {
        await db.update(fleetUnits).set({ currentBookingId: job.bookingId }).where(eq(fleetUnits.id, body.assignedFleetUnitId));
      }
    }

    // Update the job
    const [updatedJob] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, jobId))
      .returning();

    if (!updatedJob) {
      return NextResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { message: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { message: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const [deletedJob] = await db
      .delete(jobs)
      .where(eq(jobs.id, jobId))
      .returning();

    if (!deletedJob) {
      return NextResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { message: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
