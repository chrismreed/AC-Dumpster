import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, type NotificationEventType, type NotificationContext } from '@/lib/notifications';
import { verifyAdminAuth } from '@/lib/admin-auth';

// POST: Send a test notification
export async function POST(request: NextRequest) {
  try {

    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { eventType, email, phone } = body as {
      eventType: NotificationEventType;
      email?: string;
      phone?: string;
    };

    if (!eventType) {
      return NextResponse.json(
        { message: 'eventType is required' },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { message: 'At least one of email or phone is required' },
        { status: 400 }
      );
    }

    // Build test context with dummy data
    const context: NotificationContext = {
      customerName: 'Test Customer',
      customerEmail: email,
      customerPhone: phone,
      bookingId: '12345',
      deliveryDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      dumpsterSize: '20 Yard',
      address: '123 Test Street, Effingham, IL 62401',
      totalPrice: '350.00',
      jobId: '1001',
      jobType: 'Delivery',
      scheduledDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      timePreference: 'Morning',
      swapRequestId: '501',
      requestType: 'Size Change',
      swapStatus: 'Approved',
      adminNotes: 'This is a test notification.',
    };

    await sendNotification(eventType, context);

    return NextResponse.json({
      message: `Test notification sent for event: ${eventType}`,
      sentTo: { email, phone },
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { message: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
