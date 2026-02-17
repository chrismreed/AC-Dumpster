'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, Polygon, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface ServiceZone {
  id: number;
  name: string;
  zipCodes: string;
  deliveryFee: number;
  useGeofencing: boolean;
  centerLat: number | null;
  centerLng: number | null;
  radiusMeters: number | null;
  polygonPath: string | null;
  priority: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center on Effingham, IL
const defaultCenter = {
  lat: 39.1200,
  lng: -88.5434,
};

export function ServiceAreaMap() {
  const { isLoaded } = useGoogleMaps();
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    // Fetch service zones
    const fetchZones = async () => {
      try {
        const response = await fetch('/api/zones');
        if (response.ok) {
          const data = await response.json();
          setZones(data);
        }
      } catch (error) {
        console.error('Failed to fetch zones:', error);
      }
    };

    fetchZones();
  }, []);

  // Calculate center of all zones for initial map view
  useEffect(() => {
    if (map && zones.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      zones.forEach(zone => {
        if (zone.useGeofencing && zone.polygonPath) {
          try {
            const polygon: { lat: number; lng: number }[] = JSON.parse(zone.polygonPath);
            polygon.forEach(point => {
              bounds.extend(new google.maps.LatLng(point.lat, point.lng));
            });
          } catch (e) {
            console.error('Error parsing polygon:', e);
          }
        } else if (zone.centerLat && zone.centerLng) {
          bounds.extend(new google.maps.LatLng(zone.centerLat, zone.centerLng));
        }
      });

      map.fitBounds(bounds);
    }
  }, [map, zones]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f7c948] mx-auto mb-3"></div>
          <p className="text-sm font-medium text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Generate colors for different zones
  const getZoneColor = (index: number) => {
    const colors = [
      '#22c55e', // green
      '#3b82f6', // blue
      '#f59e0b', // amber
      '#ec4899', // pink
      '#8b5cf6', // purple
      '#06b6d4', // cyan
    ];
    return colors[index % colors.length];
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={10}
      onLoad={setMap}
      options={{
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
        mapTypeId: 'roadmap',
      }}
    >
      {zones.map((zone, index) => {
        const color = getZoneColor(index);

        // Render geofenced zones
        if (zone.useGeofencing && zone.polygonPath) {
          try {
            const polygon: { lat: number; lng: number }[] = JSON.parse(zone.polygonPath);

            // Calculate center of polygon for label
            const centerLat = polygon.reduce((sum, p) => sum + p.lat, 0) / polygon.length;
            const centerLng = polygon.reduce((sum, p) => sum + p.lng, 0) / polygon.length;

            return (
              <div key={zone.id}>
                <Polygon
                  paths={polygon}
                  options={{
                    fillColor: color,
                    fillOpacity: 0.25,
                    strokeColor: color,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: true,
                  }}
                  onClick={() => setSelectedZone(zone)}
                />
                <Marker
                  position={{ lat: centerLat, lng: centerLng }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 0,
                  }}
                  label={{
                    text: zone.name,
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    className: 'map-zone-label',
                  }}
                  onClick={() => setSelectedZone(zone)}
                />
              </div>
            );
          } catch (e) {
            console.error(`Error rendering zone ${zone.id}:`, e);
          }
        }

        // Render circular zones (if using center/radius)
        if (zone.centerLat && zone.centerLng && zone.radiusMeters && !zone.polygonPath) {
          // Note: For circular zones, we'd need to calculate circle points
          // For now, just show a marker with label
          return (
            <Marker
              key={zone.id}
              position={{ lat: zone.centerLat, lng: zone.centerLng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: color,
                fillOpacity: 0.6,
                strokeColor: color,
                strokeWeight: 2,
              }}
              label={{
                text: zone.name,
                color: '#111827',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
              onClick={() => setSelectedZone(zone)}
            />
          );
        }

        return null;
      })}

      {/* Info Window for selected zone */}
      {selectedZone && selectedZone.centerLat && selectedZone.centerLng && (
        <InfoWindow
          position={{ lat: selectedZone.centerLat, lng: selectedZone.centerLng }}
          onCloseClick={() => setSelectedZone(null)}
        >
          <div className="p-2">
            <h3 className="font-bold text-gray-900 mb-1">{selectedZone.name}</h3>
            <p className="text-sm text-gray-600 mb-1">
              Delivery Fee: <span className="font-semibold">${(selectedZone.deliveryFee / 100).toFixed(2)}</span>
            </p>
            {selectedZone.priority > 0 && (
              <p className="text-xs text-gray-500">Priority: {selectedZone.priority}</p>
            )}
            {!selectedZone.useGeofencing && selectedZone.zipCodes && (
              <p className="text-xs text-gray-500 mt-1">
                ZIP Codes: {selectedZone.zipCodes.split(',').slice(0, 3).join(', ')}
                {selectedZone.zipCodes.split(',').length > 3 && '...'}
              </p>
            )}
          </div>
        </InfoWindow>
      )}

      {/* Effingham center marker */}
      <Marker
        position={defaultCenter}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#f7c948',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }}
        label={{
          text: 'Effingham',
          color: '#111827',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
        title="Effingham, IL - Our Service Base"
      />
    </GoogleMap>
  );
}
