import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete('customer_id');

  return NextResponse.json({ message: "Logged out successfully" });
}
