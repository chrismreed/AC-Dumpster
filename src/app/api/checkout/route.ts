import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsters, dumpsterPricing, jobs, customerAccounts } from '@shared/schema';
import { insertBookingSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendAccountSetupEmail, generateVerificationToken, getTokenExpiryDate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received booking request for dumpster:', body.dumpsterId);

    // Validate the booking data
    const validatedData = insertBookingSchema.parse(body);

    // Get dumpster and pricing details
    const [dumpster] = await db
      .select()
      .from(dumpsters)
      .where(eq(dumpsters.id, validatedData.dumpsterId));

    const [pricing] = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.id, validatedData.pricingId));

    if (!dumpster || !pricing) {
      return NextResponse.json(
        { message: 'Dumpster or pricing not found' },
        { status: 404 }
      );
    }

    // Create the booking first with pending payment status
    const [booking] = await db
      .insert(bookings)
      .values({
        ...validatedData,
        paymentStatus: 'pending',
        status: 'pending',
      })
      .returning();

    console.log('Booking created successfully:', booking.id);

    // Auto-create delivery and pickup jobs
    try {
      // Calculate pickup date (delivery date + rental days)
      const deliveryDate = new Date(booking.deliveryDate);
      const pickupDate = new Date(deliveryDate);
      if (pricing) {
        pickupDate.setDate(pickupDate.getDate() + pricing.days);
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

    return NextResponse.json(
      { message: 'Failed to create booking', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
