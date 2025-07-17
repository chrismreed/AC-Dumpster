import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";

// Default map center coordinates (USA center)
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 5;

// Map container styles
const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

interface GeofenceEditorProps {
  zone?: ServiceZone;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function GeofenceEditor({ zone, onSave, onCancel }: GeofenceEditorProps) {
  const { toast } = useToast();
  const mapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  
  const [center] = useState(
    zone?.centerLat && zone?.centerLng
      ? { lat: zone.centerLat, lng: zone.centerLng }
      : DEFAULT_CENTER
  );
  const [polygonPath, setPolygonPath] = useState<string | null>(zone?.polygonPath || null);
  const [zoom] = useState(zone?.centerLat && zone?.centerLng ? 10 : DEFAULT_ZOOM);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Initialize map when component mounts
  useState(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Function to load Google Maps API and initialize map
    const initMap = () => {
      try {
        if (typeof window === 'undefined' || !window.google || !window.google.maps) {
          // Load Google Maps API script
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=drawing`;
          script.async = true;
          script.defer = true;
          
          script.onload = () => {
            try {
              createMap();
              setMapLoaded(true);
              setMapLoading(false);
            } catch (error: any) {
              setMapError(`Error initializing map: ${error.message}`);
              setMapLoading(false);
            }
          };
          
          script.onerror = () => {
            setMapError("Failed to load Google Maps API");
            setMapLoading(false);
          };
          
          document.head.appendChild(script);
        } else {
          // Google Maps API already loaded
          createMap();
          setMapLoaded(true);
          setMapLoading(false);
        }
      } catch (error: any) {
        setMapError(`Error loading map: ${error.message}`);
        setMapLoading(false);
      }
    };
    
    // Function to create the map and drawing manager
    const createMap = () => {
      const mapElement = document.getElementById("map-canvas");
      if (!mapElement) return;
      
      // Create the map
      const map = new google.maps.Map(mapElement, {
        center,
        zoom,
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
      });
      
      mapRef.current = map;
      
      // Create drawing manager
      const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          fillColor: "#F7C948",
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: "#F7C948",
          editable: true,
          draggable: false,
        },
      });
      
      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;
      
      // Add listener for when polygon is complete
      google.maps.event.addListener(drawingManager, "polygoncomplete", (polygon: any) => {
        // Clear any existing polygon
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
        }
        
        // Store the new polygon
        polygonRef.current = polygon;
        
        // Make the polygon editable
        polygon.setEditable(true);
        
        // Capture polygon path
        const paths = polygon.getPath().getArray().map((latLng: any) => ({
          lat: latLng.lat(),
          lng: latLng.lng()
        }));
        setPolygonPath(JSON.stringify(paths));
        
        // Turn off drawing mode
        drawingManager.setDrawingMode(null);
        
        // Add listeners for editing the polygon
        google.maps.event.addListener(polygon.getPath(), "set_at", () => {
          const newPaths = polygon.getPath().getArray().map((latLng: any) => ({
            lat: latLng.lat(),
            lng: latLng.lng()
          }));
          setPolygonPath(JSON.stringify(newPaths));
        });
        
        google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
          const newPaths = polygon.getPath().getArray().map((latLng: any) => ({
            lat: latLng.lat(),
            lng: latLng.lng()
          }));
          setPolygonPath(JSON.stringify(newPaths));
        });
        
        // Success message
        toast({
          title: "Boundary Created",
          description: "Your service area boundary has been created. You can edit it by dragging the points.",
        });
      });
      
      // If we have a polygon path, draw it on the map
      if (polygonPath) {
        try {
          const path = JSON.parse(polygonPath);
          const polygon = new google.maps.Polygon({
            paths: path,
            strokeColor: "#F7C948",
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: "#F7C948",
            fillOpacity: 0.35,
            editable: true,
          });
          
          polygon.setMap(map);
          polygonRef.current = polygon;
          
          // Add listener to capture path changes when polygon is edited
          google.maps.event.addListener(polygon.getPath(), "set_at", () => {
            const paths = polygon.getPath().getArray().map((latLng: any) => ({
              lat: latLng.lat(),
              lng: latLng.lng()
            }));
            setPolygonPath(JSON.stringify(paths));
          });
          
          google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
            const paths = polygon.getPath().getArray().map((latLng: any) => ({
              lat: latLng.lat(),
              lng: latLng.lng()
            }));
            setPolygonPath(JSON.stringify(paths));
          });
          
          // Set bounds based on polygon
          const bounds = new google.maps.LatLngBounds();
          path.forEach((point: {lat: number, lng: number}) => {
            bounds.extend(new google.maps.LatLng(point.lat, point.lng));
          });
          map.fitBounds(bounds);
        } catch (error) {
          
          toast({
            title: "Error",
            description: "Could not load the existing geofence boundary.",
            variant: "destructive",
          });
        }
      }
    };
    
    // Initialize map with a short delay to ensure DOM is ready
    timeoutId = setTimeout(initMap, 100);
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Clear the current polygon
  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setPolygonPath(null);
  };
  
  // Save the geofence
  const handleSave = () => {
    if (!polygonPath) {
      toast({
        title: "No Boundary Drawn",
        description: "Please draw a boundary on the map before saving.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate center point of polygon for reference
    try {
      const path = JSON.parse(polygonPath);
      const bounds = new google.maps.LatLngBounds();
      
      path.forEach((point: {lat: number, lng: number}) => {
        bounds.extend(new google.maps.LatLng(point.lat, point.lng));
      });
      
      const center = bounds.getCenter();
      
      // Save data
      onSave({
        useGeofencing: true,
        polygonPath,
        centerLat: center.lat(),
        centerLng: center.lng(),
      });
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to save geofence. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="bg-muted rounded-lg p-2 text-xs">
        <p className="font-medium">How to draw a geofence:</p>
        <ul className="list-disc list-inside mt-0.5 text-muted-foreground text-[10px] space-y-0">
          <li>Use the polygon tool in the map to draw your boundary</li>
          <li>Click points on the map to create your service area</li>
          <li>Complete the shape by clicking the first point again</li>
          <li>Edit by dragging the points after drawing is complete</li>
        </ul>
      </div>
      
      {mapError && (
        <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
          {mapError}
        </div>
      )}
      
      {mapLoading ? (
        <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <div id="map-canvas" style={mapContainerStyle}></div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between space-x-3 pt-2 border-t">
        <Button
          onClick={clearPolygon}
          variant="outline"
          disabled={!polygonPath || !mapLoaded}
          size="sm"
          className="text-xs"
        >
          <Trash className="mr-1 h-3 w-3" /> Clear
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!polygonPath || !mapLoaded}
            size="sm"
          >
            Save Geofence
          </Button>
        </div>
      </div>
    </div>
  );
}