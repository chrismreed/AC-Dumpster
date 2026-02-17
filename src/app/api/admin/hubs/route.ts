import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hubs, insertHubSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const allHubs = await db
      .select()
      .from(hubs)
      .orderBy(desc(hubs.createdAt));

    return NextResponse.json(allHubs);
  } catch (error) {
    console.error('Error fetching hubs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch hubs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();

    // Validate the hub data
    const validatedData = insertHubSchema.parse(body);

    // Create the hub
    const [hub] = await db
      .insert(hubs)
      .values(validatedData)
      .returning();

    return NextResponse.json(hub, { status: 201 });
  } catch (error) {
    console.error('Error creating hub:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid hub data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create hub' },
      { status: 500 }
    );
  }
}
