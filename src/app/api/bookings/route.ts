import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, dumpsterPricing, fleetUnits, jobs, customerAccounts, businessSettings } from '@shared/schema';
import { insertBookingSchema } from '@shared/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';

// Generate a random 6-digit access code
function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Find or create a customer account by email
async function findOrCreateCustomerAccount(
  email: string,
  name: string,
  phone: string
): Promise<number> {
  // Normalize email (lowercase, trim)
  const normalizedEmail = email.toLowerCase().trim();

  // Check if customer account already exists by email
  const existingAccount = await db
    .select()
    .from(customerAccounts)
    .where(eq(customerAccounts.email, normalizedEmail))
    .limit(1);

  if (existingAccount.length > 0) {
    // Customer exists - update their info and increment booking count
    const account = existingAccount[0];

    await db
      .update(customerAccounts)
      .set({
        name: name, // Update to latest name
        phone: phone, // Update to latest phone
        totalBookings: sql`COALESCE(${customerAccounts.totalBookings}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(eq(customerAccounts.id, account.id));

    console.log(`Found existing customer account #${account.id} for ${normalizedEmail}`);
    return account.id;
  }

  // Create new customer account
  const [newAccount] = await db
    .insert(customerAccounts)
    .values({
      email: normalizedEmail,
      name: name,
      phone: phone,
      accessCode: generateAccessCode(),
      totalBookings: 1,
    })
    .returning();

  console.log(`Created new customer account #${newAccount.id} for ${normalizedEmail}`);
  return newAccount.id;
}

export async function GET(request: NextRequest) {
  try {
    const allBookings = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json(allBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

async function checkDumpsterAvailability(dumpsterId: number, deliveryDate: string, pricingId: number): Promise<boolean> {
  // Get rental duration from pricing option
  const [pricing] = await db
    .select()
    .from(dumpsterPricing)
    .where(eq(dumpsterPricing.id, pricingId));

  if (!pricing) return false;

  // Get total fleet units for this dumpster type
  const totalFleetUnits = await db
    .select()
    .from(fleetUnits)
    .where(eq(fleetUnits.dumpsterId, dumpsterId));

  const totalAvailable = totalFleetUnits.length;

  if (totalAvailable === 0) {
    console.log(`No fleet units available for dumpster ${dumpsterId}`);
    return false;
  }

  // Calculate rental period
  const startDate = new Date(deliveryDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + pricing.days);

  // Get all active bookings for this dumpster that overlap with the requested period
  const overlappingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.dumpsterId, dumpsterId),
        or(
          eq(bookings.status, 'pending'),
          eq(bookings.status, 'confirmed'),
          eq(bookings.status, 'delivered')
        )
      )
    );

  // Count overlapping bookings
  let unitsInUse = 0;
  for (const booking of overlappingBookings) {
    const bookingStart = new Date(booking.deliveryDate);
    const [bookingPricing] = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.id, booking.pricingId));

    if (bookingPricing) {
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setDate(bookingEnd.getDate() + bookingPricing.days);

      // Check if periods overlap
      if (startDate < bookingEnd && endDate > bookingStart) {
        unitsInUse++;
      }
    }
  }

  const availableUnits = totalAvailable - unitsInUse;
  console.log(`Dumpster ${dumpsterId}: ${availableUnits} units available (${totalAvailable} total - ${unitsInUse} in use)`);

  return availableUnits > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the booking data
    const validatedData = insertBookingSchema.parse(body);

    // Check inventory availability before creating booking
    const isAvailable = await checkDumpsterAvailability(
      validatedData.dumpsterId,
      validatedData.deliveryDate.toISOString().split('T')[0],
      validatedData.pricingId
    );

    if (!isAvailable) {
      return NextResponse.json({
        message: "Sorry, this dumpster size is not available for your selected date. Please choose a different date or dumpster size.",
        code: "INVENTORY_UNAVAILABLE"
      }, { status: 409 });
    }

    // Find or create customer account
    const customerAccountId = await findOrCreateCustomerAccount(
      validatedData.customerEmail,
      validatedData.customerName,
      validatedData.customerPhone
    );

    // Check auto-confirmation setting
    const [autoConfirmSetting] = await db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.key, 'booking_auto_confirmation'));
    const autoConfirm = autoConfirmSetting?.value === 'true';
    const initialBookingStatus = autoConfirm ? 'confirmed' : 'pending';
    const initialJobStatus = autoConfirm ? 'scheduled' : 'pending';

    // Create the booking with customer account link
    const [booking] = await db
      .insert(bookings)
      .values({
        ...validatedData,
        customerAccountId,
        status: initialBookingStatus,
      })
      .returning();

    // Get rental duration to calculate pickup date
    const [pricing] = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.id, validatedData.pricingId));

    // Calculate pickup date (delivery date + rental days)
    const deliveryDate = new Date(validatedData.deliveryDate);
    const pickupDate = new Date(deliveryDate);
    if (pricing) {
      pickupDate.setDate(pickupDate.getDate() + pricing.days);
    }

    // Auto-create delivery job
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
      status: initialJobStatus,
      notes: `Delivery for booking #${booking.id}`,
    });

    // Auto-create pickup job (scheduled for end of rental)
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
      status: initialJobStatus,
      rentalEndDate: pickupDate,
      notes: `Pickup for booking #${booking.id}`,
    });

    // TODO: Send confirmation email (implement email service)

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid booking data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
