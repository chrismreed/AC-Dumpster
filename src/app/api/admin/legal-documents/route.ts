import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legalDocuments, insertLegalDocumentSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    const documents = await db
      .select()
      .from(legalDocuments)
      .orderBy(desc(legalDocuments.createdAt));

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json(
      { message: 'Failed to fetch legal documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }    const body = await request.json();

    // Validate the legal document data
    const validatedData = insertLegalDocumentSchema.parse(body);

    // Create the legal document
    const [document] = await db
      .insert(legalDocuments)
      .values(validatedData)
      .returning();

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating legal document:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({
        message: "Invalid legal document data",
        errors: error.issues
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to create legal document' },
      { status: 500 }
    );
  }
}
