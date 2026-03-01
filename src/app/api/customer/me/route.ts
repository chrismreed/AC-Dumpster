import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error in customer /me:', error);
    return NextResponse.json(
      { message: 'Failed to get session' },
      { status: 500 }
    );
  }
}
