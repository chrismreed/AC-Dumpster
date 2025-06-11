import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/providers/google-maps-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Booking, Dumpster } from '@shared/schema';
import { MapPin } from 'lucide-react';

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

// Get badge style based on booking status to match legend colors
function getBadgeStyle(status: string): React.CSSProperties {
  const color = getMarkerColor(status);
  return {
    backgroundColor: color,
    color: 'white',
    border: 'none'
  };
}

export function DeliveryMap({ bookings, dumpsters }: DeliveryMapProps) {
  const [markers, setMarkers] = useState<Array<{ booking: Booking; position: google.maps.LatLngLiteral }>>([]);
  const [selectedMarker, setSelectedMarker] = useState<{ booking: Booking; position: google.maps.LatLngLiteral } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const customMarkersRef = useRef<google.maps.Marker[]>([]);

  const { isLoaded } = useGoogleMaps();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to update booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      return await apiRequest('PATCH', `/api/bookings/${bookingId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (bookingId: number, newStatus: string) => {
    updateStatusMutation.mutate({ bookingId, status: newStatus });
    
    // Update the selected marker to reflect the new status immediately
    if (selectedMarker && selectedMarker.booking.id === bookingId) {
      setSelectedMarker({
        ...selectedMarker,
        booking: { ...selectedMarker.booking, status: newStatus }
      });
    }
  };

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
              options={{
                maxWidth: 350,
                minWidth: 300,
              }}
            >
              <div className="p-3 w-full max-w-[320px]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base">{selectedMarker.booking.customerName}</h3>
                  <span className="text-lg font-bold">${(selectedMarker.booking.totalPrice / 100).toFixed(2)}</span>
                </div>
                <p className="text-gray-700 text-sm mb-2">
                  {selectedMarker.booking.deliveryAddress}, {selectedMarker.booking.deliveryCity}, {selectedMarker.booking.deliveryZipCode}
                </p>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs text-gray-500">
                    Delivery: {formatDate(selectedMarker.booking.deliveryDate.toString())}
                  </div>
                  <Select 
                    value={selectedMarker.booking.status} 
                    onValueChange={(value) => handleStatusChange(selectedMarker.booking.id, value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-auto h-auto p-0 border-0 focus:ring-0">
                      <SelectValue asChild>
                        <Badge 
                          style={getBadgeStyle(selectedMarker.booking.status)}
                          className="cursor-pointer hover:opacity-80"
                        >
                          {selectedMarker.booking.status === 'picked_up' ? 'Picked Up' : selectedMarker.booking.status.charAt(0).toUpperCase() + selectedMarker.booking.status.slice(1)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={() => {
                    const address = `${selectedMarker.booking.deliveryAddress}, ${selectedMarker.booking.deliveryCity}, ${selectedMarker.booking.deliveryZipCode}`;
                    const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(address)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black w-full h-8 text-sm"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Navigate to Address
                </Button>
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