import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notificationLog } from '@shared/schema';
import { desc } from 'drizzle-orm';

// GET: Fetch recent notification log entries (paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await db
      .select()
      .from(notificationLog)
      .orderBy(desc(notificationLog.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching notification log:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notification log' },
      { status: 500 }
    );
  }
}
