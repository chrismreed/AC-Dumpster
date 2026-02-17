import { NextRequest, NextResponse } from 'next/server';
import { findMatchingZone } from '@/lib/zone-matching';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zipCode = searchParams.get('zipCode');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Build coordinates if both lat and lng are provided
    const coordinates = (lat && lng)
      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
      : null;

    // Find the best matching zone using priority-based logic
    const zone = await findMatchingZone(coordinates, zipCode);

    if (zone) {
      return NextResponse.json({ zone });
    }

    return NextResponse.json({ zone: null });
  } catch (error) {
    console.error('Error matching service zone:', error);
    return NextResponse.json(
      { message: 'Failed to match service zone' },
      { status: 500 }
    );
  }
}
