import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServiceZone } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check, Map, Navigation, Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimpleGeofenceEditorProps {
  zone?: ServiceZone;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function SimpleGeofenceEditor({ zone, onSave, onCancel }: SimpleGeofenceEditorProps) {
  const { toast } = useToast();
  const [centerLat, setCenterLat] = useState<number | undefined>(zone?.centerLat || undefined);
  const [centerLng, setCenterLng] = useState<number | undefined>(zone?.centerLng || undefined);
  const [radiusMeters, setRadiusMeters] = useState<number | undefined>(zone?.radiusMeters || 5000);
  const [feeMultiplier, setFeeMultiplier] = useState<number>(zone?.feeMultiplier || 1.0);
  const [maxDrivingMinutes, setMaxDrivingMinutes] = useState<number | undefined>(zone?.maxDrivingMinutes || undefined);
  
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
    <div className="space-y-4">
      <Alert>
        <Map className="h-4 w-4" />
        <AlertTitle>Geofence Configuration</AlertTitle>
        <AlertDescription>
          Temporarily using simplified geofence configuration while we resolve Google Maps integration.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="centerLat">Center Latitude</Label>
          <Input 
            id="centerLat"
            type="number" 
            step="0.0001"
            value={centerLat || ''}
            onChange={(e) => setCenterLat(parseFloat(e.target.value))}
            placeholder="e.g. 39.8283"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="centerLng">Center Longitude</Label>
          <Input 
            id="centerLng"
            type="number" 
            step="0.0001"
            value={centerLng || ''}
            onChange={(e) => setCenterLng(parseFloat(e.target.value))}
            placeholder="e.g. -98.5795"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="radiusMeters">Radius (meters)</Label>
          <Input 
            id="radiusMeters"
            type="number" 
            value={radiusMeters || ''}
            onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
            placeholder="e.g. 5000"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="feeMultiplier">Fee Multiplier</Label>
          <Input 
            id="feeMultiplier"
            type="number" 
            step="0.1"
            min="1.0"
            value={feeMultiplier || ''}
            onChange={(e) => setFeeMultiplier(parseFloat(e.target.value))}
            placeholder="e.g. 1.5"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maxDrivingMinutes">Max Driving Time (minutes)</Label>
          <Input 
            id="maxDrivingMinutes"
            type="number"
            value={maxDrivingMinutes || ''}
            onChange={(e) => setMaxDrivingMinutes(parseInt(e.target.value))}
            placeholder="e.g. 30"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Geofence
        </Button>
      </div>
    </div>
  );
}