import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hubs, jobs } from '@shared/schema';
import { desc, and, isNotNull, notInArray, gte, or, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const DEFAULT_DAYS = 30;
const SEARCH_DAYS = 180;

/** Returns hubs and job/booking locations for the fleet location dropdown. Supports ?search= for finding jobs by customer/address. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase();
    const daysBack = search ? SEARCH_DAYS : DEFAULT_DAYS;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    const pattern = search ? `%${search}%` : '';
    const hubConditions = search
      ? [ilike(hubs.name, pattern), ilike(hubs.address, pattern), ilike(hubs.city, pattern), ilike(hubs.zipCode, pattern)]
      : [];

    const [allHubs, activeJobs] = await Promise.all([
      db.select({
        id: hubs.id,
        name: hubs.name,
        address: hubs.address,
        city: hubs.city,
        state: hubs.state,
        zipCode: hubs.zipCode,
      })
        .from(hubs)
        .where(hubConditions.length ? or(...hubConditions) : undefined)
        .orderBy(desc(hubs.createdAt)),

      db.select({
        id: jobs.id,
        bookingId: jobs.bookingId,
        address: jobs.address,
        city: jobs.city,
        zipCode: jobs.zipCode,
        customerName: jobs.customerName,
        scheduledDate: jobs.scheduledDate,
      })
        .from(jobs)
        .where(
          and(
            isNotNull(jobs.bookingId),
            notInArray(jobs.status, ['completed', 'cancelled']),
            gte(jobs.scheduledDate, cutoff),
            ...(search
              ? [or(
                  ilike(jobs.customerName, pattern),
                  ilike(jobs.address, pattern),
                  ilike(jobs.city, pattern),
                  ilike(jobs.zipCode, pattern)
                )]
              : [])
          )
        )
        .orderBy(desc(jobs.scheduledDate)),
    ]);

    const hubOptions = allHubs.map((h) => ({
      value: `hub:${h.id}`,
      label: `${h.name} - ${h.address}, ${h.city}, ${h.state} ${h.zipCode}`,
      type: 'hub' as const,
      hubId: h.id,
    }));

    const seenBookings = new Set<number>();
    const jobOptions = activeJobs
      .filter((j) => {
        if (!j.bookingId || seenBookings.has(j.bookingId)) return false;
        seenBookings.add(j.bookingId);
        return true;
      })
      .map((j) => ({
        value: `booking:${j.bookingId}`,
        label: `${j.customerName} - ${j.address}, ${j.city} ${j.zipCode}`,
        type: 'job' as const,
        bookingId: j.bookingId!,
      }));

    return NextResponse.json({
      hubs: hubOptions,
      jobLocations: jobOptions,
      inTransit: { value: 'in_transit', label: 'In Transit', type: 'in_transit' as const },
    });
  } catch (error) {
    console.error('Error fetching fleet location options:', error);
    return NextResponse.json(
      { message: 'Failed to fetch location options' },
      { status: 500 }
    );
  }
}
