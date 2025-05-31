import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/providers/google-maps-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Booking, Dumpster } from '@shared/schema';

interface DeliveryMapProps {
  bookings: Booking[];
  dumpsters: Dumpster[];
}

const containerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 39.1200,
  lng: -88.5434
};

// Geocoding function
async function geocodeAddress(address: string): Promise<google.maps.LatLngLiteral | null> {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng()
        });
      } else {
        console.warn(`Geocoding failed for address: ${address}`, status);
        resolve(null);
      }
    });
  });
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// Get marker color based on booking status
function getMarkerColor(status: string): string {
  switch (status) {
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
  const customMarkersRef = useRef<google.maps.Marker[]>([]);

  const { isLoaded } = useGoogleMaps();

  // Load map
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Geocode addresses and create markers
  useEffect(() => {
    if (!isLoaded || !bookings.length) {
      setMarkers([]);
      return;
    }

    let isCancelled = false;

    const geocodeBookings = async () => {
      try {
        const markerPromises = bookings.map(async (booking) => {
          const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
          const position = await geocodeAddress(address);
          
          if (position) {
            return { booking, position };
          }
          return null;
        });

        const resolvedMarkers = (await Promise.all(markerPromises)).filter(Boolean) as Array<{ booking: Booking; position: google.maps.LatLngLiteral }>;
        
        if (!isCancelled) {
          setMarkers(resolvedMarkers);

          // Update map center to show all markers
          if (resolvedMarkers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            resolvedMarkers.forEach(({ position }) => bounds.extend(position));
            
            // Calculate center from bounds
            const center = bounds.getCenter();
            if (center) {
              setMapCenter({ lat: center.lat(), lng: center.lng() });
            }
          }
        }
      } catch (error) {
        console.error('Error geocoding bookings:', error);
      }
    };

    geocodeBookings();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, bookings]);

  // Update custom markers when map loads and markers are available
  useEffect(() => {
    if (map && markers.length > 0) {
      // Clear existing markers first
      customMarkersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      customMarkersRef.current = [];

      const newMarkers = markers.map(({ booking, position }) => {
        const marker = new google.maps.Marker({
          position,
          map,
          title: `${booking.customerName} - ${booking.deliveryAddress}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getMarkerColor(booking.status),
            fillOpacity: 0.8,
            strokeColor: '#fff',
            strokeWeight: 2,
          }
        });

        marker.addListener('click', () => {
          setSelectedMarker({ booking, position });
        });

        return marker;
      });

      customMarkersRef.current = newMarkers;
    }
  }, [map, markers]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      customMarkersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      customMarkersRef.current = [];
    };
  }, []);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading map...</p>
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
                    <p className="text-sm">{formatDate(selectedMarker.booking.deliveryDate.toString())}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Created At</span>
                    <p className="text-sm">{formatDate(selectedMarker.booking.createdAt.toString())}</p>
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