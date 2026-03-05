import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services } from '@shared/schema';
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
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: 'Service ID is required' },
        { status: 400 }
      );
    }

    const [service] = await db
      .select({
        id: services.id,
        name: services.name,
        formSchema: services.formSchema,
        pricingRules: services.pricingRules,
      })
      .from(services)
      .where(eq(services.id, id));

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service form schema:', error);
    return NextResponse.json(
      { message: 'Failed to fetch form schema' },
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
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { message: 'Service ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { formSchema, pricingRules } = body;

    // Validate that we have at least one of the fields
    if (!formSchema && !pricingRules) {
      return NextResponse.json(
        { message: 'Either formSchema or pricingRules is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (formSchema !== undefined) {
      updateData.formSchema = formSchema;
    }

    if (pricingRules !== undefined) {
      updateData.pricingRules = pricingRules;
    }

    // Update the service
    const [service] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service form schema:', error);
    return NextResponse.json(
      { message: 'Failed to update form schema' },
      { status: 500 }
    );
  }
}
