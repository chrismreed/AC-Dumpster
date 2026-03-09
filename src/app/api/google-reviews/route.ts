import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory cache for Google reviews (resets on server restart)
// In production, consider using Redis or another persistent cache
let cachedReviews: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 1 week

export async function GET(request: NextRequest) {
  try {
    // Check if we have fresh cached data
    const now = Date.now();
    if (cachedReviews && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log("Serving cached Google reviews");
      return NextResponse.json(cachedReviews);
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    console.log("Fetching fresh Google reviews");

    // Search for Alley Cat Dumpsters in Effingham, IL
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=Alley+Cat+Dumpsters+Effingham+IL&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      console.error("Google search API error:", searchResponse.status, searchResponse.statusText);
      // Return cached data if available, even if stale
      if (cachedReviews) {
        return NextResponse.json(cachedReviews);
      }
      return NextResponse.json(
        { error: "Failed to search for business" },
        { status: 500 }
      );
    }

    const searchData = await searchResponse.json();

    if (searchData.results && searchData.results.length > 0) {
      const placeId = searchData.results[0].place_id;

      // Get detailed information including reviews
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,formatted_address,formatted_phone_number,website&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);

      if (!detailsResponse.ok) {
        console.error("Google details API error:", detailsResponse.status, detailsResponse.statusText);
        // Return cached data if available, even if stale
        if (cachedReviews) {
          return NextResponse.json(cachedReviews);
        }
        return NextResponse.json(
          { error: "Failed to get place details" },
          { status: 500 }
        );
      }

      const detailsData = await detailsResponse.json();

      // Cache the fresh data
      cachedReviews = detailsData;
      cacheTimestamp = now;

      console.log(`Cached ${detailsData.result?.reviews?.length || 0} reviews`);
      return NextResponse.json(detailsData);
    } else {
      const emptyResult = { result: null };
      cachedReviews = emptyResult;
      cacheTimestamp = now;
      return NextResponse.json(emptyResult);
    }
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    // Return cached data if available, even if stale
    if (cachedReviews) {
      console.log("Returning cached data due to API error");
      return NextResponse.json(cachedReviews);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
