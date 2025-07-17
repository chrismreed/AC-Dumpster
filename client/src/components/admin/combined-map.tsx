import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Map, Edit, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GeofenceEditor } from "./geofence-editor";

// Default map center coordinates (USA center)
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 5;

// Map container styles
const mapContainerStyle = {
  width: "100%",
  height: "450px",
};

interface CombinedMapProps {
  zones: ServiceZone[];
  onZoneUpdate: (zoneId: number, data: any) => void;
}

export function CombinedMap({ zones, onZoneUpdate }: CombinedMapProps) {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<Map<number, google.maps.Polygon>>(new Map());
  
  const [editingZone, setEditingZone] = useState<ServiceZone | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Initialize map
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }
      
      // Create script element for Google Maps API
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        initializeMap();
      };
      
      script.onerror = () => {
        setMapError('Failed to load Google Maps API');
        setMapLoading(false);
      };
      
      document.head.appendChild(script);
    };
    
    // Initialize the map
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      try {
        // Create the map
        const map = new google.maps.Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        });
        
        googleMapRef.current = map;
        setMapLoaded(true);
        setMapLoading(false);
        
        // Draw zones if available
        if (zones && zones.length > 0) {
          drawZones();
        }
      } catch (error: any) {
        
        setMapError(`Map initialization error: ${error.message}`);
        setMapLoading(false);
      }
    };
    
    loadGoogleMapsScript();
    
    // Cleanup
    return () => {
      if (polygonsRef.current) {
        polygonsRef.current.forEach(polygon => {
          polygon.setMap(null);
        });
        polygonsRef.current.clear();
      }
    };
  }, []);
  
  // Draw all zone polygons on the map
  const drawZones = () => {
    if (!googleMapRef.current || !window.google) return;
    
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
        
        // Skip if empty path
        if (!path || path.length < 3) return;
        
        // Create polygon
        const polygon = new google.maps.Polygon({
          paths: path,
          strokeColor: getRandomColor(zone.id),
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: getRandomColor(zone.id),
          fillOpacity: 0.35,
        });
        
        // Add zone info to polygon
        polygon.set("zoneId", zone.id);
        polygon.set("zoneName", zone.name);
        
        // Add click listener for editing
        google.maps.event.addListener(polygon, "click", () => {
          const clickedZone = zones.find(z => z.id === zone.id);
          if (clickedZone) {
            toast({
              title: clickedZone.name,
              description: "Click edit button to modify this zone",
            });
            setEditingZone(clickedZone);
          }
        });
        
        // Add to map
        polygon.setMap(googleMapRef.current);
        polygonsRef.current.set(zone.id, polygon);
        
        // Extend bounds to include this zone
        path.forEach((point: {lat: number, lng: number}) => {
          bounds.extend(new google.maps.LatLng(point.lat, point.lng));
          hasValidBounds = true;
        });
      } catch (error) {
        
      }
    });
    
    // Fit map to all zones if we have valid bounds
    if (hasValidBounds && googleMapRef.current) {
      googleMapRef.current.fitBounds(bounds);
    }
  };
  
  // Generate a consistent color based on zone ID
  const getRandomColor = (id: number) => {
    const colors = [
      "#F7C948", // Primary yellow
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#98D560", // Green
      "#A177FF", // Purple
      "#FF9F1C", // Orange
      "#F15BB5", // Pink
    ];
    
    return colors[id % colors.length];
  };
  
  // Update zones when they change
  useEffect(() => {
    if (mapLoaded && googleMapRef.current) {
      drawZones();
    }
  }, [zones, mapLoaded]);
  
  // Handle save from editor
  const handleSaveGeofence = (data: any) => {
    if (!editingZone) return;
    
    onZoneUpdate(editingZone.id, data);
    setIsEditorOpen(false);
    
    toast({
      title: "Zone Updated",
      description: `Service area for ${editingZone.name} has been updated.`,
    });
  };
  
  return (
    <Card className="shadow-md border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Map className="h-5 w-5" /> Service Area Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mapError && (
          <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm mb-4">
            {mapError}
          </div>
        )}
        
        {mapLoading ? (
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
                  onClick={() => {
                    setEditingZone(zone);
                    setIsEditorOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> {zone.name}
                </Button>
              ))}
            </div>
            
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <div ref={mapRef} style={mapContainerStyle}></div>
              </CardContent>
            </Card>
            
            <div className="mt-3 text-xs text-muted-foreground">
              Click on a zone to select it, then use the edit button to modify its boundaries.
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