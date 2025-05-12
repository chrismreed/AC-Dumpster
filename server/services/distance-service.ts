import axios from 'axios';

// Define the business location (starting point for deliveries)
const BUSINESS_LOCATION = {
  address: "123 Main St, Effingham, IL 62401", // Replace with your business address
  lat: 39.1200, // Replace with your business latitude
  lng: -88.5434, // Replace with your business longitude
};

// Define distance fee tiers
const DISTANCE_TIERS = [
  { maxMinutes: 15, fee: 0 },          // 0-15 minutes: No additional fee
  { maxMinutes: 30, fee: 2500 },       // 16-30 minutes: $25 fee
  { maxMinutes: 45, fee: 5000 },       // 31-45 minutes: $50 fee
  { maxMinutes: 60, fee: 7500 },       // 46-60 minutes: $75 fee
  { maxMinutes: Infinity, fee: 10000 } // Over 60 minutes: $100 fee
];

// Geofencing zones (circular areas with radius in meters)
const GEOFENCE_ZONES = [
  { center: { lat: 39.1200, lng: -88.5434 }, radius: 10000, feeMultiplier: 1.0 },   // Zone 1: 10km radius, normal fee
  { center: { lat: 39.1200, lng: -88.5434 }, radius: 20000, feeMultiplier: 1.5 },   // Zone 2: 20km radius, 1.5x fee
  { center: { lat: 39.1200, lng: -88.5434 }, radius: 50000, feeMultiplier: 2.0 },   // Zone 3: 50km radius, 2x fee
];

/**
 * Calculates delivery fee based on driving time from business location
 */
export async function calculateDistanceFee(
  deliveryAddress: string, 
  deliveryCity: string, 
  deliveryZipCode: string
): Promise<{ 
  fee: number; 
  drivingTime: number; 
  drivingDistance: number;
  inServiceArea: boolean;
  zoneMultiplier: number;
}> {
  try {
    // Format complete address
    const destinationAddress = `${deliveryAddress}, ${deliveryCity}, ${deliveryZipCode}`;
    
    // Call Google Maps Distance Matrix API
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: BUSINESS_LOCATION.address,
          destinations: destinationAddress,
          mode: 'driving',
          key: process.env.VITE_GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    // Parse response
    const data = response.data;
    
    // Check if we got valid results
    if (
      !data.rows || 
      !data.rows[0] || 
      !data.rows[0].elements || 
      !data.rows[0].elements[0] ||
      data.rows[0].elements[0].status !== 'OK'
    ) {
      console.error('Invalid response from Distance Matrix API:', data);
      throw new Error('Unable to calculate distance');
    }
    
    // Extract driving time and distance
    const drivingTimeInSeconds = data.rows[0].elements[0].duration.value;
    const drivingDistanceInMeters = data.rows[0].elements[0].distance.value;
    
    // Convert to minutes for fee calculation
    const drivingTimeInMinutes = Math.ceil(drivingTimeInSeconds / 60);
    
    // Determine fee based on driving time tiers
    let fee = 0;
    for (const tier of DISTANCE_TIERS) {
      if (drivingTimeInMinutes <= tier.maxMinutes) {
        fee = tier.fee;
        break;
      }
    }
    
    // Geocode the destination address to get coordinates
    const geocodeResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: destinationAddress,
          key: process.env.VITE_GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    // Get coordinates of destination
    const destinationCoords = geocodeResponse.data.results[0]?.geometry?.location;
    if (!destinationCoords) {
      throw new Error('Unable to geocode destination address');
    }
    
    // Determine which geofence zone the destination falls into
    let zoneMultiplier = 1.0;
    let inServiceArea = false;
    
    for (const zone of GEOFENCE_ZONES) {
      const distance = getDistanceFromLatLonInMeters(
        zone.center.lat, 
        zone.center.lng, 
        destinationCoords.lat, 
        destinationCoords.lng
      );
      
      if (distance <= zone.radius) {
        zoneMultiplier = zone.feeMultiplier;
        inServiceArea = true;
        break;
      }
    }
    
    // Apply zone multiplier to the fee
    fee = Math.round(fee * zoneMultiplier);
    
    return {
      fee,
      drivingTime: drivingTimeInMinutes,
      drivingDistance: Math.round(drivingDistanceInMeters / 1000), // Convert to km
      inServiceArea,
      zoneMultiplier
    };
  } catch (error) {
    console.error('Error calculating distance fee:', error);
    throw new Error('Unable to calculate delivery fee based on distance');
  }
}

/**
 * Calculate the straight-line distance between two sets of coordinates 
 * (Haversine formula)
 */
function getDistanceFromLatLonInMeters(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371000; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in meters
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}