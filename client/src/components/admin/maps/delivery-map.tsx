import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GoogleMap, 
  Marker, 
  InfoWindow, 
  useJsApiLoader,
  MarkerClusterer 
} from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Package, Loader2 } from 'lucide-react';
import { Booking, Dumpster } from '@shared/schema';
import { formatDate } from '@/lib/utils';

interface DeliveryMapProps {
  bookings: Booking[];
  dumpsters: Dumpster[];
}

// Define map container style
const containerStyle = {
  width: '100%',
  height: '700px'
};

// Geocode an address to get coordinates
async function geocodeAddress(address: string): Promise<google.maps.LatLngLiteral | null> {
  try {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ address });
    
    if (result.results && result.results.length > 0) {
      const location = result.results[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng()
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
      return '#3b82f6'; // blue
    case 'delivered':
      return '#10b981'; // green
    case 'completed':
      return '#8b5cf6'; // purple
    case 'cancelled':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

export function DeliveryMap({ bookings, dumpsters }: DeliveryMapProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [markers, setMarkers] = useState<Array<{ booking: Booking; position: google.maps.LatLngLiteral }>>([]);
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  // Get dumpster name from dumpster ID
  const getDumpsterName = useCallback((id: number) => {
    return dumpsters?.find(d => d.id === id)?.name || `Dumpster #${id}`;
  }, [dumpsters]);

  // Generate markers for each booking with valid coordinates
  useEffect(() => {
    if (!isLoaded || !bookings || bookings.length === 0) return;

    const generateMarkers = async () => {
      setIsLoading(true);
      
      const markersWithCoords = [];
      const validAddresses = [];

      for (const booking of bookings) {
        const fullAddress = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
        const coords = await geocodeAddress(fullAddress);
        
        if (coords) {
          markersWithCoords.push({
            booking,
            position: coords
          });
          validAddresses.push(coords);
        }
      }

      setMarkers(markersWithCoords);
      
      // If we have at least one valid address, center the map on the average location
      if (validAddresses.length > 0) {
        const avgLat = validAddresses.reduce((sum, loc) => sum + loc.lat, 0) / validAddresses.length;
        const avgLng = validAddresses.reduce((sum, loc) => sum + loc.lng, 0) / validAddresses.length;
        setCenter({ lat: avgLat, lng: avgLng });
      }
      
      setIsLoading(false);
    };

    generateMarkers();
  }, [bookings, isLoaded]);

  // Map options
  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    clickableIcons: false,
    scrollwheel: true,
    streetViewControl: true,
    zoomControl: true,
    mapTypeControl: true,
  }), []);

  // Handle loading and error states
  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Locations Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-96 flex-col">
            <MapPin className="h-12 w-12 text-red-500 mb-4" />
            <p>Error loading Google Maps: {loadError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Locations Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          Delivery Locations Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            options={mapOptions}
          >
            {markers.length > 0 && (
              <MarkerClusterer>
                {(clusterer) => (
                  <div>
                    {markers.map((marker, index) => (
                      <Marker
                        key={`marker-${marker.booking.id}-${index}`}
                        position={marker.position}
                        title={`${marker.booking.customerName}: ${marker.booking.deliveryAddress}`}
                        clusterer={clusterer}
                        onClick={() => setSelectedBooking(marker.booking)}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          fillColor: getStatusColor(marker.booking.status),
                          fillOpacity: 0.8,
                          strokeWeight: 1,
                          strokeColor: '#ffffff',
                          scale: 10,
                        }}
                      />
                    ))}
                  </div>
                )}
              </MarkerClusterer>
            )}

            {selectedBooking && (
              <InfoWindow
                position={markers.find(m => m.booking.id === selectedBooking.id)?.position as google.maps.LatLngLiteral}
                onCloseClick={() => setSelectedBooking(null)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="font-medium text-lg mb-2">{selectedBooking.customerName}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Address:</strong> {selectedBooking.deliveryAddress}, {selectedBooking.deliveryCity}, {selectedBooking.deliveryZipCode}</p>
                    <p><strong>Dumpster:</strong> {getDumpsterName(selectedBooking.dumpsterId)}</p>
                    <p><strong>Delivery Date:</strong> {formatDate(selectedBooking.deliveryDate)}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{selectedBooking.status}</span></p>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </CardContent>
    </Card>
  );
}