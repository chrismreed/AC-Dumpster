'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Booking {
  id: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZipCode: string;
  deliveryDate: string;
  status: string;
  totalPrice: number;
  dumpsterId: number;
}

interface Dumpster {
  id: number;
  name: string;
}

interface MarkerData {
  booking: Booking;
  position: google.maps.LatLngLiteral;
}

interface DeliveryMapProps {
  bookings: Booking[];
  dumpsters: Dumpster[];
  dateFilter?: 'today' | 'tomorrow' | 'week' | 'all';
}

const containerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of US

export function DeliveryMap({ bookings, dumpsters, dateFilter = 'today' }: DeliveryMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(4);
  const [statusFilter, setStatusFilter] = useState('all');
  const customMarkersRef = useRef<google.maps.Marker[]>([]);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      delivered: '#3b82f6',
      picked_up: '#8b5cf6',
      complete: '#059669',
      cancelled: '#ef4444',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getDarkerColor = (color: string) => {
    // Convert hex to RGB, darken by 40%, convert back to hex
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const darkerR = Math.floor(r * 0.6);
    const darkerG = Math.floor(g * 0.6);
    const darkerB = Math.floor(b * 0.6);

    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  const getDumpsterName = (dumpsterId: number) => {
    const dumpster = dumpsters.find((d) => d.id === dumpsterId);
    return dumpster ? dumpster.name.replace('Yard Dumpster', 'yd') : `${dumpsterId}yd`;
  };

  const geocodeAddress = useCallback(
    async (address: string): Promise<google.maps.LatLngLiteral | null> => {
      if (!isLoaded || !window.google) {
        console.log('Maps not loaded or no google object');
        return null;
      }

      return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            console.log('Geocoded:', address, '→', location.lat(), location.lng());
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            console.warn('Geocoding failed for:', address, 'Status:', status);
            resolve(null);
          }
        });
      });
    },
    [isLoaded]
  );

  const filterBookingsByDate = useCallback((bookings: Booking[]) => {
    if (dateFilter === 'all') return bookings;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings.filter((booking) => {
      const deliveryDate = new Date(booking.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case 'today':
          return deliveryDate.getTime() === today.getTime();
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          return deliveryDate.getTime() === tomorrow.getTime();
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(today.getDate() + 7);
          return deliveryDate >= today && deliveryDate <= weekEnd;
        default:
          return true;
      }
    });
  }, [dateFilter]);

  // Geocode bookings and create markers
  useEffect(() => {
    if (!isLoaded || !bookings.length) {
      setMarkers([]);
      return;
    }

    let isCancelled = false;

    const geocodeBookings = async () => {
      const filteredBookings = filterBookingsByDate(bookings);
      const statusFilteredBookings =
        statusFilter === 'all'
          ? filteredBookings
          : filteredBookings.filter((b) => b.status === statusFilter);

      console.log('Geocoding', statusFilteredBookings.length, 'bookings...');

      const markerPromises = statusFilteredBookings.map(async (booking) => {
        const address = `${booking.deliveryAddress}, ${booking.deliveryCity}, ${booking.deliveryZipCode}`;
        const position = await geocodeAddress(address);

        if (position) {
          return { booking, position };
        }
        return null;
      });

      const resolvedMarkers = (await Promise.all(markerPromises)).filter(
        Boolean
      ) as MarkerData[];

      console.log('Created', resolvedMarkers.length, 'markers from', statusFilteredBookings.length, 'bookings');

      if (!isCancelled) {
        setMarkers(resolvedMarkers);

        // Calculate center and zoom
        if (resolvedMarkers.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          resolvedMarkers.forEach(({ position }) => bounds.extend(position));

          const center = bounds.getCenter();
          setCenter({ lat: center.lat(), lng: center.lng() });

          if (map) {
            map.fitBounds(bounds);
            const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
              const currentZoom = map.getZoom() || 10;
              if (currentZoom > 15) map.setZoom(15);
            });
          } else {
            // Estimate zoom based on bounds
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const latDiff = Math.abs(ne.lat() - sw.lat());
            const lngDiff = Math.abs(ne.lng() - sw.lng());
            const maxDiff = Math.max(latDiff, lngDiff);

            let estimatedZoom = 10;
            if (maxDiff < 0.01) estimatedZoom = 15;
            else if (maxDiff < 0.05) estimatedZoom = 13;
            else if (maxDiff < 0.1) estimatedZoom = 11;
            else if (maxDiff < 0.5) estimatedZoom = 9;
            else if (maxDiff < 1) estimatedZoom = 8;
            else estimatedZoom = 7;

            setZoom(estimatedZoom);
          }
        }
      }
    };

    geocodeBookings();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, bookings, dateFilter, statusFilter, geocodeAddress, filterBookingsByDate, map]);

  // Create custom markers
  useEffect(() => {
    if (!map || !markers.length) return;

    // Clear existing markers
    customMarkersRef.current.forEach((marker) => marker.setMap(null));
    customMarkersRef.current = [];

    const newMarkers = markers.map(({ booking, position }) => {
      const color = getStatusColor(booking.status);
      const darkerColor = getDarkerColor(color);
      const size = getDumpsterName(booking.dumpsterId).replace('yd', '').replace(' ', '');

      // Create a pin-style marker (teardrop with point at bottom)
      const pinMarker = {
        path: 'M12 0C7.31 0 3.5 3.81 3.5 8.5c0 6.56 8.5 15.5 8.5 15.5s8.5-8.94 8.5-15.5C20.5 3.81 16.69 0 12 0z',
        fillColor: color,
        fillOpacity: 1,
        strokeColor: darkerColor,
        strokeWeight: 3,
        scale: 1.6,
        anchor: new google.maps.Point(12, 24),
        labelOrigin: new google.maps.Point(12, 10),
      };

      const marker = new google.maps.Marker({
        position,
        map,
        title: `${booking.customerName} - ${getDumpsterName(booking.dumpsterId)}`,
        icon: pinMarker,
        label: {
          text: size,
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 'bold',
        },
        zIndex: 10000,
      });

      marker.addListener('click', () => {
        setSelectedMarker({ booking, position });
      });

      return marker;
    });

    customMarkersRef.current = newMarkers;

    return () => {
      customMarkersRef.current.forEach((marker) => marker.setMap(null));
      customMarkersRef.current = [];
    };
  }, [map, markers]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p>Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Filter Controls */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500">
            {markers.length} location{markers.length !== 1 ? 's' : ''}
          </div>

          {/* Legend */}
          <div className="ml-auto flex items-center gap-3 text-xs">
            {['confirmed', 'pending', 'delivered', 'picked_up'].map((status) => (
              <div key={status} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="capitalize">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          options={{
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
              options={{
                maxWidth: 320,
              }}
            >
              <div className="p-2">
                <div className="font-bold text-base mb-1">
                  {selectedMarker.booking.customerName}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {getDumpsterName(selectedMarker.booking.dumpsterId)}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  {selectedMarker.booking.deliveryAddress}
                  <br />
                  {selectedMarker.booking.deliveryCity}, {selectedMarker.booking.deliveryZipCode}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    className="capitalize"
                    style={{
                      backgroundColor: getStatusColor(selectedMarker.booking.status),
                      color: '#ffffff',
                    }}
                  >
                    {selectedMarker.booking.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm font-semibold">
                    ${(selectedMarker.booking.totalPrice / 100).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`tel:${selectedMarker.booking.customerPhone}`)
                    }
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                  <Button
                    className="bg-[#f7c948] hover:bg-[#e6b83d] text-black"
                    size="sm"
                    onClick={() => {
                      const address = `${selectedMarker.booking.deliveryAddress}, ${selectedMarker.booking.deliveryCity}, ${selectedMarker.booking.deliveryZipCode}`;
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          address
                        )}`,
                        '_blank'
                      );
                    }}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Navigate
                  </Button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}
