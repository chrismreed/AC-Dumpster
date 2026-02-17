import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legalDocuments } from '@shared/schema';
import { asc, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // e.g. "terms" or "privacy"

    if (type) {
      // Fetch the latest active document of this type
      const docs = await db
        .select()
        .from(legalDocuments)
        .where(eq(legalDocuments.type, type))
        .orderBy(desc(legalDocuments.updatedAt));

      const document = docs.find(d => (d as { isActive?: boolean }).isActive !== false) ?? docs[0];
      return NextResponse.json(document ?? null);
    }

    const documents = await db
      .select()
      .from(legalDocuments)
      .orderBy(asc(legalDocuments.createdAt));

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json(
      { message: 'Failed to fetch legal documents' },
      { status: 500 }
    );
  }
}
