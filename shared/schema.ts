import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dumpster types/sizes available
export const dumpsters = pgTable("dumpsters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dimensions: text("dimensions").notNull(),
  description: text("description").notNull(),
  weightLimit: integer("weight_limit").notNull(), // In pounds
  availability: integer("availability").notNull(), // Number of units available
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Service Add-ons
export const addOns = pgTable("add_ons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  isActive: boolean("is_active").notNull().default(true),
  cutoffTime: text("cutoff_time"), // Format: "HH:MM" for same-day delivery cutoff
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Additional Services with flexible pricing
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pricingType: text("pricing_type").notNull(), // "flat" or "variable"
  flatPrice: integer("flat_price"), // In cents for flat pricing
  variableConfig: jsonb("variable_config"), // JSON config for variable pricing
  isActive: boolean("is_active").notNull().default(true),
  category: text("category"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Hub Locations (dumpster storage locations)
export const hubs = pgTable("hubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isMainHub: boolean("is_main_hub").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Service Zones (for location-based pricing)
export const serviceZones = pgTable("service_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  zipCodes: text("zip_codes").notNull(), // Comma-separated list of zip codes
  deliveryFee: integer("delivery_fee").notNull(), // In cents
  useGeofencing: boolean("use_geofencing").default(false),
  centerLat: doublePrecision("center_lat"), // Center latitude for geofencing
  centerLng: doublePrecision("center_lng"), // Center longitude for geofencing
  radiusMeters: integer("radius_meters"), // Radius in meters for circular geofencing
  polygonPath: text("polygon_path"), // JSON string containing polygon vertices for custom geofencing
  feeMultiplier: doublePrecision("fee_multiplier").default(1.0), // Multiplier for the base fee
  maxDrivingMinutes: integer("max_driving_minutes"), // Maximum driving time in minutes
  sameDayDeliveryEnabled: boolean("same_day_delivery_enabled").default(false),
  sameDayDeliveryFee: integer("same_day_delivery_fee").default(0), // In cents
  sameDayCutoffTime: text("same_day_cutoff_time"), // 24-hour format, e.g., "14:00"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rental durations
export const rentalDurations = pgTable("rental_durations", {
  id: serial("id").primaryKey(),
  days: integer("days").notNull(),
  additionalPrice: integer("additional_price").notNull(), // In cents, added to base price
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dumpster pricing tiers (custom pricing per dumpster per duration)
export const dumpsterPricing = pgTable("dumpster_pricing", {
  id: serial("id").primaryKey(),
  dumpsterId: integer("dumpster_id").notNull(),
  days: integer("days").notNull(),
  price: integer("price").notNull(), // In cents, total price for this duration
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fleet units (individual dumpster tracking)
export const fleetUnits = pgTable("fleet_units", {
  id: serial("id").primaryKey(),
  unitNumber: text("unit_number").notNull().unique(), // Physical unit identifier (e.g., "15Y-001")
  dumpsterId: integer("dumpster_id").notNull(), // Reference to dumpster type
  status: text("status").notNull().default("available"), // available, out_for_delivery, at_customer, in_transit, needs_cleaning
  currentLocation: text("current_location").notNull().default("hub"), // hub, customer_address, or "in_transit"
  currentHubId: integer("current_hub_id"), // Which hub it's currently at (if at hub)
  currentBookingId: integer("current_booking_id"), // Current active booking (if applicable)
  needsCleaning: boolean("needs_cleaning").default(false),
  needsMaintenance: boolean("needs_maintenance").default(false),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  dumpsterId: integer("dumpster_id").notNull(),
  pricingId: integer("pricing_id").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: text("delivery_city").notNull(),
  deliveryZipCode: text("delivery_zip_code").notNull(),
  deliveryInstructions: text("delivery_instructions"),
  placementLocation: text("placement_location").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveryTimePreference: text("delivery_time_preference").notNull(),
  serviceZoneId: integer("service_zone_id").notNull(),
  selectedAddOns: jsonb("selected_add_ons"), // Array of add-on IDs
  totalPrice: integer("total_price").notNull(), // In cents
  paymentStatus: text("payment_status").notNull().default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  assignedFleetUnitId: integer("assigned_fleet_unit_id"), // Which specific dumpster unit is assigned
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Additional charges for bookings
export const additionalCharges = pgTable("additional_charges", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // In cents
  isPaid: boolean("is_paid").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment links for additional charges
export const paymentLinks = pgTable("payment_links", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  stripePaymentLinkId: text("stripe_payment_link_id").notNull(),
  totalAmount: integer("total_amount").notNull(), // In cents
  status: text("status").notNull().default("pending"), // "pending", "paid", "expired"
  expiresAt: timestamp("expires_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer accounts for portal access (simple email + access code login)
export const customerAccounts = pgTable("customer_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  accessCode: text("access_code").notNull(), // 6-digit code for simple login
  companyName: text("company_name"), // For business accounts
  isBusinessAccount: boolean("is_business_account").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Swap/pickup requests from customers
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  customerAccountId: integer("customer_account_id").references(() => customerAccounts.id),
  requestType: text("request_type").notNull(), // "pickup" (final), "swap" (replace with new), "early_complete"
  status: text("status").notNull().default("pending"), // "pending", "approved", "scheduled", "completed", "cancelled"
  requestedDate: timestamp("requested_date"), // When customer wants pickup/swap
  notes: text("notes"), // Customer notes
  adminNotes: text("admin_notes"), // Admin response notes
  scheduledDate: timestamp("scheduled_date"), // When admin schedules it
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer credits for early returns and loyalty
export const customerCredits = pgTable("customer_credits", {
  id: serial("id").primaryKey(),
  customerAccountId: integer("customer_account_id").notNull().references(() => customerAccounts.id),
  bookingId: integer("booking_id").references(() => bookings.id), // Source booking if from early return
  amount: integer("amount").notNull(), // In cents
  type: text("type").notNull(), // "early_return", "loyalty", "adjustment"
  description: text("description"),
  usedInBookingId: integer("used_in_booking_id").references(() => bookings.id), // If redeemed
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"), // Credits can expire
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Per-load billing configuration for commercial accounts
export const loadBillingConfig = pgTable("load_billing_config", {
  id: serial("id").primaryKey(),
  dumpsterId: integer("dumpster_id").notNull().references(() => dumpsters.id),
  pricePerLoad: integer("price_per_load").notNull(), // In cents
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Track loads/hauls for per-load billing
export const loadRecords = pgTable("load_records", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  swapRequestId: integer("swap_request_id").references(() => swapRequests.id),
  loadNumber: integer("load_number").notNull(), // 1, 2, 3, etc.
  priceCharged: integer("price_charged").notNull(), // In cents
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Business settings (configurable by admin)
export const businessSettings = pgTable("business_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Legal documents (terms of service, privacy policy)
export const legalDocuments = pgTable("legal_documents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "terms_of_service", "privacy_policy"
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: text("version").notNull().default("1.0"),
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDumpsterSchema = createInsertSchema(dumpsters).omit({
  id: true,
  createdAt: true,
});

export const insertAddOnSchema = createInsertSchema(addOns).omit({
  id: true,
  createdAt: true,
});

export const insertServiceZoneSchema = createInsertSchema(serviceZones).omit({
  id: true,
  createdAt: true,
}).extend({
  // Make geofencing fields nullable since they may not be set initially
  polygonPath: z.string().nullable().optional(),
  centerLat: z.number().nullable().optional(),
  centerLng: z.number().nullable().optional(),
  radiusMeters: z.number().nullable().optional(),
});

export const insertRentalDurationSchema = createInsertSchema(rentalDurations).omit({
  id: true,
  createdAt: true,
});

export const insertDumpsterPricingSchema = createInsertSchema(dumpsterPricing).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    // Override the default date validation to handle string dates properly
    // Keep dates in YYYY-MM-DD format and create them at noon to avoid timezone shifts
    deliveryDate: z.string().or(z.date()).transform(val => {
      if (typeof val === 'string') {
        // Parse YYYY-MM-DD format and create date at noon local time to avoid timezone issues
        const dateParts = val.split('-');
        if (dateParts.length !== 3) {
          throw new Error('Invalid date format - expected YYYY-MM-DD');
        }
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const day = parseInt(dateParts[2]);
        
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          throw new Error('Invalid date format - non-numeric components');
        }
        
        // Create date at noon to avoid timezone shifting
        const date = new Date(year, month, day, 12, 0, 0, 0);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        return date;
      }
      return val;
    })
  });

export const insertHubSchema = createInsertSchema(hubs)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertFleetUnitSchema = createInsertSchema(fleetUnits)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertAdditionalChargeSchema = createInsertSchema(additionalCharges)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertPaymentLinkSchema = createInsertSchema(paymentLinks)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertLegalDocumentSchema = createInsertSchema(legalDocuments)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Handle date transformation for effective date
    effectiveDate: z.string().or(z.date()).transform(val => {
      if (typeof val === 'string') {
        // Parse YYYY-MM-DD format and create date at noon local time to avoid timezone issues
        const dateParts = val.split('-');
        if (dateParts.length !== 3) {
          throw new Error('Invalid date format - expected YYYY-MM-DD');
        }
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const day = parseInt(dateParts[2]);
        
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          throw new Error('Invalid date format - non-numeric components');
        }
        
        // Create date at noon to avoid timezone shifting
        const date = new Date(year, month, day, 12, 0, 0, 0);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        return date;
      }
      return val;
    })
  });

export const insertServiceSchema = createInsertSchema(services)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertBusinessSettingSchema = createInsertSchema(businessSettings)
  .omit({
    id: true,
    updatedAt: true,
  });

export const insertCustomerAccountSchema = createInsertSchema(customerAccounts)
  .omit({
    id: true,
    createdAt: true,
    lastLoginAt: true,
  });

export const insertSwapRequestSchema = createInsertSchema(swapRequests)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    completedAt: true,
  })
  .extend({
    requestedDate: z.string().or(z.date()).optional().transform(val => {
      if (!val) return undefined;
      if (typeof val === 'string') {
        const dateParts = val.split('-');
        if (dateParts.length !== 3) {
          throw new Error('Invalid date format - expected YYYY-MM-DD');
        }
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          throw new Error('Invalid date format - non-numeric components');
        }
        const date = new Date(year, month, day, 12, 0, 0, 0);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        return date;
      }
      return val;
    })
  });

export const insertCustomerCreditSchema = createInsertSchema(customerCredits)
  .omit({
    id: true,
    createdAt: true,
    usedAt: true,
  });

export const insertLoadBillingConfigSchema = createInsertSchema(loadBillingConfig)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertLoadRecordSchema = createInsertSchema(loadRecords)
  .omit({
    id: true,
    createdAt: true,
    completedAt: true,
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Dumpster = typeof dumpsters.$inferSelect;
export type InsertDumpster = z.infer<typeof insertDumpsterSchema>;

export type FleetUnit = typeof fleetUnits.$inferSelect;
export type InsertFleetUnit = z.infer<typeof insertFleetUnitSchema>;

export type AddOn = typeof addOns.$inferSelect;
export type InsertAddOn = z.infer<typeof insertAddOnSchema>;

export type ServiceZone = typeof serviceZones.$inferSelect;
export type InsertServiceZone = z.infer<typeof insertServiceZoneSchema>;

export type RentalDuration = typeof rentalDurations.$inferSelect;
export type InsertRentalDuration = z.infer<typeof insertRentalDurationSchema>;

export type DumpsterPricing = typeof dumpsterPricing.$inferSelect;
export type InsertDumpsterPricing = z.infer<typeof insertDumpsterPricingSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Hub = typeof hubs.$inferSelect;
export type InsertHub = z.infer<typeof insertHubSchema>;

export type AdditionalCharge = typeof additionalCharges.$inferSelect;
export type InsertAdditionalCharge = z.infer<typeof insertAdditionalChargeSchema>;

export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type BusinessSetting = typeof businessSettings.$inferSelect;
export type InsertBusinessSetting = z.infer<typeof insertBusinessSettingSchema>;

export type CustomerAccount = typeof customerAccounts.$inferSelect;
export type InsertCustomerAccount = z.infer<typeof insertCustomerAccountSchema>;

export type SwapRequest = typeof swapRequests.$inferSelect;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;

export type CustomerCredit = typeof customerCredits.$inferSelect;
export type InsertCustomerCredit = z.infer<typeof insertCustomerCreditSchema>;

export type LoadBillingConfig = typeof loadBillingConfig.$inferSelect;
export type InsertLoadBillingConfig = z.infer<typeof insertLoadBillingConfigSchema>;

export type LoadRecord = typeof loadRecords.$inferSelect;
export type InsertLoadRecord = z.infer<typeof insertLoadRecordSchema>;
