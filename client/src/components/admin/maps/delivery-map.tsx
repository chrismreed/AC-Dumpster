import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/providers/google-maps-provider';
import { Booking, Dumpster } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface DeliveryMapProps {
  bookings: Booking[];
  dumpsters: Dumpster[];
}

// Default map center (will be adjusted based on markers)
const defaultCenter = {
  lat: 39.8283, // Middle of USA as fallback
  lng: -98.5795,
};

// Map container style
const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem',
};

// Geocode address to get coordinates
async function geocodeAddress(address: string): Promise<google.maps.LatLngLiteral | null> {
  if (!address) return null;
  
  try {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ address });
    
    if (result.results && result.results.length > 0) {
      const location = result.results[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng(),
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  return null;
}

// Get status color for markers
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return '#10b981'; // green
    case 'delivered':
      return '#3b82f6'; // blue
    case 'picked_up':
      return '#8b5cf6'; // purple
    case 'cancelled':
      return '#ef4444'; // red
    case 'pending':
    default:
      return '#f59e0b'; // yellow
  }
}

export function DeliveryMap({ bookings, dumpsters }: DeliveryMapProps) {
  const [markers, setMarkers] = useState<Array<{ booking: Booking; position: google.maps.LatLngLiteral }>>([]);
  const [selectedMarker, setSelectedMarker] = useState<{ booking: Booking; position: google.maps.LatLngLiteral } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [customMarkers, setCustomMarkers] = useState<any[]>([]);

  const { isLoaded } = useGoogleMaps();

  // Function to create custom markers on the map
  const createCustomMarkers = useCallback((map: google.maps.Map, markers: Array<{ booking: Booking; position: google.maps.LatLngLiteral }>) => {
    // Clear existing markers
    customMarkers.forEach(marker => {
      if (marker.setMap) marker.setMap(null);
    });

    const newMarkers = markers.map(({ booking, position }) => {
      // Create a simple circle marker using a Circle overlay
      const marker = new google.maps.Circle({
        strokeColor: '#FFFFFF',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: getStatusColor(booking.status),
        fillOpacity: 1,
        map,
        center: position,
        radius: 100, // Small radius for marker appearance
        clickable: true,
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedMarker({ booking, position });
      });

      return marker;
    });

    setCustomMarkers(newMarkers);
  }, [customMarkers]);

  // Load map and set up markers
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Geocode addresses and create markers
  useEffect(() => {
    if (!isLoaded || !bookings.length) return;

    const geocodeBookings = async () => {
      const markerPromises = bookings.map(async (booking) => {
        const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
        const position = await geocodeAddress(address);
        
        if (position) {
          return { booking, position };
        }
        return null;
      });

      const resolvedMarkers = (await Promise.all(markerPromises)).filter(Boolean) as Array<{ booking: Booking; position: google.maps.LatLngLiteral }>;
      setMarkers(resolvedMarkers);

      // Calculate center based on markers
      if (resolvedMarkers.length > 0) {
        const avgLat = resolvedMarkers.reduce((sum, marker) => sum + marker.position.lat, 0) / resolvedMarkers.length;
        const avgLng = resolvedMarkers.reduce((sum, marker) => sum + marker.position.lng, 0) / resolvedMarkers.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
    };

    geocodeBookings();
  }, [bookings, isLoaded]);

  // Create custom markers when map and markers are ready
  useEffect(() => {
    if (map && markers.length > 0) {
      createCustomMarkers(map, markers);
    }
  }, [map, markers, createCustomMarkers]);

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={10}
          onLoad={onLoad}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        >
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 max-w-[300px]">
                <h3 className="font-bold text-lg mb-1">{selectedMarker.booking.customerName}</h3>
                <p className="text-gray-700 mb-1">
                  {selectedMarker.booking.deliveryAddress}, {selectedMarker.booking.deliveryCity}, {selectedMarker.booking.deliveryZipCode}
                </p>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div>
                    <span className="text-xs text-gray-500">Delivery Date</span>
                    <p className="text-sm">{formatDate(selectedMarker.booking.deliveryDate)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Created At</span>
                    <p className="text-sm">{formatDate(selectedMarker.booking.createdAt)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant={selectedMarker.booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {selectedMarker.booking.status}
                  </Badge>
                  <span className="text-sm font-medium">${selectedMarker.booking.totalPrice}</span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Delivered</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Picked Up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}