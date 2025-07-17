import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [polygonPath, setPolygonPath] = useState<string | null>(zone?.polygonPath || null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Reference to map objects that need to persist
  const mapRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const polygonRef = useRef(null);
  
  // Load Google Maps API and initialize the map
  useEffect(() => {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey) {
      setMapError("Google Maps API key is missing. Please check your environment variables.");
      setMapLoading(false);
      return;
    }
    
    // Create script element
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=drawing`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      initializeMap();
    };
    
    script.onerror = () => {
      setMapError("Failed to load Google Maps API. Please check your API key and internet connection.");
      setMapLoading(false);
    };
    
    // Add script to document head
    document.head.appendChild(script);
    
    // Initialize map once script is loaded
    const initializeMap = () => {
      if (!mapContainerRef.current || !window.google) return;
      
      try {
        // Create map instance
        const center = zone?.centerLat && zone?.centerLng
          ? { lat: zone.centerLat, lng: zone.centerLng }
          : { lat: 39.8283, lng: -98.5795 }; // Default to USA center
        
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: zone?.centerLat && zone?.centerLng ? 10 : 5,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        });
        
        // @ts-ignore - We know this exists
        mapRef.current = map;
        
        // Create drawing manager for polygons
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            // @ts-ignore - We know this exists
            position: window.google.maps.ControlPosition.TOP_CENTER,
            // @ts-ignore - We know this exists
            drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor: "#F7C948",
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: "#F7C948",
            editable: true,
          },
        });
        
        // @ts-ignore - We know map exists
        drawingManager.setMap(map);
        // @ts-ignore - We know this exists
        drawingManagerRef.current = drawingManager;
        
        // Create polygon capture function
        const capturePolygonPath = (polygon: any) => {
          // @ts-ignore - We know getArray exists
          const pathArray = polygon.getPath().getArray();
          const path = [];
          
          // Extract coordinates from each point
          for (let i = 0; i < pathArray.length; i++) {
            const point = pathArray[i];
            path.push({
              lat: point.lat(),
              lng: point.lng(),
            });
          }
          
          return path;
        };
        
        // Add listener for polygon complete
        window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: any) => {
          // Clear any existing polygon
          if (polygonRef.current) {
            // @ts-ignore - We know setMap exists
            polygonRef.current.setMap(null);
          }
          
          // @ts-ignore - We know this exists
          polygonRef.current = polygon;
          
          // Make polygon editable
          polygon.setEditable(true);
          
          // Capture path data
          const path = capturePolygonPath(polygon);
          setPolygonPath(JSON.stringify(path));
          
          // Turn off drawing mode
          drawingManager.setDrawingMode(null);
          
          // Add listeners for polygon editing
          window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
            const newPath = capturePolygonPath(polygon);
            setPolygonPath(JSON.stringify(newPath));
          });
          
          window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
            const newPath = capturePolygonPath(polygon);
            setPolygonPath(JSON.stringify(newPath));
          });
          
          toast({
            title: "Boundary Created",
            description: "Your service area boundary has been created. You can edit it by dragging the points.",
          });
        });
        
        // Load existing polygon if available
        if (polygonPath) {
          try {
            const path = JSON.parse(polygonPath);
            
            // Create polygon from saved path
            const polygon = new window.google.maps.Polygon({
              paths: path,
              strokeColor: "#F7C948",
              strokeOpacity: 0.8,
              strokeWeight: 3,
              fillColor: "#F7C948",
              fillOpacity: 0.35,
              editable: true,
            });
            
            // @ts-ignore - We know map exists
            polygon.setMap(map);
            // @ts-ignore - We know this exists
            polygonRef.current = polygon;
            
            // Add listeners for polygon editing
            window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
              const newPath = capturePolygonPath(polygon);
              setPolygonPath(JSON.stringify(newPath));
            });
            
            window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
              const newPath = capturePolygonPath(polygon);
              setPolygonPath(JSON.stringify(newPath));
            });
            
            // Fit map to polygon bounds
            const bounds = new window.google.maps.LatLngBounds();
            
            // Add each point to bounds
            for (const point of path) {
              bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
            }
            
            // @ts-ignore - We know fitBounds exists
            map.fitBounds(bounds);
          } catch (error) {
            
            toast({
              title: "Error",
              description: "Could not load the existing geofence boundary.",
              variant: "destructive",
            });
          }
        }
        
        setMapLoaded(true);
        setMapLoading(false);
      } catch (error: any) {
        
        setMapError(`Error initializing map: ${error.message}`);
        setMapLoading(false);
      }
    };
    
    // Clean up function
    return () => {
      // Remove script if it was added by this component
      const existingScript = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      
      // Clean up map objects
      if (polygonRef.current) {
        try {
          // @ts-ignore - We know setMap exists
          polygonRef.current.setMap(null);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      if (drawingManagerRef.current) {
        try {
          // @ts-ignore - We know setMap exists
          drawingManagerRef.current.setMap(null);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);
  
  // Clear the current polygon
  const clearPolygon = () => {
    if (polygonRef.current) {
      try {
        // @ts-ignore - We know setMap exists
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      } catch (e) {
        
      }
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
    
    try {
      const path = JSON.parse(polygonPath);
      
      // Calculate center point
      let totalLat = 0;
      let totalLng = 0;
      
      // Sum up all coordinates
      for (const point of path) {
        totalLat += point.lat;
        totalLng += point.lng;
      }
      
      // Calculate average (center)
      const centerLat = totalLat / path.length;
      const centerLng = totalLng / path.length;
      
      // Save data
      onSave({
        useGeofencing: true,
        polygonPath,
        centerLat,
        centerLng,
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
      
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          {mapLoading ? (
            <div className="flex items-center justify-center h-[500px] bg-muted">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div ref={mapContainerRef} style={mapContainerStyle}></div>
          )}
        </CardContent>
      </Card>
      
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