import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notificationTemplates } from '@shared/schema';
import { eq } from 'drizzle-orm';

// GET: Fetch all notification templates
export async function GET() {
  try {
    const templates = await db
      .select()
      .from(notificationTemplates)
      .orderBy(notificationTemplates.id);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notification templates' },
      { status: 500 }
    );
  }
}

// PUT: Batch update notification templates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { templates } = body as { templates: Array<{
      id: number;
      emailEnabled: boolean;
      smsEnabled: boolean;
      emailSubject: string;
      emailBody: string;
      smsBody: string;
    }> };

    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json(
        { message: 'Invalid request body — expected { templates: [...] }' },
        { status: 400 }
      );
    }

    const results = [];

    for (const t of templates) {
      const [updated] = await db
        .update(notificationTemplates)
        .set({
          emailEnabled: t.emailEnabled,
          smsEnabled: t.smsEnabled,
          emailSubject: t.emailSubject,
          emailBody: t.emailBody,
          smsBody: t.smsBody,
          updatedAt: new Date(),
        })
        .where(eq(notificationTemplates.id, t.id))
        .returning();

      results.push(updated);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating notification templates:', error);
    return NextResponse.json(
      { message: 'Failed to update notification templates' },
      { status: 500 }
    );
  }
}
