import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    // Create all missing tables from the migration
    const createStatements = [
      `CREATE TABLE IF NOT EXISTS customer_accounts (
        id serial PRIMARY KEY NOT NULL,
        email text NOT NULL UNIQUE,
        access_code text NOT NULL,
        company_name text,
        is_business_account boolean DEFAULT false,
        last_login_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS customer_credits (
        id serial PRIMARY KEY NOT NULL,
        customer_account_id integer NOT NULL,
        booking_id integer,
        amount integer NOT NULL,
        type text NOT NULL,
        description text,
        used_in_booking_id integer,
        used_at timestamp,
        expires_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS swap_pricing (
        id serial PRIMARY KEY NOT NULL,
        request_type text NOT NULL UNIQUE,
        name text NOT NULL,
        description text,
        base_fee integer NOT NULL DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS swap_requests (
        id serial PRIMARY KEY NOT NULL,
        booking_id integer NOT NULL,
        customer_account_id integer,
        request_type text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        requested_date timestamp,
        notes text,
        admin_notes text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS business_settings (
        id serial PRIMARY KEY NOT NULL,
        key text NOT NULL UNIQUE,
        value text NOT NULL,
        description text,
        updated_at timestamp DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS hubs (
        id serial PRIMARY KEY NOT NULL,
        name text NOT NULL,
        address text NOT NULL,
        city text NOT NULL,
        state text NOT NULL,
        zip_code text NOT NULL,
        phone text,
        operating_hours text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now() NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS legal_documents (
        id serial PRIMARY KEY NOT NULL,
        type text NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        version text DEFAULT '1.0' NOT NULL,
        is_active boolean DEFAULT true,
        is_required boolean DEFAULT false,
        effective_date timestamp,
        created_by integer,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )`,
      `ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS is_required boolean DEFAULT false`,
      `ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS created_by integer`,
      `CREATE TABLE IF NOT EXISTS services (
        id serial PRIMARY KEY NOT NULL,
        name text NOT NULL,
        description text NOT NULL,
        base_price integer NOT NULL,
        price_unit text NOT NULL,
        is_active boolean DEFAULT true,
        sort_order integer DEFAULT 0,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )`
    ];

    for (const statement of createStatements) {
      await db.execute(sql.raw(statement));
    }

    return NextResponse.json({ message: "All missing tables created successfully" });
  } catch (error) {
    console.error('Error creating tables:', error);
    return NextResponse.json(
      { message: 'Failed to create tables', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
