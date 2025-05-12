import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Circle, Marker } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { ServiceZone } from '@shared/schema';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Map } from 'lucide-react';

// Define the business location (center point for all operations)
const BUSINESS_LOCATION = {
  lat: 39.1200,
  lng: -88.5434,
  address: "123 Main St, Effingham, IL 62401",
};

// Map container style
const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
};

// Animation duration in ms
const ANIMATION_DURATION = 800;

// Generate a color based on zone's fee multiplier - higher = more intense color
const getZoneColor = (multiplier: number | null) => {
  if (!multiplier || multiplier <= 1) return '#3b82f6'; // blue
  if (multiplier <= 1.5) return '#10b981'; // green
  if (multiplier <= 2) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

interface ServiceZoneMapProps {
  isAdmin?: boolean;
}

export function ServiceZoneMap({ isAdmin = true }: ServiceZoneMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ServiceZone | null>(null);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);
  const [animatingZones, setAnimatingZones] = useState<number[]>([]);

  // Load the Google Maps JS API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Fetch service zones
  const { data: zones } = useQuery<ServiceZone[]>({
    queryKey: ['/api/zones'],
  });

  // Handler for when the map is loaded
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Handler for when the map is unmounted
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Start animation for a zone when hovered
  const handleZoneMouseOver = useCallback((zone: ServiceZone) => {
    setHoveredZone(zone);
    setAnimatingZones(prev => [...prev, zone.id]);

    // Stop animation after duration
    setTimeout(() => {
      setAnimatingZones(prev => prev.filter(id => id !== zone.id));
    }, ANIMATION_DURATION);
  }, []);

  // Reset hover state
  const handleZoneMouseOut = useCallback(() => {
    setHoveredZone(null);
  }, []);

  // Handle click on a zone
  const handleZoneClick = useCallback((zone: ServiceZone) => {
    setSelectedZone(prev => prev?.id === zone.id ? null : zone);
  }, []);

  // Fit map bounds to include all zones when zones change
  useEffect(() => {
    if (map && zones && zones.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // Always include business location
      bounds.extend(new google.maps.LatLng(
        BUSINESS_LOCATION.lat,
        BUSINESS_LOCATION.lng
      ));
      
      // Add all geofence zones with valid coordinates
      zones.forEach(zone => {
        if (zone.useGeofencing && zone.centerLat && zone.centerLng) {
          bounds.extend(new google.maps.LatLng(
            zone.centerLat,
            zone.centerLng
          ));
        }
      });
      
      // Only fit bounds if we have more than just the business location
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        // Only one point, so we'll just center on it and set a default zoom
        map.setCenter(bounds.getCenter());
        map.setZoom(10);
      } else {
        map.fitBounds(bounds);
      }
    }
  }, [map, zones]);

  if (!isLoaded) {
    return <div className="h-96 w-full flex items-center justify-center bg-muted rounded-lg">Loading Map...</div>;
  }

  return (
    <Card className="w-full shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={BUSINESS_LOCATION}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
            }}
          >
            {/* Business Location Marker */}
            <Marker
              position={BUSINESS_LOCATION}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(40, 40),
              }}
              title="Business Location"
            />

            {/* Draw circles for geofence zones */}
            {zones?.filter(zone => zone.useGeofencing && zone.centerLat && zone.centerLng).map((zone) => {
              const isAnimating = animatingZones.includes(zone.id);
              const isSelected = selectedZone?.id === zone.id;
              const baseColor = getZoneColor(zone.feeMultiplier);
              
              return (
                <HoverCard key={zone.id} open={hoveredZone?.id === zone.id}>
                  <HoverCardTrigger asChild>
                    <Circle
                      center={{
                        lat: zone.centerLat as number,
                        lng: zone.centerLng as number,
                      }}
                      radius={zone.radiusMeters || 10000}
                      options={{
                        fillColor: baseColor,
                        fillOpacity: isSelected ? 0.4 : isAnimating ? 0.5 : 0.2,
                        strokeColor: baseColor,
                        strokeOpacity: isSelected ? 1 : 0.8,
                        strokeWeight: isSelected ? 3 : 2,
                        clickable: true,
                        editable: isAdmin && isSelected,
                        zIndex: isSelected ? 2 : isAnimating ? 1 : 0,
                      }}
                      onMouseOver={() => handleZoneMouseOver(zone)}
                      onMouseOut={handleZoneMouseOut}
                      onClick={() => handleZoneClick(zone)}
                    />
                  </HoverCardTrigger>
                  <HoverCardContent 
                    className="w-80" 
                    side="top"
                    align="center"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Map className="h-5 w-5 mr-2 text-primary" />
                        <h4 className="text-sm font-semibold">{zone.name}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center">
                          <Navigation className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>Radius: {((zone.radiusMeters || 0) / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm">Fee Multiplier: {zone.feeMultiplier}x</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>Center: {zone.centerLat?.toFixed(4)}, {zone.centerLng?.toFixed(4)}</span>
                        </div>
                        {zone.maxDrivingMinutes && (
                          <div className="flex items-center">
                            <span className="text-sm">Max Drive Time: {zone.maxDrivingMinutes} min</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {isAdmin ? "Click to edit circle" : ""}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </GoogleMap>
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-background p-2 rounded-md shadow-md text-xs">
            <div className="font-semibold mb-1">Fee Multipliers</div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getZoneColor(1) }}></div>
              <span>1x</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getZoneColor(1.5) }}></div>
              <span>1.5x</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getZoneColor(2) }}></div>
              <span>2x</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getZoneColor(3) }}></div>
              <span>3x+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}