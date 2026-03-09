import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, fleetUnits, bookings, dumpsters } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendNotification, type NotificationEventType } from '@/lib/notifications';
import { verifyAdminAuth } from '@/lib/admin-auth';

// Valid job statuses — expanded lifecycle
// Delivery: pending → scheduled → en_route → completed
// Pickup:   pending → scheduled → en_route → picked_up → dumping → completed
const validStatuses = ['pending', 'scheduled', 'en_route', 'picked_up', 'dumping', 'completed', 'cancelled'];

// PATCH: Update job status with side effects
export async function PATCH(
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
    const { status, returnDestination } = body;

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the current job to check for side effects
    const [currentJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId));

    if (!currentJob) {
      return NextResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    // If marking as completed, set completedAt
    if (status === 'completed' && !currentJob.completedAt) {
      updateData.completedAt = new Date();
    }

    // If marking as cancelled or reverting from completed, clear completedAt
    if (status === 'cancelled' || (status !== 'completed' && currentJob.status === 'completed')) {
      updateData.completedAt = null;
    }

    // Update the job
    const [updatedJob] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, jobId))
      .returning();

    // Handle side effects based on job type and status

    // Side effect: Update fleet unit status based on job status changes
    if (updatedJob.assignedFleetUnitId) {
      if (updatedJob.jobType === 'delivery' && status === 'completed') {
        // Delivery completed - unit is now at customer
        await db
          .update(fleetUnits)
          .set({
            status: 'at_customer',
            currentLocation: 'customer_address',
            currentBookingId: updatedJob.bookingId,
            updatedAt: new Date(),
          })
          .where(eq(fleetUnits.id, updatedJob.assignedFleetUnitId));
      } else if (updatedJob.jobType === 'pickup' && status === 'completed') {
        // Pickup completed - unit returned to destination
        // Check returnDestination to determine where unit goes
        if (returnDestination?.type === 'customer' && returnDestination?.bookingId) {
          // Transferring to another customer's booking
          await db
            .update(fleetUnits)
            .set({
              status: 'at_customer',
              currentLocation: 'customer_address',
              currentBookingId: returnDestination.bookingId,
              updatedAt: new Date(),
            })
            .where(eq(fleetUnits.id, updatedJob.assignedFleetUnitId));
        } else {
          // Default: returning to hub
          const hubId = returnDestination?.hubId || null;
          await db
            .update(fleetUnits)
            .set({
              status: 'needs_cleaning',
              currentLocation: 'hub',
              currentHubId: hubId,
              currentBookingId: null,
              updatedAt: new Date(),
            })
            .where(eq(fleetUnits.id, updatedJob.assignedFleetUnitId));
        }
      } else if (updatedJob.jobType === 'service' && status === 'completed') {
        // Service job completed - unit might need cleaning
        await db
          .update(fleetUnits)
          .set({
            status: 'needs_cleaning',
            currentLocation: 'hub',
            currentBookingId: null,
            updatedAt: new Date(),
          })
          .where(eq(fleetUnits.id, updatedJob.assignedFleetUnitId));
      } else if (status === 'en_route') {
        // Driver en route - unit is in transit
        await db
          .update(fleetUnits)
          .set({
            status: 'in_transit',
            currentLocation: 'in_transit',
            updatedAt: new Date(),
          })
          .where(eq(fleetUnits.id, updatedJob.assignedFleetUnitId));
      } else if (status === 'picked_up') {
        // Dumpster physically picked up from customer - in transit to dump
        await db
          .update(fleetUnits)
          .set({
            status: 'in_transit',
            currentLocation: 'in_transit',
            updatedAt: new Date(),
          })
          .where(eq(fleetUnits.id, updatedJob.assignedFleetUnitId));
      }
      // 'dumping' status - no fleet change (still in transit/at dump site)
    }

    // Side effect: Update booking status based on job state
    if (updatedJob.bookingId) {
      // Get all jobs for this booking to determine booking status
      const bookingJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.bookingId, updatedJob.bookingId));

      const deliveryJob = bookingJobs.find(j => j.jobType === 'delivery');
      const pickupJob = bookingJobs.find(j => j.jobType === 'pickup');

      let newBookingStatus = 'pending';

      if (deliveryJob?.status === 'completed' && pickupJob?.status === 'completed') {
        newBookingStatus = 'complete';
      } else if (pickupJob?.status === 'en_route' || pickupJob?.status === 'picked_up' || pickupJob?.status === 'dumping') {
        newBookingStatus = 'picked_up';
      } else if (deliveryJob?.status === 'completed') {
        newBookingStatus = 'delivered';
      } else if (deliveryJob?.status === 'en_route' || deliveryJob?.status === 'scheduled') {
        newBookingStatus = 'confirmed';
      } else if (deliveryJob?.status === 'cancelled' && pickupJob?.status === 'cancelled') {
        newBookingStatus = 'cancelled';
      }

      await db
        .update(bookings)
        .set({ status: newBookingStatus })
        .where(eq(bookings.id, updatedJob.bookingId));
    }

    // Send notifications based on status change
    try {
      const notificationMap: Record<string, NotificationEventType> = {
        scheduled: 'job_scheduled',
        en_route: 'driver_en_route',
        completed: 'job_completed',
      };

      const eventType = notificationMap[status];
      if (eventType && updatedJob.bookingId) {
        const [booking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, updatedJob.bookingId));

        if (booking) {
          let dumpsterName = '';
          try {
            const [dumpster] = await db
              .select()
              .from(dumpsters)
              .where(eq(dumpsters.id, booking.dumpsterId));
            dumpsterName = dumpster?.name || '';
          } catch {}

          const jobTypeLabel =
            updatedJob.jobType === 'delivery' ? 'Delivery' :
            updatedJob.jobType === 'pickup' ? 'Pickup' :
            updatedJob.jobType === 'service' ? 'Service' :
            updatedJob.jobType || 'Job';

          sendNotification(eventType, {
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            bookingId: String(updatedJob.bookingId),
            jobId: String(updatedJob.id),
            jobType: jobTypeLabel,
            scheduledDate: updatedJob.scheduledDate
              ? new Date(updatedJob.scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'TBD',
            address: `${booking.deliveryAddress}, ${booking.deliveryCity}`,
            dumpsterSize: dumpsterName,
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send job status notification:', notifError);
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { message: 'Failed to update job status' },
      { status: 500 }
    );
  }
}
