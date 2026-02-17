import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services, insertServiceSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const allServices = await db
      .select()
      .from(services)
      .orderBy(desc(services.createdAt));

    // Transform to match UI expectations
    const transformed = allServices.map(s => ({
      ...s,
      price: s.basePrice ? s.basePrice / 100 : 0
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { message: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();

    // Transform UI data to match schema
    const priceInCents = body.price ? Math.round(body.price * 100) : null;
    const dataToInsert = {
      name: body.name,
      description: body.description,
      basePrice: priceInCents, // Nullable - only for fixed-price services
      priceUnit: body.priceUnit || (priceInCents ? 'per service' : 'quote required'),
      flatPrice: priceInCents, // For new form builder
      isActive: body.isActive ?? true,
      serviceType: body.serviceType || (priceInCents ? 'flat_rate' : 'custom_form'),
      sortOrder: 0
    };

    // Create the service
    const [service] = await db
      .insert(services)
      .values(dataToInsert)
      .returning();

    // Transform back for UI
    const response = {
      ...service,
      price: service.basePrice ? service.basePrice / 100 : 0
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid service data",
        errors: (error as any).issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create service' },
      { status: 500 }
    );
  }
}
