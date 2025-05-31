import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Map, Edit, Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GeofenceEditor } from "./geofence-editor";
import {
  GoogleMap,
  useJsApiLoader,
} from "@react-google-maps/api";

// Default map center coordinates (USA center)
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 5;

// Map container styles
const mapContainerStyle = {
  width: "100%",
  height: "450px",
};

interface ZonesMapProps {
  zones: ServiceZone[];
  onSaveZone: (id: number, data: any) => void;
}

export function ZonesMap({ zones, onSaveZone }: ZonesMapProps) {
  const { toast } = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef(new Map<number, google.maps.Polygon>());
  
  const [editingZone, setEditingZone] = useState<ServiceZone | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places', 'drawing'],
  });
  
  // Draw all zone polygons on the map
  const drawZones = () => {
    if (!mapRef.current) return;
    
    // Clear existing polygons
    polygonsRef.current.forEach(polygon => {
      polygon.setMap(null);
    });
    polygonsRef.current.clear();
    
    // Create bounds to fit all zones
    const bounds = new google.maps.LatLngBounds();
    let hasValidBounds = false;
    
    // Draw each zone
    zones.forEach(zone => {
      if (!zone.polygonPath) return;
      
      try {
        const path = JSON.parse(zone.polygonPath);
        const polygon = new google.maps.Polygon({
          paths: path,
          strokeColor: "#F7C948",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#F7C948",
          fillOpacity: 0.35,
          editable: false,
        });
        
        // Add zone info to polygon
        polygon.set("zoneId", zone.id);
        polygon.set("zoneName", zone.name);
        
        // Add click listener to show info
        google.maps.event.addListener(polygon, "click", () => {
          toast({
            title: zone.name,
            description: "Click Edit to modify this service area",
          });
        });
        
        // Add to map
        polygon.setMap(mapRef.current);
        polygonsRef.current.set(zone.id, polygon);
        
        // Extend bounds to include this zone
        if (path && path.length > 0) {
          path.forEach((point: {lat: number, lng: number}) => {
            bounds.extend(new google.maps.LatLng(point.lat, point.lng));
            hasValidBounds = true;
          });
        }
      } catch (error) {
        console.error(`Error drawing zone ${zone.id}:`, error);
      }
    });
    
    // Fit map to all zones
    if (hasValidBounds) {
      mapRef.current.fitBounds(bounds);
    }
  };
  
  // Initialize map
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    drawZones();
  };
  
  // Update polygons when zones change
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      drawZones();
    }
  }, [zones, isLoaded]);
  
  // Handle save from editor
  const handleSaveGeofence = (data: any) => {
    if (!editingZone) return;
    
    onSaveZone(editingZone.id, data);
    setIsEditorOpen(false);
    setEditingZone(null);
    
    toast({
      title: "Zone Updated",
      description: `Service area for ${editingZone.name} has been updated.`,
    });
  };
  
  // Open editor for a zone
  const openEditorForZone = (zone: ServiceZone) => {
    setEditingZone(zone);
    setIsEditorOpen(true);
  };
  
  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Map className="h-5 w-5" /> Service Area Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadError && (
          <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm mb-4">
            Error loading Google Maps: {loadError.message}
          </div>
        )}
        
        {!isLoaded ? (
          <div className="flex items-center justify-center h-[450px] bg-muted rounded-lg">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex gap-2 flex-wrap">
              {zones.map(zone => (
                <Button
                  key={zone.id}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => openEditorForZone(zone)}
                >
                  <Edit className="h-3.5 w-3.5" /> {zone.name}
                </Button>
              ))}
            </div>
            
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={DEFAULT_CENTER}
                  zoom={DEFAULT_ZOOM}
                  onLoad={onMapLoad}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: true,
                    fullscreenControl: true,
                  }}
                />
              </CardContent>
            </Card>
            
            <div className="mt-3 text-xs text-muted-foreground">
              Click on a service area on the map to see its details, or use the buttons above to edit each zone.
            </div>
          </>
        )}
      </CardContent>
      
      {/* Zone Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit {editingZone?.name} Service Area</DialogTitle>
            <DialogDescription>
              Draw custom boundaries on the map to define your service area
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-1">
            {editingZone && (
              <GeofenceEditor
                zone={editingZone}
                onSave={handleSaveGeofence}
                onCancel={() => setIsEditorOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}