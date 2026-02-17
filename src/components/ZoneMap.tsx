'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Polygon, Circle, DrawingManager } from '@react-google-maps/api';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface ZoneMapProps {
  zone: {
    id: number;
    name: string;
    useGeofencing: boolean;
    centerLat?: number | null;
    centerLng?: number | null;
    radiusMeters?: number | null;
    polygonPath?: string | null;
    zipCodes?: string;
  };
  onBoundaryUpdate?: (data: {
    centerLat?: number;
    centerLng?: number;
    radiusMeters?: number;
    polygonPath?: string;
  }) => void;
  editable?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center (Effingham, IL area)
const defaultCenter = {
  lat: 39.1200,
  lng: -88.5434,
};

export function ZoneMap({ zone, onBoundaryUpdate, editable = false }: ZoneMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);

  // Determine map center
  const center = zone.centerLat && zone.centerLng
    ? { lat: zone.centerLat, lng: zone.centerLng }
    : defaultCenter;

  // Parse polygon path from JSON string
  const polygonPath = zone.polygonPath
    ? JSON.parse(zone.polygonPath)
    : null;

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle circle complete
  const onCircleComplete = useCallback((circle: google.maps.Circle) => {
    if (!editable) return;

    const center = circle.getCenter();
    const radius = circle.getRadius();

    if (center && onBoundaryUpdate) {
      onBoundaryUpdate({
        centerLat: center.lat(),
        centerLng: center.lng(),
        radiusMeters: Math.round(radius),
      });
    }

    // Remove the drawing after completion
    circle.setMap(null);

    // Clear drawing mode
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  }, [editable, onBoundaryUpdate, drawingManager]);

  // Handle polygon complete
  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    if (!editable) return;

    const path = polygon.getPath();
    const coordinates = path.getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));

    if (onBoundaryUpdate) {
      // Calculate center of polygon
      let latSum = 0;
      let lngSum = 0;
      coordinates.forEach(coord => {
        latSum += coord.lat;
        lngSum += coord.lng;
      });
      const centerLat = latSum / coordinates.length;
      const centerLng = lngSum / coordinates.length;

      onBoundaryUpdate({
        centerLat,
        centerLng,
        polygonPath: JSON.stringify(coordinates),
      });
    }

    // Remove the drawing after completion
    polygon.setMap(null);

    // Clear drawing mode
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  }, [editable, onBoundaryUpdate, drawingManager]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading Google Maps</p>
          <p className="text-sm text-red-500 mt-1">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zone.radiusMeters ? 11 : 10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
      }}
    >
      {/* Display existing circle if geofence with radius */}
      {zone.useGeofencing && zone.centerLat && zone.centerLng && zone.radiusMeters && (
        <Circle
          center={{ lat: zone.centerLat, lng: zone.centerLng }}
          radius={zone.radiusMeters}
          options={{
            fillColor: '#22c55e',
            fillOpacity: 0.2,
            strokeColor: '#22c55e',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            editable: editable,
            draggable: editable,
          }}
          onRadiusChanged={() => {
            if (editable && circle && onBoundaryUpdate) {
              const center = circle.getCenter();
              const radius = circle.getRadius();
              if (center) {
                onBoundaryUpdate({
                  centerLat: center.lat(),
                  centerLng: center.lng(),
                  radiusMeters: Math.round(radius),
                });
              }
            }
          }}
          onCenterChanged={() => {
            if (editable && circle && onBoundaryUpdate) {
              const center = circle.getCenter();
              const radius = circle.getRadius();
              if (center) {
                onBoundaryUpdate({
                  centerLat: center.lat(),
                  centerLng: center.lng(),
                  radiusMeters: Math.round(radius),
                });
              }
            }
          }}
          onLoad={setCircle}
          onUnmount={() => setCircle(null)}
        />
      )}

      {/* Display existing polygon if available */}
      {zone.useGeofencing && polygonPath && (
        <Polygon
          paths={polygonPath}
          options={{
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            editable: editable,
            draggable: editable,
          }}
          onLoad={setPolygon}
          onUnmount={() => setPolygon(null)}
        />
      )}

      {/* Drawing Manager for creating new boundaries */}
      {editable && (
        <DrawingManager
          onLoad={setDrawingManager}
          onUnmount={() => setDrawingManager(null)}
          onCircleComplete={onCircleComplete}
          onPolygonComplete={onPolygonComplete}
          options={{
            drawingControl: true,
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [
                google.maps.drawing.OverlayType.CIRCLE,
                google.maps.drawing.OverlayType.POLYGON,
              ],
            },
            circleOptions: {
              fillColor: '#22c55e',
              fillOpacity: 0.2,
              strokeColor: '#22c55e',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              editable: true,
              draggable: true,
            },
            polygonOptions: {
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              editable: true,
              draggable: true,
            },
          }}
        />
      )}
    </GoogleMap>
  );
}
