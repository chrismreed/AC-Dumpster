import React from 'react';
import { AdminLayout } from '@/components/ui/admin-layout';
import { ServiceZoneMap } from '@/components/admin/maps/service-zone-map';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ServiceZone } from '@shared/schema';
import { Globe, Map, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'wouter';

export default function ZoneMapPage() {
  const { toast } = useToast();
  
  // Fetch service zones
  const { data: zones, isLoading, error } = useQuery<ServiceZone[]>({
    queryKey: ['/api/zones'],
  });

  // Calculate stats
  const geofenceZones = zones?.filter(zone => zone.useGeofencing) || [];
  const zipCodeZones = zones?.filter(zone => !zone.useGeofencing) || [];
  
  // Check if Google Maps API key is available
  const hasApiKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  return (
    <AdminLayout>
      <div className="h-full p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Service Zone Map</h1>
            <p className="text-muted-foreground">
              Visualize your service zones with interactive geofencing
            </p>
          </div>
          <Link href="/admin/zones">
            <Button variant="outline" className="shrink-0">
              <Map className="mr-2 h-4 w-4" />
              Manage Zones
            </Button>
          </Link>
        </div>

        {!hasApiKey && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Maps API Key Missing</AlertTitle>
            <AlertDescription>
              Please add your Google Maps API key to the environment variables to enable the map visualization.
            </AlertDescription>
          </Alert>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load service zones. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Total Zones</h3>
                </div>
                <p className="text-2xl font-bold">{zones?.length || 0}</p>
              </div>
              
              <div className="bg-card rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Map className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">Geofence Zones</h3>
                </div>
                <p className="text-2xl font-bold">{geofenceZones.length}</p>
              </div>
              
              <div className="bg-card rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Map className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">ZIP Code Zones</h3>
                </div>
                <p className="text-2xl font-bold">{zipCodeZones.length}</p>
              </div>
            </div>

            {/* Instructions for user */}
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="font-medium">How to use the map:</p>
              <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                <li>Hover over a zone to see its details</li>
                <li>Click on a zone to select it</li>
                <li>Selected zones can be edited by dragging the circle's edges</li>
                <li>Colors represent fee multipliers (check the legend)</li>
              </ul>
            </div>

            {/* Interactive Map */}
            {isLoading ? (
              <div className="h-96 w-full flex items-center justify-center bg-muted rounded-lg">
                <div className="animate-spin mr-2 h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>Loading service zones...</span>
              </div>
            ) : (
              <ServiceZoneMap isAdmin={true} />
            )}
            
            {(!zones || zones.length === 0) && !isLoading && (
              <div className="bg-muted rounded-lg p-6 text-center">
                <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">No Service Zones Found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any service zones yet. Create zones to visualize them on the map.
                </p>
                <Link href="/admin/zones">
                  <Button>Create Service Zone</Button>
                </Link>
              </div>
            )}
            
            {!geofenceZones.length && zones && zones.length > 0 && !isLoading && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Geofence Zones</AlertTitle>
                <AlertDescription>
                  You have service zones, but none are configured for geofencing. 
                  Enable geofencing in zone settings to visualize them on the map.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}