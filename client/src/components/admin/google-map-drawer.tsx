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
  
  // Store refs that need to persist between renders
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  
  // Initialize the map
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }
      
      // Create script element for Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=drawing`;
      script.async = true;
      script.defer = true;
      
      // Handle script load event
      script.onload = () => {
        initializeMap();
      };
      
      // Handle script error
      script.onerror = () => {
        setMapError('Failed to load Google Maps API');
        setMapLoading(false);
      };
      
      // Add script to document
      document.head.appendChild(script);
    };
    
    // Initialize the map once script is loaded
    const initializeMap = () => {
      if (!mapContainerRef.current) return;
      
      try {
        // Create the map
        const map = new google.maps.Map(mapContainerRef.current, {
          center: zone?.centerLat && zone?.centerLng 
            ? { lat: zone.centerLat, lng: zone.centerLng }
            : { lat: 39.8283, lng: -98.5795 }, // Default to USA center
          zoom: zone?.centerLat && zone?.centerLng ? 10 : 5,
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
        
        // Add listener for polygon complete
        google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
          // Clear any existing polygon
          if (polygonRef.current) {
            polygonRef.current.setMap(null);
          }
          
          // Store the new polygon
          polygonRef.current = polygon;
          
          // Make it editable
          polygon.setEditable(true);
          
          // Extract path data
          const pathArray = polygon.getPath().getArray();
          const path = Array.from(pathArray).map((latLng: google.maps.LatLng) => ({
            lat: latLng.lat(),
            lng: latLng.lng()
          }));
          
          // Save path as JSON
          setPolygonPath(JSON.stringify(path));
          
          // Turn off drawing mode
          drawingManager.setDrawingMode(null);
          
          // Add listeners for polygon editing
          google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygonPath);
          google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygonPath);
          
          // Success message
          toast({
            title: "Boundary Created",
            description: "Your service area boundary has been created. You can edit it by dragging the points.",
          });
        });
        
        // If we have existing polygon data, draw it
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
            
            // Add listeners for polygon editing
            google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygonPath);
            google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygonPath);
            
            // Fit map to polygon bounds
            const bounds = new google.maps.LatLngBounds();
            path.forEach((point: {lat: number, lng: number}) => {
              bounds.extend(new google.maps.LatLng(point.lat, point.lng));
            });
            map.fitBounds(bounds);
          } catch (error) {
            console.error("Error parsing polygon path:", error);
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
    
    // Function to update polygon path when edited
    function updatePolygonPath() {
      if (!polygonRef.current) return;
      
      const pathArray = polygonRef.current.getPath().getArray();
      const path = Array.from(pathArray).map(latLng => ({
        lat: latLng.lat(),
        lng: latLng.lng()
      }));
      
      setPolygonPath(JSON.stringify(path));
    }
    
    // Load the map
    loadGoogleMapsScript();
    
    // Cleanup when component unmounts
    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
      }
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
      if (!mapRef.current || !window.google) {
        throw new Error("Map not initialized");
      }
      
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
            <div ref={mapContainerRef} style={mapContainerStyle}></div>
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