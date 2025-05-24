import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check, Map, Navigation, Trash } from "lucide-react";
import {
  GoogleMap,
  LoadScript,
  DrawingManager,
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

export function GeofenceEditor({ zone, onSave, onCancel }: GeofenceEditorProps) {
  const { toast } = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [polygonPath, setPolygonPath] = useState<string | null>(zone?.polygonPath || null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // We'll handle loading directly through the LoadScript component

  // Initialize map and drawing manager
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Try to center map on zone location if available
    if (zone?.centerLat && zone?.centerLng) {
      setCenter({ lat: zone.centerLat, lng: zone.centerLng });
      map.setCenter({ lat: zone.centerLat, lng: zone.centerLng });
      map.setZoom(10); // Zoom in more for a specific zone
    }
    
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
          const paths = polygon.getPath().getArray().map(latLng => ({
            lat: latLng.lat(),
            lng: latLng.lng()
          }));
          setPolygonPath(JSON.stringify(paths));
        });
        
        google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
          const paths = polygon.getPath().getArray().map(latLng => ({
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
      
      // Capture polygon path
      const paths = polygon.getPath().getArray().map((latLng: google.maps.LatLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng()
      }));
      setPolygonPath(JSON.stringify(paths));
      
      // Turn off drawing mode
      drawingManager.setDrawingMode(null);
      setIsDrawing(false);
      
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
  
  // Toggle drawing mode
  const toggleDrawing = () => {
    if (!drawingManagerRef.current) return;
    
    if (isDrawing) {
      drawingManagerRef.current.setDrawingMode(null);
      setIsDrawing(false);
    } else {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      setIsDrawing(true);
    }
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
    <div className="space-y-4">
      <div className="bg-muted rounded-lg p-4 text-sm">
        <p className="font-medium">How to draw a geofence:</p>
        <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
          <li>Click the "Draw Boundary" button to start</li>
          <li>Click on the map to create points for your boundary</li>
          <li>Complete the shape by clicking on the first point</li>
          <li>Edit the shape by dragging the points</li>
          <li>Click "Save Geofence" when you're finished</li>
        </ul>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
            libraries={["drawing"]}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={DEFAULT_ZOOM}
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
                  drawingControl: false,
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
          </LoadScript>
        </CardContent>
      </Card>
      
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={toggleDrawing}
          variant={isDrawing ? "secondary" : "default"}
        >
          {isDrawing ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Drawing Mode On
            </>
          ) : (
            <>
              <Map className="mr-2 h-4 w-4" /> Draw Boundary
            </>
          )}
        </Button>
        
        <Button
          onClick={clearPolygon}
          variant="outline"
          disabled={!polygonPath}
        >
          <Trash className="mr-2 h-4 w-4" /> Clear Boundary
        </Button>
        
        <Button
          onClick={() => {
            if (mapRef.current && zone?.centerLat && zone?.centerLng) {
              const center = {lat: zone.centerLat, lng: zone.centerLng};
              mapRef.current.setCenter(center);
              mapRef.current.setZoom(10);
            }
          }}
          variant="outline"
        >
          <Navigation className="mr-2 h-4 w-4" /> Center Map
        </Button>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!polygonPath}
        >
          Save Geofence
        </Button>
      </div>
    </div>
  );
}