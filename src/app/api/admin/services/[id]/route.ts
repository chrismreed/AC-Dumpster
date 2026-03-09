import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services, insertServiceSchema } from '@shared/schema';
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
        { message: "Service ID is required" },
        { status: 400 }
      );
    }

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));

    if (!service) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    console.log('📖 Raw service from DB:', {
      id: service.id,
      imageUrl: service.imageUrl,
      image_url: (service as any).image_url,
      showOnHomepage: service.showOnHomepage,
      show_on_homepage: (service as any).show_on_homepage,
    });

    // Transform to match UI expectations
    const response = {
      id: service.id,
      name: service.name,
      description: service.description,
      basePrice: service.basePrice ? service.basePrice / 100 : 0, // Convert from cents to dollars
      price: service.basePrice ? service.basePrice / 100 : 0,
      priceUnit: service.priceUnit,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      category: service.category,
      formSchema: service.formSchema,
      pricingRules: service.pricingRules,
      serviceType: service.serviceType,
      flatPrice: service.flatPrice,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      // Display settings - Drizzle should already map these correctly
      imageUrl: service.imageUrl,
      showOnHomepage: service.showOnHomepage,
      showOnServicesPage: service.showOnServicesPage,
      isFeatured: service.isFeatured,
      // Inventory settings
      requiresDumpster: service.requiresDumpster,
      dumpsterAssignmentMode: service.dumpsterAssignmentMode,
      allowedDumpsterIds: service.allowedDumpsterIds,
      defaultDumpsterId: service.defaultDumpsterId,
      dumpsterQuantity: service.dumpsterQuantity,
      showDumpsterPricing: service.showDumpsterPricing,
    };

    console.log('📖 Transformed response:', {
      id: response.id,
      name: response.name,
      imageUrl: response.imageUrl,
      showOnHomepage: response.showOnHomepage,
      showOnServicesPage: response.showOnServicesPage,
      isFeatured: response.isFeatured,
      category: response.category
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { message: 'Failed to fetch service' },
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
        { message: "Service ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📝 Update service request body:', JSON.stringify(body, null, 2));

    // Transform UI data to match schema
    const updateData: any = {
      updatedAt: new Date()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.priceUnit !== undefined) updateData.priceUnit = body.priceUnit;
    if (body.basePrice !== undefined) {
      updateData.basePrice = body.basePrice;
      updateData.flatPrice = body.basePrice;
    }
    if (body.price !== undefined) {
      const priceInCents = Math.round(body.price * 100);
      updateData.basePrice = priceInCents;
      updateData.flatPrice = priceInCents;
    }
    if (body.formSchema !== undefined) updateData.formSchema = body.formSchema;
    if (body.pricingRules !== undefined) updateData.pricingRules = body.pricingRules;

    // Display settings
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.showOnHomepage !== undefined) updateData.showOnHomepage = body.showOnHomepage;
    if (body.showOnServicesPage !== undefined) updateData.showOnServicesPage = body.showOnServicesPage;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;

    // Inventory settings
    if (body.requiresDumpster !== undefined) updateData.requiresDumpster = body.requiresDumpster;
    if (body.dumpsterAssignmentMode !== undefined) updateData.dumpsterAssignmentMode = body.dumpsterAssignmentMode;
    if (body.allowedDumpsterIds !== undefined) updateData.allowedDumpsterIds = body.allowedDumpsterIds;
    if (body.defaultDumpsterId !== undefined) updateData.defaultDumpsterId = body.defaultDumpsterId;
    if (body.dumpsterQuantity !== undefined) updateData.dumpsterQuantity = body.dumpsterQuantity;
    if (body.showDumpsterPricing !== undefined) updateData.showDumpsterPricing = body.showDumpsterPricing;

    console.log('💾 Updating service with data:', JSON.stringify(updateData, null, 2));

    // Update the service
    const [service] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();

    console.log('✅ Service updated:', service?.id, service?.name);

    if (!service) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    // Transform back for UI
    const response = {
      ...service,
      price: service.basePrice ? service.basePrice / 100 : 0
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating service:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid service data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { message: "Service ID is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(services)
      .where(eq(services.id, id));

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { message: 'Failed to delete service' },
      { status: 500 }
    );
  }
}