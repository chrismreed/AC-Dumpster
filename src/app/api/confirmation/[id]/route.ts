import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceResponses, services } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'service';

    if (!id) {
      return NextResponse.json(
        { message: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Fetch the service response
    const [response] = await db
      .select({
        id: serviceResponses.id,
        serviceId: serviceResponses.serviceId,
        customerName: serviceResponses.customerName,
        customerEmail: serviceResponses.customerEmail,
        customerPhone: serviceResponses.customerPhone,
        responses: serviceResponses.responses,
        calculatedPrice: serviceResponses.calculatedPrice,
        createdAt: serviceResponses.createdAt,
        status: serviceResponses.status,
      })
      .from(serviceResponses)
      .where(eq(serviceResponses.id, id));

    if (!response) {
      return NextResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      );
    }

    // Fetch the service details
    const [service] = await db
      .select({
        name: services.name,
        formSchema: services.formSchema,
      })
      .from(services)
      .where(eq(services.id, response.serviceId));

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    // Check if the form had a payment field
    const hasPayment = service.formSchema?.fields?.some(
      (field: any) => field.type === 'payment'
    ) || false;

    // Determine payment status (you'd get this from Stripe or payment processor)
    // For now, we'll assume if there's a payment field and a price, it's paid
    const paymentStatus = hasPayment && response.calculatedPrice ? 'paid' : 'pending';

    const confirmationData = {
      id: response.id,
      serviceName: service.name,
      customerName: response.customerName,
      customerEmail: response.customerEmail,
      customerPhone: response.customerPhone,
      calculatedPrice: response.calculatedPrice || 0,
      responses: response.responses,
      createdAt: response.createdAt,
      hasPayment,
      paymentStatus,
    };

    return NextResponse.json(confirmationData);
  } catch (error) {
    console.error('Error fetching confirmation:', error);
    return NextResponse.json(
      { message: 'Failed to fetch confirmation details' },
      { status: 500 }
    );
  }
}
