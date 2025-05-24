import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface GeofenceEditorProps {
  zone?: ServiceZone;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function GeofenceEditor({ zone, onSave, onCancel }: GeofenceEditorProps) {
  const { toast } = useToast();
  const [polygonPath, setPolygonPath] = useState<string>(
    zone?.polygonPath || 
    JSON.stringify([
      { lat: 39.0, lng: -98.0 },
      { lat: 39.1, lng: -97.9 },
      { lat: 39.0, lng: -97.8 },
      { lat: 38.9, lng: -97.9 }
    ])
  );
  
  const [centerLat, setCenterLat] = useState<number>(
    zone?.centerLat || 39.0
  );
  
  const [centerLng, setCenterLng] = useState<number>(
    zone?.centerLng || -98.0
  );
  
  // Parse and format coordinates for editing
  const formatCoordinates = () => {
    try {
      const coords = JSON.parse(polygonPath);
      return JSON.stringify(coords, null, 2);
    } catch (e) {
      return polygonPath;
    }
  };
  
  // Update coordinates from text input
  const handleCoordinatesChange = (value: string) => {
    setPolygonPath(value);
  };
  
  // Validate coordinates
  const validateCoordinates = (): boolean => {
    try {
      const coords = JSON.parse(polygonPath);
      if (!Array.isArray(coords) || coords.length < 3) {
        return false;
      }
      
      for (const point of coords) {
        if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
          return false;
        }
      }
      
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Clear polygon data
  const clearPolygon = () => {
    const defaultCoords = JSON.stringify([
      { lat: 39.0, lng: -98.0 },
      { lat: 39.1, lng: -97.9 },
      { lat: 39.0, lng: -97.8 },
      { lat: 38.9, lng: -97.9 }
    ], null, 2);
    
    setPolygonPath(defaultCoords);
    setCenterLat(39.0);
    setCenterLng(-98.0);
    
    toast({
      title: "Polygon Cleared",
      description: "The geofence boundary has been reset to default."
    });
  };
  
  // Save the geofence
  const handleSave = () => {
    if (!validateCoordinates()) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid coordinates for your boundary.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Save data
      onSave({
        useGeofencing: true,
        polygonPath,
        centerLat,
        centerLng
      });
      
      toast({
        title: "Geofence Saved",
        description: "Your service area boundary has been saved successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save geofence. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Get the static map URL with polygon
  const getStaticMapUrl = () => {
    try {
      const coords = JSON.parse(polygonPath);
      if (!Array.isArray(coords) || coords.length < 3) {
        return null;
      }
      
      // Create path string for Google Static Maps API
      const pathParams = coords.map(p => `${p.lat},${p.lng}`).join('|');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=10&size=600x400&maptype=roadmap&key=${apiKey}&path=color:0xF7C948|weight:3|fillcolor:0xF7C94850|${pathParams}`;
    } catch (e) {
      return null;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg p-2 text-xs">
        <p className="font-medium">Custom Service Area Definition:</p>
        <ul className="list-disc list-inside mt-0.5 text-muted-foreground text-[10px] space-y-0">
          <li>Define your service area by providing coordinates</li>
          <li>Each point should have latitude (lat) and longitude (lng)</li>
          <li>You need at least 3 points to create a valid area</li>
          <li>The map preview will update as you edit</li>
        </ul>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="space-y-2">
            <Label htmlFor="coordinates">Area Coordinates (JSON format)</Label>
            <Textarea
              id="coordinates"
              rows={12}
              value={formatCoordinates()}
              onChange={(e) => handleCoordinatesChange(e.target.value)}
              className="font-mono text-xs"
              placeholder='[
  {"lat": 39.0, "lng": -98.0},
  {"lat": 39.1, "lng": -97.9},
  {"lat": 39.0, "lng": -97.8},
  {"lat": 38.9, "lng": -97.9}
]'
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div>
              <Label htmlFor="centerLat">Center Latitude</Label>
              <Input 
                id="centerLat"
                type="number" 
                step="0.0001"
                value={centerLat}
                onChange={(e) => setCenterLat(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="centerLng">Center Longitude</Label>
              <Input 
                id="centerLng"
                type="number" 
                step="0.0001"
                value={centerLng}
                onChange={(e) => setCenterLng(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label>Map Preview</Label>
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              {getStaticMapUrl() ? (
                <img 
                  src={getStaticMapUrl() || ''} 
                  alt="Service Area Map" 
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Enter valid coordinates to see map preview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>You can find coordinates by right-clicking on Google Maps and selecting "What's here?"</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between space-x-3 pt-4 border-t">
        <Button
          onClick={clearPolygon}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <Trash className="mr-1 h-3 w-3" /> Reset
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!validateCoordinates()}
            size="sm"
          >
            Save Geofence
          </Button>
        </div>
      </div>
    </div>
  );
}