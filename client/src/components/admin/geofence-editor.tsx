import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";
import {
  GoogleMap,
  DrawingManager,
  Polygon
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/providers/google-maps-provider";

// Default map center coordinates (USA center) - fallback only
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 5;

// Calculate center point from existing zones
function calculateZoneCenter(zones: ServiceZone[]): { lat: number; lng: number; zoom: number } {
  const zonesWithCoords = zones.filter(z => z.centerLat && z.centerLng);
  
  if (zonesWithCoords.length === 0) {
    return { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, zoom: DEFAULT_ZOOM };
  }
  
  if (zonesWithCoords.length === 1) {
    return { 
      lat: zonesWithCoords[0].centerLat!, 
      lng: zonesWithCoords[0].centerLng!, 
      zoom: 11 
    };
  }
  
  // Calculate bounds of all zones
  let minLat = zonesWithCoords[0].centerLat!;
  let maxLat = zonesWithCoords[0].centerLat!;
  let minLng = zonesWithCoords[0].centerLng!;
  let maxLng = zonesWithCoords[0].centerLng!;
  
  zonesWithCoords.forEach(zone => {
    minLat = Math.min(minLat, zone.centerLat!);
    maxLat = Math.max(maxLat, zone.centerLat!);
    minLng = Math.min(minLng, zone.centerLng!);
    maxLng = Math.max(maxLng, zone.centerLng!);
  });
  
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  // Calculate appropriate zoom level based on bounds
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  let zoom = 10;
  if (maxDiff > 2) zoom = 8;
  else if (maxDiff > 1) zoom = 9;
  else if (maxDiff > 0.5) zoom = 10;
  else if (maxDiff > 0.1) zoom = 11;
  else zoom = 12;
  
  return { lat: centerLat, lng: centerLng, zoom };
}

// Map container styles
const mapContainerStyle = {
  width: "100%",
  height: "350px",
};

interface GeofenceEditorProps {
  zone?: ServiceZone;
  onSave: (data: any) => void;
  onCancel: () => void;
  readOnly?: boolean;
  showAllZones?: boolean;
  allZones?: ServiceZone[];
}

// List of required libraries for Google Maps
const libraries = ["drawing"];

export function GeofenceEditor({ 
  zone, 
  onSave, 
  onCancel, 
  readOnly = false,
  showAllZones = false,
  allZones = []
}: GeofenceEditorProps) {
  const { toast } = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  
  // Calculate optimal center based on available zones
  const optimalCenter = (() => {
    if (zone?.centerLat && zone?.centerLng) {
      return { lat: zone.centerLat, lng: zone.centerLng, zoom: 10 };
    }
    return calculateZoneCenter(allZones);
  })();

  const [center, setCenter] = useState({ lat: optimalCenter.lat, lng: optimalCenter.lng });
  const [polygonPath, setPolygonPath] = useState<string | null>(zone?.polygonPath || null);
  const [zoom, setZoom] = useState(optimalCenter.zoom);
  
  // Load Google Maps API using the shared provider
  const { isLoaded, loadError } = useGoogleMaps();
  
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
          editable: !readOnly,
          zIndex: 10, // Higher zIndex to make sure it's on top of other polygons
        });
        
        polygon.setMap(map);
        polygonRef.current = polygon;
        
        // Add listener to capture path changes when polygon is edited (only if not readOnly)
        if (!readOnly) {
          // Add delete functionality - right click to remove a vertex
          google.maps.event.addListener(polygon, "rightclick", (event: any) => {
            // Check if the click is on a vertex
            if (event.vertex !== undefined) {
              // Get the path
              const path = polygon.getPath();
              // Remove the vertex
              if (path.getLength() > 3) { // Keep at least 3 points to maintain a valid polygon
                path.removeAt(event.vertex);
                
                // Update the polygon path in state
                const paths = path.getArray().map((latLng: google.maps.LatLng) => ({
                  lat: latLng.lat(),
                  lng: latLng.lng()
                }));
                setPolygonPath(JSON.stringify(paths));
                
                // Show a toast to confirm deletion
                toast({
                  title: "Vertex Deleted",
                  description: "Right-click on any vertex to delete it."
                });
              } else {
                toast({
                  title: "Cannot Delete Vertex",
                  description: "A polygon must have at least 3 vertices.",
                  variant: "destructive"
                });
              }
            }
          });
          
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
        }
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
      {!readOnly && (
        <div className="bg-muted rounded-lg p-2 text-xs">
          <p className="font-medium">How to draw a geofence:</p>
          <ul className="list-disc list-inside mt-0.5 text-muted-foreground text-[10px] space-y-0">
            <li>Use the polygon tool in the map to draw your boundary</li>
            <li>Click points on the map to create your service area</li>
            <li>Complete the shape by clicking the first point again</li>
            <li>Edit by dragging the points after drawing is complete</li>
            <li className="font-semibold text-primary">Right-click on any point to delete it</li>
          </ul>
        </div>
      )}
      
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
              {/* Display all other zones if enabled */}
              {showAllZones && allZones && allZones.map((otherZone, index) => {
                if (otherZone.id !== zone?.id && otherZone.polygonPath) {
                  try {
                    const paths = JSON.parse(otherZone.polygonPath);
                    if (paths && paths.length > 0) {
                      // Define a set of colors for different zones
                      const zoneColors = ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#33FFF5"];
                      const colorIndex = index % zoneColors.length;
                      
                      return (
                        <Polygon
                          key={otherZone.id}
                          paths={paths}
                          options={{
                            fillColor: zoneColors[colorIndex],
                            fillOpacity: 0.3,
                            strokeColor: zoneColors[colorIndex],
                            strokeWeight: 1.5,
                            clickable: false,
                            editable: false,
                            draggable: false,
                            zIndex: 1
                          }}
                        />
                      );
                    }
                  } catch (e) {
                    console.error("Error parsing zone path:", e);
                  }
                }
                return null;
              })}
              {!readOnly && (
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
              )}
            </GoogleMap>
          </CardContent>
        </Card>
      )}
      
      {!readOnly && (
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
      )}
    </div>
  );
}