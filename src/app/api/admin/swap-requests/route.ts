import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { swapRequests, bookings, customerAccounts } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const requests = await db
      .select({
        id: swapRequests.id,
        bookingId: swapRequests.bookingId,
        customerAccountId: swapRequests.customerAccountId,
        requestType: swapRequests.requestType,
        status: swapRequests.status,
        requestedDate: swapRequests.requestedDate,
        notes: swapRequests.notes,
        adminNotes: swapRequests.adminNotes,
        scheduledDate: swapRequests.scheduledDate,
        completedAt: swapRequests.completedAt,
        feeAmount: swapRequests.feeAmount,
        paymentStatus: swapRequests.paymentStatus,
        createdAt: swapRequests.createdAt,
        // Join with related data
        booking: {
          id: bookings.id,
          customerName: bookings.customerName,
          deliveryDate: bookings.deliveryDate,
        },
        customerAccount: {
          id: customerAccounts.id,
          email: customerAccounts.email,
          companyName: customerAccounts.companyName,
        }
      })
      .from(swapRequests)
      .leftJoin(bookings, eq(swapRequests.bookingId, bookings.id))
      .leftJoin(customerAccounts, eq(swapRequests.customerAccountId, customerAccounts.id))
      .orderBy(desc(swapRequests.createdAt));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching swap requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch swap requests' },
      { status: 500 }
    );
  }
}
