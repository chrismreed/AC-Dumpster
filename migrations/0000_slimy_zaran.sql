CREATE TABLE "add_ons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"cutoff_time" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"dumpster_id" integer NOT NULL,
	"pricing_id" integer NOT NULL,
	"delivery_address" text NOT NULL,
	"delivery_city" text NOT NULL,
	"delivery_zip_code" text NOT NULL,
	"delivery_instructions" text,
	"placement_location" text NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"delivery_time_preference" text NOT NULL,
	"service_zone_id" integer NOT NULL,
	"selected_add_ons" jsonb,
	"total_price" integer NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"assigned_fleet_unit_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dumpster_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"dumpster_id" integer NOT NULL,
	"days" integer NOT NULL,
	"price" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dumpsters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dimensions" text NOT NULL,
	"description" text NOT NULL,
	"weight_limit" integer NOT NULL,
	"availability" integer NOT NULL,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_number" text NOT NULL,
	"dumpster_id" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"current_location" text DEFAULT 'hub' NOT NULL,
	"current_hub_id" integer,
	"current_booking_id" integer,
	"needs_cleaning" boolean DEFAULT false,
	"needs_maintenance" boolean DEFAULT false,
	"last_maintenance_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fleet_units_unit_number_unique" UNIQUE("unit_number")
);
--> statement-breakpoint
CREATE TABLE "hubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"is_main_hub" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_durations" (
	"id" serial PRIMARY KEY NOT NULL,
	"days" integer NOT NULL,
	"additional_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"zip_codes" text NOT NULL,
	"delivery_fee" integer NOT NULL,
	"use_geofencing" boolean DEFAULT false,
	"center_lat" double precision,
	"center_lng" double precision,
	"radius_meters" integer,
	"polygon_path" text,
	"fee_multiplier" double precision DEFAULT 1,
	"max_driving_minutes" integer,
	"same_day_delivery_enabled" boolean DEFAULT false,
	"same_day_delivery_fee" integer DEFAULT 0,
	"same_day_cutoff_time" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
