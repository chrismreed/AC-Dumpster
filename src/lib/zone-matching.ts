import { db } from '@/lib/db';
import { serviceZones } from '@shared/schema';

interface Zone {
  id: number;
  name: string;
  zipCodes: string;
  deliveryFee: number;
  useGeofencing: boolean;
  centerLat: number | null;
  centerLng: number | null;
  radiusMeters: number | null;
  polygonPath: string | null;
  feeMultiplier: number | null;
  maxDrivingMinutes: number | null;
  priority: number;
  sameDayDeliveryEnabled: boolean;
  sameDayDeliveryFee: number;
  sameDayCutoffTime: string | null;
  createdAt: Date;
}

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculate the area of a polygon in square meters using the spherical excess formula
 */
function calculatePolygonArea(polygon: Coordinates[]): number {
  if (polygon.length < 3) return 0;

  const earthRadius = 6371000; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    area +=
      (p2.lng - p1.lng) * (2 + Math.sin((p1.lat * Math.PI) / 180) + Math.sin((p2.lat * Math.PI) / 180));
  }

  area = (area * earthRadius * earthRadius) / 2.0;
  return Math.abs(area);
}

/**
 * Calculate the area of a circular zone
 */
function calculateCircleArea(radiusMeters: number): number {
  return Math.PI * radiusMeters * radiusMeters;
}

/**
 * Find the best matching service zone for a given address
 *
 * Priority rules (in order):
 * 1. Manual priority value (higher number = higher priority)
 * 2. Geofence zones take precedence over ZIP code zones
 * 3. Smaller geofence areas take precedence over larger ones
 * 4. If multiple ZIP zones match, use the one with higher priority
 *
 * @param coordinates - The lat/lng of the delivery address
 * @param zipCode - The ZIP code of the delivery address
 * @returns The best matching zone or null if no match found
 */
export async function findMatchingZone(
  coordinates: Coordinates | null,
  zipCode: string | null
): Promise<Zone | null> {
  // Fetch all active zones
  const zones = await db.select().from(serviceZones);

  if (zones.length === 0) {
    return null;
  }

  const matchingZones: Array<{ zone: Zone; area: number }> = [];

  for (const zone of zones) {
    // Check geofence match
    if (zone.useGeofencing && coordinates) {
      let isInZone = false;

      // Check polygon geofence
      if (zone.polygonPath) {
        try {
          const polygon: Coordinates[] = JSON.parse(zone.polygonPath);
          if (isPointInPolygon(coordinates, polygon)) {
            const area = calculatePolygonArea(polygon);
            matchingZones.push({ zone, area });
            continue;
          }
        } catch (e) {
          console.error(`Error parsing polygon for zone ${zone.id}:`, e);
        }
      }

      // Check circular geofence (if using center/radius)
      if (zone.centerLat && zone.centerLng && zone.radiusMeters && !zone.polygonPath) {
        const distance = calculateDistance(
          coordinates,
          { lat: zone.centerLat, lng: zone.centerLng }
        );
        if (distance <= zone.radiusMeters) {
          const area = calculateCircleArea(zone.radiusMeters);
          matchingZones.push({ zone, area });
          continue;
        }
      }
    }

    // Check ZIP code match
    if (!zone.useGeofencing && zipCode) {
      const zonePipeCodes = zone.zipCodes.split(',').map((z) => z.trim());
      if (zonePipeCodes.includes(zipCode)) {
        // Use a large area value for ZIP zones so they're deprioritized vs geofences
        matchingZones.push({ zone, area: Number.MAX_SAFE_INTEGER });
      }
    }
  }

  if (matchingZones.length === 0) {
    return null;
  }

  // Sort by priority rules:
  // 1. Higher manual priority first
  // 2. Then smaller area (geofences will be smaller than ZIP zones)
  matchingZones.sort((a, b) => {
    // First compare priority (higher is better)
    if (b.zone.priority !== a.zone.priority) {
      return b.zone.priority - a.zone.priority;
    }

    // Then compare area (smaller is better)
    return a.area - b.area;
  });

  return matchingZones[0].zone;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const earthRadius = 6371000; // Earth's radius in meters
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

/**
 * Find all zones that contain a given point (for detecting overlaps)
 */
export async function findAllMatchingZones(
  coordinates: Coordinates | null,
  zipCode: string | null
): Promise<Zone[]> {
  const zones = await db.select().from(serviceZones);
  const matchingZones: Zone[] = [];

  for (const zone of zones) {
    // Check geofence match
    if (zone.useGeofencing && coordinates) {
      // Check polygon geofence
      if (zone.polygonPath) {
        try {
          const polygon: Coordinates[] = JSON.parse(zone.polygonPath);
          if (isPointInPolygon(coordinates, polygon)) {
            matchingZones.push(zone);
            continue;
          }
        } catch (e) {
          console.error(`Error parsing polygon for zone ${zone.id}:`, e);
        }
      }

      // Check circular geofence
      if (zone.centerLat && zone.centerLng && zone.radiusMeters && !zone.polygonPath) {
        const distance = calculateDistance(
          coordinates,
          { lat: zone.centerLat, lng: zone.centerLng }
        );
        if (distance <= zone.radiusMeters) {
          matchingZones.push(zone);
          continue;
        }
      }
    }

    // Check ZIP code match
    if (!zone.useGeofencing && zipCode) {
      const zoneZipCodes = zone.zipCodes.split(',').map((z) => z.trim());
      if (zoneZipCodes.includes(zipCode)) {
        matchingZones.push(zone);
      }
    }
  }

  return matchingZones;
}
