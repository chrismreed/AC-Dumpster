import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
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
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

// Get status color for markers
function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return '#3B82F6'; // blue-500
    case 'delivered':
      return '#10B981'; // green-500
    case 'completed':
      return '#8B5CF6'; // purple-500
    case 'cancelled':
      return '#EF4444'; // red-500
    default:
      return '#6B7280'; // gray-500
  }
}

export function DeliveryMap({ bookings, dumpsters }: DeliveryMapProps) {
  const [markers, setMarkers] = useState<Array<{ booking: Booking; position: google.maps.LatLngLiteral }>>([]);
  const [selectedMarker, setSelectedMarker] = useState<{ booking: Booking; position: google.maps.LatLngLiteral } | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  // Function to get dumpster name by ID
  const getDumpsterName = useCallback((dumpsterId: number) => {
    const dumpster = dumpsters.find(d => d.id === dumpsterId);
    return dumpster ? dumpster.name : 'Unknown Dumpster';
  }, [dumpsters]);

  // Geocode all booking addresses
  useEffect(() => {
    if (!isLoaded || !bookings.length) return;

    const geocodeBookings = async () => {
      const geocodedMarkers = [];
      
      for (const booking of bookings) {
        // Skip bookings without delivery address
        if (!booking.deliveryAddress) continue;
        
        const fullAddress = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
        const position = await geocodeAddress(fullAddress);
        
        if (position) {
          geocodedMarkers.push({ booking, position });
        }
      }
      
      setMarkers(geocodedMarkers);
      
      // If we have markers, center the map on the first one
      if (geocodedMarkers.length > 0) {
        setMapCenter(geocodedMarkers[0].position);
      }
      
      setMapLoaded(true);
    };

    geocodeBookings();
  }, [isLoaded, bookings]);

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    if (markers.length > 0) {
      // Create bounds to contain all markers
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(marker => bounds.extend(marker.position));
      map.fitBounds(bounds);
    }
  }, [markers]);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading Google Maps...</span>
        </CardContent>
      </Card>
    );
  }

  if (mapLoaded && markers.length === 0) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-[500px]">
          <p className="text-muted-foreground">No valid delivery addresses found to display</p>
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
          {markers.map((marker, index) => (
            <Marker
              key={`${marker.booking.id}-${index}`}
              position={marker.position}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getStatusColor(marker.booking.status),
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: '#FFFFFF',
                scale: 10,
              }}
              onClick={() => setSelectedMarker(marker)}
            />
          ))}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 max-w-[300px]">
                <h3 className="font-bold text-lg mb-1">{selectedMarker.booking.customerName}</h3>
                <p className="text-gray-700 mb-1">
                  {selectedMarker.booking.deliveryAddress}, {selectedMarker.booking.deliveryCity}, {selectedMarker.booking.deliveryState} {selectedMarker.booking.deliveryZip}
                </p>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div>
                    <span className="text-xs text-gray-500">Delivery Date</span>
                    <p className="text-sm">{formatDate(selectedMarker.booking.deliveryDate)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Pickup Date</span>
                    <p className="text-sm">{formatDate(selectedMarker.booking.pickupDate)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{getDumpsterName(selectedMarker.booking.dumpsterId)}</span>
                  <Badge 
                    className="capitalize" 
                    variant={
                      selectedMarker.booking.status === 'scheduled' ? 'default' :
                      selectedMarker.booking.status === 'delivered' ? 'success' :
                      selectedMarker.booking.status === 'completed' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {selectedMarker.booking.status}
                  </Badge>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}