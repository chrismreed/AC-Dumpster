import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";
import {
  GoogleMap,
  useJsApiLoader,
  DrawingManager
} from "@react-google-maps/api";

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

// Required libraries for Google Maps
const libraries = ["drawing"] as const;

export function GeofenceEditor({ zone, onSave, onCancel }: GeofenceEditorProps) {
  const { toast } = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  
  const [center, setCenter] = useState(
    zone?.centerLat && zone?.centerLng
      ? { lat: zone.centerLat, lng: zone.centerLng }
      : DEFAULT_CENTER
  );
  const [polygonPath, setPolygonPath] = useState<string | null>(zone?.polygonPath || null);
  const [zoom, setZoom] = useState(zone?.centerLat && zone?.centerLng ? 10 : DEFAULT_ZOOM);
  
  // Load Google Maps API using the hook
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places', 'drawing'],
  });
  
  // Initialize map
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    
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
          const paths = polygon.getPath().getArray().map((latLng: google.maps.LatLng) => ({
            lat: latLng.lat(),
            lng: latLng.lng()
          }));
          setPolygonPath(JSON.stringify(paths));
        });
        
        google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
          const paths = polygon.getPath().getArray().map((latLng: google.maps.LatLng) => ({
            lat: latLng.lat(),
            lng: latLng.lng()
          }));
          setPolygonPath(JSON.stringify(paths));
        });
      } catch (error) {
        console.error("Error parsing polygon path:", error);
        toast({
          title: "Error",
          description: "Could not load the existing geofence boundary.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Setup drawing manager
  const onDrawingManagerLoad = (drawingManager: google.maps.drawing.DrawingManager) => {
    drawingManagerRef.current = drawingManager;
    
    // Add listener for when polygon is complete
    google.maps.event.addListener(drawingManager, "polygoncomplete", (polygon: google.maps.Polygon) => {
      // Clear any existing polygon
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      
      // Store the new polygon
      polygonRef.current = polygon;
      
      // Make the polygon editable
      polygon.setEditable(true);
      
      // Capture polygon path
      const paths = polygon.getPath().getArray().map((latLng: google.maps.LatLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng()
      }));
      setPolygonPath(JSON.stringify(paths));
      
      // Turn off drawing mode
      drawingManager.setDrawingMode(null);
      
      // Add listeners for editing the polygon
      google.maps.event.addListener(polygon.getPath(), "set_at", () => {
        const newPaths = polygon.getPath().getArray().map((latLng: google.maps.LatLng) => ({
          lat: latLng.lat(),
          lng: latLng.lng()
        }));
        setPolygonPath(JSON.stringify(newPaths));
      });
      
      google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
        const newPaths = polygon.getPath().getArray().map((latLng: google.maps.LatLng) => ({
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
  };
  
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
      console.error("Error calculating polygon center:", error);
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
      
      {loadError && (
        <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
          Error loading Google Maps: {loadError.message}
        </div>
      )}
      
      {!isLoaded ? (
        <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={zoom}
              onLoad={onMapLoad}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
              }}
            >
              <DrawingManager
                onLoad={onDrawingManagerLoad}
                options={{
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
                }}
              />
            </GoogleMap>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between space-x-3 pt-2 border-t">
        <Button
          onClick={clearPolygon}
          variant="outline"
          disabled={!polygonPath || !isLoaded}
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
            disabled={!polygonPath || !isLoaded}
            size="sm"
          >
            Save Geofence
          </Button>
        </div>
      </div>
    </div>
  );
}