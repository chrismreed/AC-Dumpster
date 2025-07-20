import { useQuery } from "@tanstack/react-query";

interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface GooglePlaceDetails {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
}

async function fetchGoogleReviews(): Promise<GooglePlaceDetails | null> {
  try {
    const response = await fetch('/api/google-reviews');
    
    if (!response.ok) {
      console.error('Failed to fetch Google reviews');
      return null;
    }
    
    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return null;
  }
}

export function useGoogleReviews() {
  return useQuery({
    queryKey: ['google-reviews'],
    queryFn: fetchGoogleReviews,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false,
  });
}