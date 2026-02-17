import { useJsApiLoader } from '@react-google-maps/api';

// Define all libraries needed across the app
const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"];

// Shared Google Maps loader hook
export function useGoogleMaps() {
  return useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });
}
