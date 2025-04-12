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
  basePrice: integer("base_price").notNull(), // In cents
  weightLimit: integer("weight_limit").notNull(), // In pounds
  availability: integer("availability").notNull(), // Number of units available
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Service Add-ons
export const addOns = pgTable("add_ons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Service Zones (for location-based pricing)
export const serviceZones = pgTable("service_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  zipCodes: text("zip_codes").notNull(), // Comma-separated list of zip codes
  deliveryFee: integer("delivery_fee").notNull(), // In cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rental durations
export const rentalDurations = pgTable("rental_durations", {
  id: serial("id").primaryKey(),
  days: integer("days").notNull(),
  additionalPrice: integer("additional_price").notNull(), // In cents, added to base price
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  dumpsterId: integer("dumpster_id").notNull(),
  rentalDurationId: integer("rental_duration_id").notNull(),
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
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
});

export const insertRentalDurationSchema = createInsertSchema(rentalDurations).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Dumpster = typeof dumpsters.$inferSelect;
export type InsertDumpster = z.infer<typeof insertDumpsterSchema>;

export type AddOn = typeof addOns.$inferSelect;
export type InsertAddOn = z.infer<typeof insertAddOnSchema>;

export type ServiceZone = typeof serviceZones.$inferSelect;
export type InsertServiceZone = z.infer<typeof insertServiceZoneSchema>;

export type RentalDuration = typeof rentalDurations.$inferSelect;
export type InsertRentalDuration = z.infer<typeof insertRentalDurationSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
