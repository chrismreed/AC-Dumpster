import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page'); // 'homepage' or 'services'

    let query = db
      .select()
      .from(services)
      .where(eq(services.isActive, true));

    // Filter based on display settings
    if (page === 'homepage') {
      query = query.where(eq(services.showOnHomepage, true));
    } else if (page === 'services') {
      query = query.where(eq(services.showOnServicesPage, true));
    }

    // Order by sortOrder (drag & drop order from admin)
    const allServices = await query.orderBy(asc(services.sortOrder));

    // Transform prices from cents to dollars
    const transformed = allServices.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl,
      basePrice: s.basePrice ? s.basePrice / 100 : null,
      priceUnit: s.priceUnit,
      serviceType: s.serviceType,
      isFeatured: s.isFeatured,
      category: s.category,
      formSchema: s.formSchema,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching public services:', error);
    return NextResponse.json(
      { message: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
