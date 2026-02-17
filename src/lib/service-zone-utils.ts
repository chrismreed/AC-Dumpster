export interface AddressInfo {
  formattedAddress: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface ServiceZoneCheck {
  isValid: boolean;
  zoneId?: number;
  zoneName?: string;
  deliveryFee: number;
  error?: string;
}

/**
 * Check if an address is within service zones
 * Uses priority-based matching that considers:
 * 1. Manual priority value (higher number = higher priority)
 * 2. Geofence zones take precedence over ZIP code zones
 * 3. Smaller geofence areas take precedence over larger ones
 */
export async function checkServiceZone(addressInfo: AddressInfo): Promise<ServiceZoneCheck> {
  try {
    // Call the zone matching API endpoint
    const params = new URLSearchParams();
    if (addressInfo.zipCode) {
      params.append('zipCode', addressInfo.zipCode);
    }
    if (addressInfo.latitude && addressInfo.longitude) {
      params.append('lat', addressInfo.latitude.toString());
      params.append('lng', addressInfo.longitude.toString());
    }

    const response = await fetch(`/api/zones/match?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to check service zone');
    }

    const data = await response.json();

    if (data.zone) {
      return {
        isValid: true,
        zoneId: data.zone.id,
        zoneName: data.zone.name,
        deliveryFee: data.zone.deliveryFee,
      };
    }

    // No service zone found
    return {
      isValid: false,
      deliveryFee: 0,
      error: 'Address is outside our service area. Please contact us for availability.',
    };
  } catch (error) {
    console.error('Error checking service zone:', error);
    return {
      isValid: false,
      deliveryFee: 0,
      error: 'Unable to verify service area. Please try again.',
    };
  }
}

