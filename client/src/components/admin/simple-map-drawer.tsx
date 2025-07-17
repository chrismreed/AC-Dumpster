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
  
  // Reference to map objects
  const mapInstanceRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  
  // Load the Google Maps API and initialize the map
  useEffect(() => {
    
    
    // Function to update polygon path when edited
    function updatePolygonPath() {
      if (!polygonRef.current) return;
      
      const pathArray = polygonRef.current.getPath().getArray();
      const path = Array.from(pathArray).map((latLng: any) => ({
        lat: latLng.lat(),
        lng: latLng.lng()
      }));
      
      setPolygonPath(JSON.stringify(path));
    }
    
    // Function to initialize the map
    const initializeMap = () => {
      try {
        if (!mapContainerRef.current) return;
        
        
        // Create map instance
        const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
          center: zone?.centerLat && zone?.centerLng 
            ? { lat: zone.centerLat, lng: zone.centerLng } 
            : { lat: 39.8283, lng: -98.5795 },
          zoom: zone?.centerLat && zone?.centerLng ? 10 : 5,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });
        
        mapInstanceRef.current = mapInstance;
        
        // Create drawing manager
        
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [window.google.maps.drawing.OverlayType.POLYGON]
          },
          polygonOptions: {
            fillColor: "#F7C948",
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: "#F7C948",
            editable: true
          }
        });
        
        drawingManager.setMap(mapInstance);
        drawingManagerRef.current = drawingManager;
        
        // Set up listener for polygon complete
        window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: any) => {
          
          
          // Clear any existing polygon
          if (polygonRef.current) {
            polygonRef.current.setMap(null);
          }
          
          polygonRef.current = polygon;
          polygon.setEditable(true);
          
          // Capture path data
          const path = polygon.getPath().getArray().map((latLng: any) => ({
            lat: latLng.lat(),
            lng: latLng.lng()
          }));
          
          setPolygonPath(JSON.stringify(path));
          
          // Turn off drawing mode
          drawingManager.setDrawingMode(null);
          
          // Add listeners for editing
          window.google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygonPath);
          window.google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygonPath);
          
          toast({
            title: "Boundary Created",
            description: "Your service area boundary has been created. You can edit it by dragging the points."
          });
        });
        
        // Draw existing polygon if available
        if (polygonPath) {
          try {
            
            const path = JSON.parse(polygonPath);
            
            const polygon = new window.google.maps.Polygon({
              paths: path,
              strokeColor: "#F7C948",
              strokeOpacity: 0.8,
              strokeWeight: 3,
              fillColor: "#F7C948",
              fillOpacity: 0.35,
              editable: true
            });
            
            polygon.setMap(mapInstance);
            polygonRef.current = polygon;
            
            // Add listeners for editing
            window.google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygonPath);
            window.google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygonPath);
            
            // Fit map to polygon bounds
            const bounds = new window.google.maps.LatLngBounds();
            path.forEach((point: any) => {
              bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
            });
            
            mapInstance.fitBounds(bounds);
          } catch (error) {
            
            toast({
              title: "Error",
              description: "Could not load the existing geofence boundary.",
              variant: "destructive"
            });
          }
        }
        
        setMapLoaded(true);
        setMapLoading(false);
      } catch (error: any) {
        
        setMapError(`Map initialization error: ${error.message}`);
        setMapLoading(false);
      }
    };
    
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      
      initializeMap();
    } else {
      
      // Load Google Maps API
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        
        initializeMap();
      };
      
      script.onerror = (error) => {
        
        setMapError("Failed to load Google Maps API. Please check your API key.");
        setMapLoading(false);
      };
      
      document.head.appendChild(script);
    }
    
    // Cleanup function
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
    toast({
      title: "Cleared",
      description: "The geofence boundary has been cleared."
    });
  };
  
  // Save the geofence
  const handleSave = () => {
    if (!polygonPath) {
      toast({
        title: "No Boundary Drawn",
        description: "Please draw a boundary on the map before saving.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const path = JSON.parse(polygonPath);
      
      // Calculate center point
      let lat = 0, lng = 0;
      path.forEach((point: {lat: number, lng: number}) => {
        lat += point.lat;
        lng += point.lng;
      });
      
      const centerLat = lat / path.length;
      const centerLng = lng / path.length;
      
      // Save data
      onSave({
        useGeofencing: true,
        polygonPath,
        centerLat,
        centerLng
      });
    } catch (error: any) {
      
      toast({
        title: "Error",
        description: "Failed to save geofence. Please try again.",
        variant: "destructive"
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