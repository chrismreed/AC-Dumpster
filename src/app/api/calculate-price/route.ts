import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsters, dumpsterPricing, serviceZones, rentalDurations } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const {
      dumpsterId,
      rentalDurationId,
      pricingId,
      deliveryZipCode,
      deliveryAddress,
      deliveryCity,
      selectedAddOns
    } = await request.json();

    if (!dumpsterId || (!rentalDurationId && !pricingId) || !deliveryZipCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get dumpster
    const [dumpster] = await db
      .select()
      .from(dumpsters)
      .where(eq(dumpsters.id, Number(dumpsterId)));

    if (!dumpster) {
      return NextResponse.json(
        { message: "Dumpster not found" },
        { status: 404 }
      );
    }

    let duration;
    if (pricingId) {
      // Get rental duration from dumpster pricing
      const pricingOptions = await db
        .select()
        .from(dumpsterPricing)
        .where(eq(dumpsterPricing.dumpsterId, Number(dumpsterId)));

      const selectedPricing = pricingOptions.find(p => p.id === Number(pricingId));
      if (!selectedPricing) {
        return NextResponse.json(
          { message: "Pricing option not found" },
          { status: 404 }
        );
      }
      // Create a duration object with the pricing data
      duration = {
        id: selectedPricing.id,
        days: selectedPricing.days,
        additionalPrice: selectedPricing.price
      };
    } else {
      // Get rental duration directly
      const [rentalDuration] = await db
        .select()
        .from(rentalDurations)
        .where(eq(rentalDurations.id, Number(rentalDurationId)));

      if (!rentalDuration) {
        return NextResponse.json(
          { message: "Rental duration not found" },
          { status: 404 }
        );
      }
      duration = rentalDuration;
    }

    // Get service zone using ZIP code lookup
    let zone = null;

    if (deliveryZipCode) {
      const zones = await db
        .select()
        .from(serviceZones);

      // Find zone by ZIP code - split comma-separated list and match exactly
      for (const checkZone of zones) {
        if (checkZone.zipCodes) {
          const zipCodeList = checkZone.zipCodes.split(',').map(zip => zip.trim());
          if (zipCodeList.includes(deliveryZipCode)) {
            zone = checkZone;
            break;
          }
        }
      }
    }

    if (!zone) {
      return NextResponse.json(
        { message: "Service not available in this location" },
        { status: 404 }
      );
    }

    // Calculate base price
    const basePrice = duration.additionalPrice || 0;
    const deliveryFee = zone.deliveryFee || 0;
    const subtotal = basePrice + deliveryFee;

    // Calculate add-on costs
    let addOnTotal = 0;
    let addOnsBreakdown = [];

    if (selectedAddOns && selectedAddOns.length > 0) {
      // In a full implementation, you'd look up add-on prices from database
      // For now, assume prices are passed in or use defaults
      addOnTotal = selectedAddOns.reduce((total: number, addon: any) => total + (addon.price || 0), 0);
      addOnsBreakdown = selectedAddOns;
    }

    const total = subtotal + addOnTotal;

    return NextResponse.json({
      basePrice: basePrice / 100, // Convert cents to dollars
      deliveryFee: deliveryFee / 100,
      addOnTotal: addOnTotal / 100,
      subtotal: subtotal / 100,
      total: total / 100,
      currency: "USD",
      breakdown: {
        dumpster: {
          name: dumpster.name,
          days: duration.days,
          price: basePrice / 100
        },
        delivery: {
          zone: zone.name,
          fee: deliveryFee / 100
        },
        addOns: addOnsBreakdown
      }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json(
      { message: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
