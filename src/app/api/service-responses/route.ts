import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceResponses, services, jobs, dumpsterPricing, fleetUnits, bookings } from '@shared/schema';
import { desc, eq, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch all service responses with service name
    const responses = await db
      .select({
        id: serviceResponses.id,
        serviceId: serviceResponses.serviceId,
        serviceName: services.name,
        customerName: serviceResponses.customerName,
        customerEmail: serviceResponses.customerEmail,
        customerPhone: serviceResponses.customerPhone,
        responses: serviceResponses.responses,
        calculatedPrice: serviceResponses.calculatedPrice,
        status: serviceResponses.status,
        adminNotes: serviceResponses.adminNotes,
        quotedPrice: serviceResponses.quotedPrice,
        quotedAt: serviceResponses.quotedAt,
        quotedBy: serviceResponses.quotedBy,
        createdAt: serviceResponses.createdAt,
        updatedAt: serviceResponses.updatedAt,
      })
      .from(serviceResponses)
      .leftJoin(services, eq(serviceResponses.serviceId, services.id))
      .orderBy(desc(serviceResponses.createdAt));

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching service responses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch service responses' },
      { status: 500 }
    );
  }
}

// Helper function to check dumpster availability for service jobs
async function checkServiceDumpsterAvailability(
  dumpsterId: number,
  serviceDate: string
): Promise<{ available: boolean; availableUnits: number }> {
  // Get total fleet units for this dumpster type
  const totalFleetUnits = await db
    .select()
    .from(fleetUnits)
    .where(eq(fleetUnits.dumpsterId, dumpsterId));

  const totalAvailable = totalFleetUnits.length;

  if (totalAvailable === 0) {
    return { available: false, availableUnits: 0 };
  }

  const targetDate = new Date(serviceDate);
  const startDate = new Date(targetDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  // Check existing service jobs for this date
  const existingJobs = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.dumpsterId, dumpsterId),
        eq(jobs.jobType, 'service'),
        or(
          eq(jobs.status, 'pending'),
          eq(jobs.status, 'scheduled'),
          eq(jobs.status, 'in_progress')
        )
      )
    );

  // Count jobs on the same date
  let unitsInUse = 0;
  for (const job of existingJobs) {
    const jobDate = new Date(job.scheduledDate);
    if (jobDate >= startDate && jobDate <= endDate) {
      unitsInUse++;
    }
  }

  // Also check bookings that overlap with this date
  const overlappingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.dumpsterId, dumpsterId),
        or(
          eq(bookings.status, 'pending'),
          eq(bookings.status, 'confirmed'),
          eq(bookings.status, 'delivered')
        )
      )
    );

  for (const booking of overlappingBookings) {
    const bookingStart = new Date(booking.deliveryDate);
    const [pricing] = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.id, booking.pricingId));

    if (pricing) {
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setDate(bookingEnd.getDate() + pricing.days);

      // Check if the service date falls within the booking period
      if (targetDate >= bookingStart && targetDate <= bookingEnd) {
        unitsInUse++;
      }
    }
  }

  const availableUnits = totalAvailable - unitsInUse;
  return { available: availableUnits > 0, availableUnits: Math.max(0, availableUnits) };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, formData, calculatedPrice } = body;

    // Validate required fields
    if (!serviceId || !formData) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch service to get form schema AND inventory settings
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, Number(serviceId)));

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    // Extract customer info based on field types in the form schema
    let customerName = 'Not provided';
    let customerEmail = 'Not provided';
    let customerPhone = 'Not provided';
    let selectedDumpsterId: number | null = null;
    let scheduledDate: string | null = null;
    let serviceAddress: string | null = null;
    let serviceCity: string | null = null;
    let serviceZipCode: string | null = null;

    if (service.formSchema?.fields) {
      (service.formSchema as any).fields.forEach((field: any) => {
        const value = formData[field.id];
        if (value) {
          if (field.type === 'name') {
            // Handle split name format (object with first, middle, last, prefix)
            if (typeof value === 'object' && (value.first || value.last)) {
              const parts = [];
              if (value.prefix) parts.push(value.prefix);
              if (value.first) parts.push(value.first);
              if (value.middle) parts.push(value.middle);
              if (value.last) parts.push(value.last);
              customerName = parts.join(' ');
            } else if (typeof value === 'string') {
              // Handle single field format
              customerName = value;
            }
          } else if (field.type === 'email') {
            customerEmail = value;
          } else if (field.type === 'phone') {
            customerPhone = value;
          } else if (field.type === 'dumpster_selector') {
            selectedDumpsterId = Number(value);
          } else if (field.type === 'date') {
            // Use the first date field as the scheduled date
            if (!scheduledDate) {
              scheduledDate = value;
            }
          } else if (field.type === 'address') {
            // Extract address components
            if (typeof value === 'object') {
              serviceAddress = value.street || null;
              serviceCity = value.city || null;
              serviceZipCode = value.zip || null;
            }
          }
        }
      });
    }

    // Fallback: Try to guess from common field names if no typed fields found
    if (customerName === 'Not provided') {
      customerName = formData.name || formData.customerName || formData.fullName || 'Not provided';
    }
    if (customerEmail === 'Not provided') {
      customerEmail = formData.email || formData.customerEmail || 'Not provided';
    }
    if (customerPhone === 'Not provided') {
      customerPhone = formData.phone || formData.customerPhone || formData.phoneNumber || 'Not provided';
    }

    // Handle inventory requirements
    let effectiveDumpsterId = selectedDumpsterId;

    if (service.requiresDumpster) {
      // If service requires a dumpster and uses fixed mode, use the default
      if (service.dumpsterAssignmentMode === 'fixed' && service.defaultDumpsterId) {
        effectiveDumpsterId = service.defaultDumpsterId;
      }

      // Validate that we have a dumpster ID
      if (!effectiveDumpsterId) {
        return NextResponse.json(
          { message: 'This service requires a dumpster selection' },
          { status: 400 }
        );
      }

      // Check availability if we have a scheduled date
      if (scheduledDate) {
        const availability = await checkServiceDumpsterAvailability(effectiveDumpsterId, scheduledDate);

        if (!availability.available) {
          return NextResponse.json({
            message: 'Sorry, the selected dumpster is not available for your chosen date. Please select a different date or dumpster size.',
            code: 'INVENTORY_UNAVAILABLE'
          }, { status: 409 });
        }
      }
    }

    // Create the service response
    const [response] = await db
      .insert(serviceResponses)
      .values({
        serviceId: Number(serviceId),
        customerName,
        customerEmail,
        customerPhone,
        responses: formData, // Store the entire form data
        calculatedPrice: calculatedPrice ? Math.round(calculatedPrice * 100) : null,
        status: 'pending',
        // New inventory fields
        selectedDumpsterId: effectiveDumpsterId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        serviceAddress,
        serviceCity,
        serviceZipCode,
      })
      .returning();

    console.log('Created service response:', response.id);

    // Always create a job for service requests so they appear in the unified jobs view
    // Use scheduled date if provided, otherwise use today's date
    const jobDate = scheduledDate ? new Date(scheduledDate) : new Date();
    jobDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    await db.insert(jobs).values({
      jobType: 'service',
      serviceResponseId: response.id,
      customerName,
      customerEmail,
      customerPhone,
      address: serviceAddress || 'Address not provided',
      city: serviceCity || 'City not provided',
      zipCode: serviceZipCode || '00000',
      scheduledDate: jobDate,
      timePreference: 'anytime',
      dumpsterId: effectiveDumpsterId, // Will be null if service doesn't require a dumpster
      status: 'pending',
      notes: `Service: ${service.name}`,
    });

    console.log('Created service job for response:', response.id);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating service response:', error);
    return NextResponse.json(
      { message: 'Failed to submit service request' },
      { status: 500 }
    );
  }
}
