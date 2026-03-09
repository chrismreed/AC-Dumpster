import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasGoogleMapsKey = !!googleMapsKey;

  return NextResponse.json({
    environment: 'server',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: hasGoogleMapsKey ? `${googleMapsKey?.substring(0, 10)}...` : 'Not found',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('NEXT_PUBLIC')),
  });
}