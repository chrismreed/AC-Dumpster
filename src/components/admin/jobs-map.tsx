'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, OverlayView } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Navigation,
  Phone,
  Loader2,
  Truck,
  ArrowUpFromLine,
  RefreshCw,
  Wrench,
  Calendar as CalendarIcon,
  Package,
  Clock,
  User,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Job {
  id: number;
  jobType: 'delivery' | 'pickup' | 'swap' | 'service';
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  zipCode: string;
  scheduledDate: string;
  timePreference: string | null;
  status: string;
  dumpsterId: number | null;
  serviceName: string | null;
  dumpster: {
    id: number;
    name: string;
    dimensions: string;
  } | null;
}

interface Dumpster {
  id: number;
  name: string;
  size: number;
}

interface MarkerData {
  job: Job;
  position: google.maps.LatLngLiteral;
}

interface JobsMapProps {
  jobs: Job[];
  dumpsters: Dumpster[];
}

const containerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of US

// Job action type icons (what we're doing at the location)
const jobActionConfig = {
  delivery: { icon: Truck, label: 'Delivery' },
  pickup: { icon: ArrowUpFromLine, label: 'Pickup' },
  swap: { icon: RefreshCw, label: 'Swap' },
  service: { icon: Wrench, label: 'Service' },
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: '#f59e0b', bgColor: '#fef3c7', label: 'Pending' },
  scheduled: { color: '#3b82f6', bgColor: '#dbeafe', label: 'Scheduled' },
  in_progress: { color: '#f97316', bgColor: '#ffedd5', label: 'In Progress' },
  completed: { color: '#22c55e', bgColor: '#dcfce7', label: 'Completed' },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2', label: 'Cancelled' },
};

export function JobsMap({ jobs, dumpsters }: JobsMapProps) {
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

  const getDarkerColor = (color: string) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const darkerR = Math.floor(r * 0.6);
    const darkerG = Math.floor(g * 0.6);
    const darkerB = Math.floor(b * 0.6);

    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  const getDumpsterName = (dumpsterId: number | null) => {
    if (!dumpsterId) return '';
    const dumpster = dumpsters.find((d) => d.id === dumpsterId);
    return dumpster ? dumpster.name.replace('Yard Dumpster', 'yd') : `${dumpsterId}yd`;
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status]?.color || '#6b7280';
  };

  const getJobActionIcon = (jobType: string) => {
    return jobActionConfig[jobType as keyof typeof jobActionConfig]?.icon || Package;
  };

  const getJobActionLabel = (jobType: string) => {
    return jobActionConfig[jobType as keyof typeof jobActionConfig]?.label || jobType;
  };

  const getServiceLabel = (job: Job) => {
    // If there's a service name, use it; otherwise use the job action type
    if (job.serviceName) {
      return job.serviceName;
    }
    return getJobActionLabel(job.jobType);
  };

  const geocodeAddress = useCallback(
    async (address: string): Promise<google.maps.LatLngLiteral | null> => {
      if (!isLoaded || !window.google) {
        return null;
      }

      return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
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

  // Geocode jobs and create markers
  useEffect(() => {
    if (!isLoaded || !jobs.length) {
      setMarkers([]);
      return;
    }

    let isCancelled = false;

    const geocodeJobs = async () => {
      const filteredJobs =
        statusFilter === 'all' ? jobs : jobs.filter((j) => j.status === statusFilter);

      const markerPromises = filteredJobs.map(async (job) => {
        const address = `${job.address}, ${job.city}, ${job.zipCode}`;
        const position = await geocodeAddress(address);

        if (position) {
          return { job, position };
        }
        return null;
      });

      const resolvedMarkers = (await Promise.all(markerPromises)).filter(
        Boolean
      ) as MarkerData[];

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
            google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
              const currentZoom = map.getZoom() || 10;
              if (currentZoom > 15) map.setZoom(15);
            });
          } else {
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

    geocodeJobs();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, jobs, statusFilter, geocodeAddress, map]);

  // Create custom markers
  useEffect(() => {
    if (!map || !markers.length) return;

    // Clear existing markers
    customMarkersRef.current.forEach((marker) => marker.setMap(null));
    customMarkersRef.current = [];

    const newMarkers = markers.map(({ job, position }) => {
      // Use status color for the marker
      const color = getStatusColor(job.status);
      const darkerColor = getDarkerColor(color);

      // Show dumpster size if there's a dumpster, otherwise show job action letter
      const labelText = job.dumpsterId
        ? getDumpsterName(job.dumpsterId).replace('yd', '').trim()
        : (job.jobType === 'service' ? 'SVC' : job.jobType.charAt(0).toUpperCase());

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

      const serviceLabel = getServiceLabel(job);
      const marker = new google.maps.Marker({
        position,
        map,
        title: `${serviceLabel}: ${job.customerName}`,
        icon: pinMarker,
        label: {
          text: labelText,
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        zIndex: 10000,
      });

      marker.addListener('click', () => {
        setSelectedMarker({ job, position });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActionBadge = (job: Job) => {
    const Icon = getJobActionIcon(job.jobType);
    const label = getJobActionLabel(job.jobType);
    const statusColor = getStatusColor(job.status);

    return (
      <Badge
        variant="outline"
        className="border"
        style={{
          borderColor: statusColor,
          color: statusColor,
        }}
      >
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getServiceBadge = (job: Job) => {
    if (!job.serviceName) return null;

    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        {job.serviceName}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { color: '#6b7280', bgColor: '#f3f4f6', label: status };

    return (
      <Badge
        style={{
          backgroundColor: config.color,
          color: '#ffffff',
        }}
      >
        {config.label}
      </Badge>
    );
  };

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
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500">
            {markers.length} location{markers.length !== 1 ? 's' : ''}
          </div>

          {/* Legend - shows status colors */}
          <div className="ml-auto flex items-center gap-3 text-xs flex-wrap">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.label}</span>
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
                maxWidth: 350,
              }}
            >
              <div className="p-2 min-w-[280px]">
                {/* Status and Action badges */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {getStatusBadge(selectedMarker.job.status)}
                  {getActionBadge(selectedMarker.job)}
                </div>

                {/* Service name if different from action */}
                {selectedMarker.job.serviceName && (
                  <div className="text-sm text-gray-600 mb-2">
                    {selectedMarker.job.serviceName}
                  </div>
                )}

                {/* Customer name */}
                <div className="font-bold text-base mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  {selectedMarker.job.customerName}
                </div>

                <div className="space-y-2 text-sm mb-3">
                  {/* Scheduled date and time */}
                  <div className="flex items-start gap-2 text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span>{formatDate(selectedMarker.job.scheduledDate)}</span>
                      {selectedMarker.job.timePreference && (
                        <span className="text-gray-500 text-xs block">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {selectedMarker.job.timePreference}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      {selectedMarker.job.address}
                      <br />
                      {selectedMarker.job.city}, {selectedMarker.job.zipCode}
                    </div>
                  </div>

                  {/* Dumpster info if applicable */}
                  {selectedMarker.job.dumpster && (
                    <div className="flex items-start gap-2 text-gray-700">
                      <Package className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{selectedMarker.job.dumpster.name}</span>
                        {selectedMarker.job.dumpster.dimensions && (
                          <span className="text-gray-500 text-xs block">
                            {selectedMarker.job.dumpster.dimensions}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${selectedMarker.job.customerPhone}`)}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                  <Button
                    className="bg-[#f7c948] hover:bg-[#e6b83d] text-black"
                    size="sm"
                    onClick={() => {
                      const address = `${selectedMarker.job.address}, ${selectedMarker.job.city}, ${selectedMarker.job.zipCode}`;
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
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
