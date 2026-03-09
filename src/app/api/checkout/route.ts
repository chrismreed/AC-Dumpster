import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsters, dumpsterPricing, jobs, customerAccounts, addOns as addOnsTable } from '@shared/schema';
import { insertBookingSchema } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { sendAccountSetupEmail, generateVerificationToken, getTokenExpiryDate } from '@/lib/email';
import { calculatePerDayRental } from '@/lib/pricing/per-day-calculator';

// All price-related fields are computed server-side and must not come from the client.
// paymentStatus / status / stripePaymentIntentId are also server-controlled.
const bookingInputSchema = insertBookingSchema.omit({
  totalPrice: true,
  rentalPrice: true,
  bookingPricingMode: true,
  paymentStatus: true,
  status: true,
  stripePaymentIntentId: true,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received booking request for dumpster:', body.dumpsterId);

    // Validate the booking data — price fields are stripped and computed below
    const validatedData = bookingInputSchema.parse(body);

    // Get dumpster details
    const [dumpster] = await db
      .select()
      .from(dumpsters)
      .where(eq(dumpsters.id, validatedData.dumpsterId));

    if (!dumpster) {
      return NextResponse.json(
        { message: 'Dumpster not found' },
        { status: 404 }
      );
    }

    // Get pricing details (nullable for per_day mode)
    let pricing = null;
    if (validatedData.pricingId) {
      const [p] = await db
        .select()
        .from(dumpsterPricing)
        .where(eq(dumpsterPricing.id, validatedData.pricingId));

      if (!p) {
        return NextResponse.json(
          { message: 'Pricing option not found' },
          { status: 404 }
        );
      }
      // Ensure the pricing tier actually belongs to the requested dumpster
      if (p.dumpsterId !== validatedData.dumpsterId) {
        return NextResponse.json(
          { message: 'Pricing option does not match the selected dumpster' },
          { status: 400 }
        );
      }
      pricing = p;
    }

    // --- Compute all prices server-side (never trust client-supplied values) ---

    // 1. Base rental price
    let rentalPrice: number;
    let rentalDays: number;
    let bookingPricingMode: string;

    if (pricing) {
      // Tier mode: price is the fixed amount stored in the DB for this tier
      rentalPrice = pricing.price;
      rentalDays = pricing.days;
      bookingPricingMode = 'tier';
    } else {
      // Per-day mode: client supplies the number of days; price is derived from dumpster config
      const clientRentalDays = validatedData.rentalDays;
      if (!clientRentalDays || clientRentalDays < 1) {
        return NextResponse.json(
          { message: 'rentalDays is required for per-day pricing' },
          { status: 400 }
        );
      }
      if (dumpster.minDays && clientRentalDays < dumpster.minDays) {
        return NextResponse.json(
          { message: `Minimum rental period is ${dumpster.minDays} days` },
          { status: 400 }
        );
      }
      if (dumpster.maxDays && clientRentalDays > dumpster.maxDays) {
        return NextResponse.json(
          { message: `Maximum rental period is ${dumpster.maxDays} days` },
          { status: 400 }
        );
      }
      const perDayResult = calculatePerDayRental(dumpster, clientRentalDays);
      rentalPrice = perDayResult.grandTotal;
      rentalDays = clientRentalDays;
      bookingPricingMode = 'per_day';
    }

    // 2. Add-ons: re-fetch from DB so we use the canonical price, not the client-submitted one
    let addOnTotal = 0;
    let verifiedAddOns: (typeof addOnsTable.$inferSelect)[] = [];
    const submittedAddOns = validatedData.selectedAddOns as Array<{ id: number } | number> | null;

    if (submittedAddOns && submittedAddOns.length > 0) {
      const addOnIds = submittedAddOns
        .map((a) => (typeof a === 'object' && a !== null ? (a as { id: number }).id : a))
        .filter((id): id is number => typeof id === 'number');

      if (addOnIds.length > 0) {
        const dbAddOns = await db
          .select()
          .from(addOnsTable)
          .where(inArray(addOnsTable.id, addOnIds));
        verifiedAddOns = dbAddOns.filter((a) => a.isActive);
        addOnTotal = verifiedAddOns.reduce((sum, a) => sum + a.price, 0);
      }
    }

    // 3. Final total = rental + verified add-ons (all values in cents)
    const totalPrice = rentalPrice + addOnTotal;

    // Create the booking with server-computed prices
    const [booking] = await db
      .insert(bookings)
      .values({
        ...validatedData,
        // Server-computed — these override any client-supplied values
        totalPrice,
        rentalPrice,
        rentalDays,
        bookingPricingMode,
        selectedAddOns: verifiedAddOns.length > 0 ? verifiedAddOns : [],
        paymentStatus: 'pending',
        status: 'pending',
      })
      .returning();

    console.log('Booking created successfully:', booking.id);

    // Auto-create delivery and pickup jobs
    try {
      // Calculate pickup date (delivery date + rental days)
      // Use stored rentalDays from booking, fall back to pricing tier
      const deliveryDate = new Date(booking.deliveryDate);
      const pickupDate = new Date(deliveryDate);
      const bookingRentalDays = booking.rentalDays || (pricing ? pricing.days : 0);
      if (bookingRentalDays > 0) {
        pickupDate.setDate(pickupDate.getDate() + bookingRentalDays);
      }

      // Create delivery job
      await db.insert(jobs).values({
        jobType: 'delivery',
        bookingId: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        address: booking.deliveryAddress,
        city: booking.deliveryCity,
        zipCode: booking.deliveryZipCode,
        placementInstructions: booking.deliveryInstructions || booking.placementLocation,
        scheduledDate: deliveryDate,
        timePreference: booking.deliveryTimePreference,
        dumpsterId: booking.dumpsterId,
        status: 'pending',
        notes: `Delivery for booking #${booking.id}`,
      });

      // Create pickup job (scheduled for end of rental)
      await db.insert(jobs).values({
        jobType: 'pickup',
        bookingId: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        address: booking.deliveryAddress,
        city: booking.deliveryCity,
        zipCode: booking.deliveryZipCode,
        placementInstructions: booking.placementLocation,
        scheduledDate: pickupDate,
        timePreference: 'anytime',
        dumpsterId: booking.dumpsterId,
        status: 'pending',
        rentalEndDate: pickupDate,
        notes: `Pickup for booking #${booking.id}`,
      });

      console.log(`Auto-created delivery and pickup jobs for booking #${booking.id}`);
    } catch (jobError) {
      // Don't fail the booking if job creation fails
      console.error('Error creating jobs for booking:', jobError);
    }

    // Auto-create or link customer account
    try {
      const customerEmail = validatedData.customerEmail.toLowerCase().trim();

      // Check if customer account already exists
      const [existingAccount] = await db
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.email, customerEmail));

      if (existingAccount) {
        // Increment total bookings for existing customer
        await db
          .update(customerAccounts)
          .set({
            totalBookings: (existingAccount.totalBookings || 0) + 1,
            // Update name/phone if they provided new ones
            name: validatedData.customerName || existingAccount.name,
            phone: validatedData.customerPhone || existingAccount.phone,
            updatedAt: new Date(),
          })
          .where(eq(customerAccounts.id, existingAccount.id));

        console.log(`Linked booking to existing customer account: ${existingAccount.id}`);

        // If account isn't set up yet, resend setup email
        if (!existingAccount.emailVerified && !existingAccount.passwordHash) {
          const verificationToken = generateVerificationToken();
          const tokenExpiresAt = getTokenExpiryDate();

          await db
            .update(customerAccounts)
            .set({ verificationToken, tokenExpiresAt })
            .where(eq(customerAccounts.id, existingAccount.id));

          await sendAccountSetupEmail(
            customerEmail,
            validatedData.customerName || existingAccount.name || 'Customer',
            verificationToken
          );
        }
      } else {
        // Create new customer account
        const verificationToken = generateVerificationToken();
        const tokenExpiresAt = getTokenExpiryDate();

        const [newAccount] = await db
          .insert(customerAccounts)
          .values({
            email: customerEmail,
            name: validatedData.customerName,
            phone: validatedData.customerPhone || null,
            passwordHash: null, // Will be set when customer completes setup
            emailVerified: false,
            verificationToken,
            tokenExpiresAt,
            totalBookings: 1,
          })
          .returning();

        console.log(`Created new customer account: ${newAccount.id}`);

        // Send account setup email
        await sendAccountSetupEmail(
          customerEmail,
          validatedData.customerName || 'Customer',
          verificationToken
        );
      }
    } catch (accountError) {
      // Don't fail the booking if account creation fails
      console.error('Error creating/linking customer account:', accountError);
    }

    return NextResponse.json({
      bookingId: booking.id,
      message: 'Booking created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error - log detailed errors
      const zodError = error as any;
      console.error('Validation errors:', JSON.stringify(zodError.issues, null, 2));
      return NextResponse.json({
        message: 'Invalid booking data',
        errors: zodError.issues,
        details: zodError.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      }, { status: 400 });
    }

    // Do not expose internal error details (DB table/column names etc.) to the client
    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
