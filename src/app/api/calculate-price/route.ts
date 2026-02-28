import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dumpsters, dumpsterPricing, serviceZones, rentalDurations } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { calculatePerDayRental } from '@/lib/pricing/per-day-calculator';

export async function POST(request: NextRequest) {
  try {
    const {
      dumpsterId,
      rentalDurationId,
      pricingId,
      rentalDays: bodyRentalDays,
      deliveryZipCode,
      deliveryAddress,
      deliveryCity,
      selectedAddOns
    } = await request.json();

    if (!dumpsterId || !deliveryZipCode) {
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

    // Get service zone using ZIP code lookup
    let zone = null;

    if (deliveryZipCode) {
      const zones = await db
        .select()
        .from(serviceZones);

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

    const deliveryFee = zone.deliveryFee || 0;

    // Determine pricing based on mode
    let rentalPrice: number;
    let days: number;
    let pricingMode: 'tier' | 'per_day';

    if (bodyRentalDays && dumpster.pricingMode === 'per_day') {
      // Per-day mode: use shared calculator (handles both flat and declining rate)
      days = Number(bodyRentalDays);
      const perDayResult = calculatePerDayRental(
        {
          basePricePerDay: dumpster.basePricePerDay,
          dailyRate: dumpster.dailyRate,
          firstDayRate: dumpster.firstDayRate,
          rateDeclineType: dumpster.rateDeclineType,
          rateDeclineAmount: dumpster.rateDeclineAmount,
          minimumDailyRate: dumpster.minimumDailyRate,
        },
        days
      );
      rentalPrice = perDayResult.grandTotal;
      pricingMode = 'per_day';
    } else if (pricingId) {
      // Tier mode: get from dumpster pricing
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
      rentalPrice = selectedPricing.price;
      days = selectedPricing.days;
      pricingMode = 'tier';
    } else if (rentalDurationId) {
      // Legacy: get rental duration directly
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
      rentalPrice = rentalDuration.additionalPrice || 0;
      days = rentalDuration.days;
      pricingMode = 'tier';
    } else {
      return NextResponse.json(
        { message: "Either pricingId, rentalDurationId, or rentalDays is required" },
        { status: 400 }
      );
    }

    const subtotal = rentalPrice + deliveryFee;

    // Calculate add-on costs
    let addOnTotal = 0;
    let addOnsBreakdown: any[] = [];

    if (selectedAddOns && selectedAddOns.length > 0) {
      addOnTotal = selectedAddOns.reduce((total: number, addon: any) => total + (addon.price || 0), 0);
      addOnsBreakdown = selectedAddOns;
    }

    const total = subtotal + addOnTotal;

    // Build breakdown based on pricing mode
    const breakdown: any = {
      dumpster: {
        name: dumpster.name,
        days,
        price: rentalPrice / 100,
        pricingMode,
      },
      delivery: {
        zone: zone.name,
        fee: deliveryFee / 100
      },
      addOns: addOnsBreakdown
    };

    // Add per-day detail fields
    if (pricingMode === 'per_day') {
      const perDayDetail = calculatePerDayRental(
        {
          basePricePerDay: dumpster.basePricePerDay,
          dailyRate: dumpster.dailyRate,
          firstDayRate: dumpster.firstDayRate,
          rateDeclineType: dumpster.rateDeclineType,
          rateDeclineAmount: dumpster.rateDeclineAmount,
          minimumDailyRate: dumpster.minimumDailyRate,
        },
        days
      );
      breakdown.dumpster.baseFee = perDayDetail.deliveryFee / 100;
      breakdown.dumpster.rentalSubtotal = perDayDetail.rentalTotal / 100;
      breakdown.dumpster.isDeclineMode = perDayDetail.isDeclineMode;
      breakdown.dumpster.dailyBreakdown = perDayDetail.breakdown.map(r => ({
        day: r.day,
        rate: r.rate / 100,
      }));
      // Legacy field for flat mode compatibility
      if (!perDayDetail.isDeclineMode) {
        breakdown.dumpster.dailyRate = (dumpster.dailyRate || 0) / 100;
      }
    }

    return NextResponse.json({
      basePrice: rentalPrice / 100,
      deliveryFee: deliveryFee / 100,
      addOnTotal: addOnTotal / 100,
      subtotal: subtotal / 100,
      total: total / 100,
      currency: "USD",
      pricingMode,
      rentalDays: days,
      rentalPrice: rentalPrice / 100,
      breakdown
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json(
      { message: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
