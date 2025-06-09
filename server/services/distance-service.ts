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

// Note: Geofencing zones are now managed through the database service zones
// These hardcoded zones are disabled in favor of custom polygon boundaries
const GEOFENCE_ZONES: any[] = [];

/**
 * Calculates delivery fee based on driving time from business location
 */
export async function calculateDistanceFee(
  deliveryAddress: string, 
  deliveryCity: string, 
  deliveryZipCode: string,
  zoneBaseDeliveryFee: number = 0
): Promise<{ 
  fee: number; 
  drivingTime: number | null; 
  drivingDistance: number | null;
  inServiceArea: boolean;
  zoneMultiplier: number;
  usingFallback: boolean;
}> {
  // Format complete address
  const destinationAddress = `${deliveryAddress}, ${deliveryCity}, ${deliveryZipCode}`;
  
  console.log(`Calculating distance from ${BUSINESS_LOCATION.address} to ${destinationAddress}`);
  
  try {
    // Get the Google Maps API key from environment variables
    // Note: Using VITE_ prefix for client-side, but we need to use the same key on server-side
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log(`Using Google Maps API key: ${apiKey ? 'present (starts with ' + apiKey.substring(0, 5) + '...)' : 'missing'}`);
    
    if (!apiKey) {
      console.error('Google Maps API key is missing. Falling back to zone base fee.');
      return {
        fee: zoneBaseDeliveryFee,
        drivingTime: null,
        drivingDistance: null,
        inServiceArea: true, // Assume in service area since we have a zone match
        zoneMultiplier: 1.0,
        usingFallback: true
      };
    }
    
    try {
      // Call Google Maps Distance Matrix API
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: BUSINESS_LOCATION.address,
            destinations: destinationAddress,
            mode: 'driving',
            key: apiKey
          }
        }
      );
      
      // Log response for debugging
      console.log('Distance Matrix API Response:', JSON.stringify(response.data, null, 2));
      
      // Parse response
      const data = response.data;
      
      // Check if API key restriction error
      if (data.status === 'REQUEST_DENIED' && data.error_message?.includes('referer restrictions')) {
        console.log('API key has referer restrictions. Falling back to zone base fee.');
        return {
          fee: zoneBaseDeliveryFee,
          drivingTime: null,
          drivingDistance: null,
          inServiceArea: true, // Assume in service area since we have a zone match
          zoneMultiplier: 1.0,
          usingFallback: true
        };
      }
      
      // Check if we got valid results
      if (
        !data.rows || 
        !data.rows[0] || 
        !data.rows[0].elements || 
        !data.rows[0].elements[0] ||
        data.rows[0].elements[0].status !== 'OK'
      ) {
        console.error('Invalid response from Distance Matrix API:', data);
        // Fall back to zone base delivery fee
        return {
          fee: zoneBaseDeliveryFee,
          drivingTime: null,
          drivingDistance: null,
          inServiceArea: true,
          zoneMultiplier: 1.0,
          usingFallback: true
        };
      }
      
      // Extract driving time and distance
      const drivingTimeInSeconds = data.rows[0].elements[0].duration.value;
      const drivingDistanceInMeters = data.rows[0].elements[0].distance.value;
      
      // Convert to minutes for fee calculation
      const drivingTimeInMinutes = Math.ceil(drivingTimeInSeconds / 60);
      
      // Determine fee based on driving time tiers
      let distanceBasedFee = 0;
      for (const tier of DISTANCE_TIERS) {
        if (drivingTimeInMinutes <= tier.maxMinutes) {
          distanceBasedFee = tier.fee;
          break;
        }
      }
      
      // Start with the zone's base delivery fee and add distance-based fee
      let fee = zoneBaseDeliveryFee + distanceBasedFee;
      
      // Try to geocode the address for more precise zone calculation
      try {
        // Geocode the destination address to get coordinates
        const geocodeResponse = await axios.get(
          'https://maps.googleapis.com/maps/api/geocode/json',
          {
            params: {
              address: destinationAddress,
              key: apiKey
            }
          }
        );
        
        // Get coordinates of destination
        const destinationCoords = geocodeResponse.data.results[0]?.geometry?.location;
        if (destinationCoords) {
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
            zoneMultiplier,
            usingFallback: false
          };
        }
      } catch (geocodeError) {
        console.log('Error during geocoding, using driving time only:', geocodeError);
      }
      
      // If geocoding failed, just use the driving time fee
      return {
        fee,
        drivingTime: drivingTimeInMinutes,
        drivingDistance: Math.round(drivingDistanceInMeters / 1000), // Convert to km
        inServiceArea: true, // Assume in service area since we have a zone match
        zoneMultiplier: 1.0,
        usingFallback: false
      };
      
    } catch (apiError) {
      console.error('Error calling Google Maps API:', apiError);
      // Fall back to zone base delivery fee
      return {
        fee: zoneBaseDeliveryFee,
        drivingTime: null,
        drivingDistance: null,
        inServiceArea: true,
        zoneMultiplier: 1.0,
        usingFallback: true
      };
    }
  } catch (error) {
    console.error('Error calculating distance fee:', error);
    // Fall back to zone base delivery fee
    return {
      fee: zoneBaseDeliveryFee,
      drivingTime: null,
      drivingDistance: null,
      inServiceArea: true,
      zoneMultiplier: 1.0,
      usingFallback: true
    };
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