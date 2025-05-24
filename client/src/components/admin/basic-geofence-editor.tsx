import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check, Map, Navigation, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface BasicGeofenceEditorProps {
  zone?: ServiceZone;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function BasicGeofenceEditor({ zone, onSave, onCancel }: BasicGeofenceEditorProps) {
  const { toast } = useToast();
  const [centerLat, setCenterLat] = useState<number>(zone?.centerLat || 39.8283);
  const [centerLng, setCenterLng] = useState<number>(zone?.centerLng || -98.5795);
  const [radiusMeters, setRadiusMeters] = useState<number>(zone?.radiusMeters || 5000);
  const [feeMultiplier, setFeeMultiplier] = useState<number>(zone?.feeMultiplier || 1.0);
  const [maxDrivingMinutes, setMaxDrivingMinutes] = useState<number>(zone?.maxDrivingMinutes || 30);
  
  // Create preview URL for Google Maps
  const mapPreviewUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=12&size=400x200&maptype=roadmap&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&markers=color:red|${centerLat},${centerLng}&path=fillcolor:0xF7C94880|color:0xF7C948|weight:2|circle:${centerLat},${centerLng},${radiusMeters/1000}`;
  
  // Handle saving
  const handleSave = () => {
    if (!centerLat || !centerLng) {
      toast({
        title: "Missing Coordinates",
        description: "Please enter center coordinates for the service zone.",
        variant: "destructive",
      });
      return;
    }
    
    // Save data
    onSave({
      useGeofencing: true,
      centerLat,
      centerLng,
      radiusMeters,
      feeMultiplier,
      maxDrivingMinutes
    });
  };
  
  return (
    <div className="space-y-2">
      <div className="bg-muted rounded-lg p-2 text-xs">
        <p className="font-medium">Service Area Configuration</p>
        <p className="text-muted-foreground text-[10px]">
          Set the center point and radius of your service area to define where you deliver.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="centerLat" className="text-xs">Center Latitude</Label>
          <Input 
            id="centerLat"
            type="number" 
            step="0.0001"
            value={centerLat}
            onChange={(e) => setCenterLat(parseFloat(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="centerLng" className="text-xs">Center Longitude</Label>
          <Input 
            id="centerLng"
            type="number" 
            step="0.0001"
            value={centerLng}
            onChange={(e) => setCenterLng(parseFloat(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label htmlFor="radiusMeters" className="text-xs">Service Radius: {(radiusMeters/1000).toFixed(1)} km</Label>
        </div>
        <Slider
          id="radiusMeters"
          min={1000}
          max={50000}
          step={1000}
          value={[radiusMeters]}
          onValueChange={(value) => setRadiusMeters(value[0])}
        />
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label htmlFor="feeMultiplier" className="text-xs">Fee Multiplier: {feeMultiplier.toFixed(1)}x</Label>
        </div>
        <Slider
          id="feeMultiplier"
          min={1}
          max={3}
          step={0.1}
          value={[feeMultiplier]}
          onValueChange={(value) => setFeeMultiplier(value[0])}
        />
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <Label htmlFor="maxDrivingMinutes" className="text-xs">Max Driving Time: {maxDrivingMinutes} minutes</Label>
        </div>
        <Slider
          id="maxDrivingMinutes"
          min={10}
          max={120}
          step={5}
          value={[maxDrivingMinutes]}
          onValueChange={(value) => setMaxDrivingMinutes(value[0])}
        />
      </div>
      
      <Card>
        <CardContent className="p-2">
          <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
            {mapPreviewUrl ? (
              <img 
                src={mapPreviewUrl} 
                alt="Service area preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-xs">Map preview unavailable</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          size="sm"
        >
          Save Geofence
        </Button>
      </div>
    </div>
  );
}