import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ServiceZone } from "@shared/schema";

interface GeofenceEditorProps {
  zone?: ServiceZone;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function GeofenceEditor({ zone, onSave, onCancel }: GeofenceEditorProps) {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [polyPath, setPolyPath] = useState<google.maps.LatLng[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ 
    lat: zone?.centerLat || 39.1225, 
    lng: zone?.centerLng || -88.5431 
  });
  const [zoneName, setZoneName] = useState(zone?.name || "");
  const [zipCodes, setZipCodes] = useState(zone?.zipCodes || "");
  const [deliveryFee, setDeliveryFee] = useState(zone?.deliveryFee?.toString() || "0");
  const [feeMultiplier, setFeeMultiplier] = useState(zone?.feeMultiplier?.toString() || "1");
  const [maxDrivingMinutes, setMaxDrivingMinutes] = useState(zone?.maxDrivingMinutes?.toString() || "30");
  const [useGeofencing, setUseGeofencing] = useState(zone?.useGeofencing || false);
  
  // Load existing polygon if available
  useEffect(() => {
    if (zone) {
      setZoneName(zone.name || "");
      setZipCodes(zone.zipCodes || "");
      setDeliveryFee(zone.deliveryFee?.toString() || "0");
      setFeeMultiplier(zone.feeMultiplier?.toString() || "1");
      setMaxDrivingMinutes(zone.maxDrivingMinutes?.toString() || "30");
      setUseGeofencing(zone.useGeofencing || false);
      if (zone.centerLat && zone.centerLng) {
        setCenter({ lat: zone.centerLat, lng: zone.centerLng });
      }
    }
  }, [zone]);

  // Initialize Google Maps and drawing tools
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    const initMap = async () => {
      try {
        // Load the drawing library
        if (!window.google?.maps?.drawing) {
          console.error("Google Maps Drawing library not loaded");
          toast({
            title: "Google Maps Error",
            description: "Drawing library could not be loaded. Please check your API key.",
            variant: "destructive"
          });
          return;
        }

        // Create map instance
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
        setMapInstance(map);

        // Create drawing manager
        const drawingMgr = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              google.maps.drawing.OverlayType.POLYGON,
            ],
          },
          polygonOptions: {
            fillColor: '#f7c948',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#111',
            clickable: true,
            editable: true,
            zIndex: 1,
          },
        });
        drawingMgr.setMap(map);
        setDrawingManager(drawingMgr);

        // Load existing polygon path if available
        if (zone?.polygonPath) {
          try {
            const paths = JSON.parse(zone.polygonPath);
            if (Array.isArray(paths) && paths.length > 0) {
              const latLngPaths = paths.map((point: {lat: number, lng: number}) => 
                new google.maps.LatLng(point.lat, point.lng)
              );
              
              const existingPolygon = new google.maps.Polygon({
                paths: latLngPaths,
                fillColor: '#f7c948',
                fillOpacity: 0.3,
                strokeWeight: 2,
                strokeColor: '#111',
                clickable: true,
                editable: true,
                zIndex: 1,
              });
              
              existingPolygon.setMap(map);
              setPolygon(existingPolygon);
              setPolyPath(latLngPaths);
              
              // Set up event listeners for the existing polygon
              google.maps.event.addListener(existingPolygon.getPath(), 'set_at', () => {
                updatePolygonPath(existingPolygon);
              });
              
              google.maps.event.addListener(existingPolygon.getPath(), 'insert_at', () => {
                updatePolygonPath(existingPolygon);
              });
              
              google.maps.event.addListener(existingPolygon.getPath(), 'remove_at', () => {
                updatePolygonPath(existingPolygon);
              });
              
              // Fit bounds to the polygon
              const bounds = new google.maps.LatLngBounds();
              latLngPaths.forEach(path => bounds.extend(path));
              map.fitBounds(bounds);
            }
          } catch (error) {
            console.error("Error loading polygon path:", error);
          }
        }

        // Handle polygon complete event
        google.maps.event.addListener(drawingMgr, 'polygoncomplete', (poly: google.maps.Polygon) => {
          // Remove any existing polygon
          if (polygon) {
            polygon.setMap(null);
          }
          
          // Set the new polygon
          setPolygon(poly);
          updatePolygonPath(poly);
          
          // Set up event listeners for the new polygon
          google.maps.event.addListener(poly.getPath(), 'set_at', () => {
            updatePolygonPath(poly);
          });
          
          google.maps.event.addListener(poly.getPath(), 'insert_at', () => {
            updatePolygonPath(poly);
          });
          
          google.maps.event.addListener(poly.getPath(), 'remove_at', () => {
            updatePolygonPath(poly);
          });
          
          // Switch drawing mode off after completing a polygon
          drawingMgr.setDrawingMode(null);
        });

      } catch (error) {
        console.error("Error initializing map:", error);
        toast({
          title: "Map Error",
          description: "There was an error initializing the map.",
          variant: "destructive"
        });
      }
    };

    initMap();

    return () => {
      // Clean up
      if (polygon) {
        polygon.setMap(null);
      }
      if (drawingManager) {
        drawingManager.setMap(null);
      }
    };
  }, [mapRef, toast, zone]);

  // Update polygon path when changed
  const updatePolygonPath = (poly: google.maps.Polygon) => {
    const path = poly.getPath();
    const pathArray: google.maps.LatLng[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      pathArray.push(path.getAt(i));
    }
    
    setPolyPath(pathArray);
    
    // Update center
    if (pathArray.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      pathArray.forEach(point => bounds.extend(point));
      const center = bounds.getCenter();
      setCenter({ lat: center.lat(), lng: center.lng() });
    }
  };

  // Clear the current polygon
  const handleClearPolygon = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
      setPolyPath([]);
    }
  };

  // Save the zone with polygon data
  const handleSave = () => {
    // Convert path to serializable format
    const serializedPath = polyPath.map(point => ({
      lat: point.lat(),
      lng: point.lng()
    }));

    // Prepare zone data
    const zoneData = {
      name: zoneName,
      zipCodes: zipCodes,
      deliveryFee: parseInt(deliveryFee) || 0,
      feeMultiplier: parseFloat(feeMultiplier) || 1.0,
      maxDrivingMinutes: parseInt(maxDrivingMinutes) || 30,
      useGeofencing: useGeofencing,
      centerLat: center.lat,
      centerLng: center.lng,
      polygonPath: JSON.stringify(serializedPath),
    };

    onSave(zoneData);
  };

  // Test if an address is inside the geofence
  const testAddress = async () => {
    const address = prompt("Enter an address to test:");
    if (!address || !polygon) return;
    
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          const isInside = google.maps.geometry.poly.containsLocation(
            location, 
            polygon as google.maps.Polygon
          );
          
          // Add a marker for the tested address
          const marker = new google.maps.Marker({
            position: location,
            map: mapInstance,
            title: results[0].formatted_address,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: isInside ? '#4CAF50' : '#F44336',
              fillOpacity: 0.8,
              strokeColor: '#FFF',
              strokeWeight: 2,
              scale: 10
            }
          });
          
          // Create an info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div>
                <p><strong>Address:</strong> ${results[0].formatted_address}</p>
                <p><strong>Status:</strong> ${isInside ? 'Inside geofence' : 'Outside geofence'}</p>
              </div>
            `
          });
          
          // Open info window when marker is clicked
          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
          });
          
          // Auto open the first time
          infoWindow.open(mapInstance, marker);
          
          // Center the map on the tested location
          mapInstance?.setCenter(location);
          
          // Show toast notification
          toast({
            title: "Address Test",
            description: `${results[0].formatted_address} is ${isInside ? 'inside' : 'outside'} the geofence.`,
            variant: isInside ? "default" : "destructive"
          });
        } else {
          toast({
            title: "Geocoding Error",
            description: "Could not find the specified address.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error("Error testing address:", error);
      toast({
        title: "Error",
        description: "Failed to test the address.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Geofence Editor</CardTitle>
        <CardDescription>
          Draw a polygon on the map to define the service area boundary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input 
                id="zone-name" 
                value={zoneName} 
                onChange={(e) => setZoneName(e.target.value)} 
                placeholder="Zone Name" 
              />
            </div>
            
            <div>
              <Label htmlFor="zip-codes">ZIP Codes (comma separated)</Label>
              <Input 
                id="zip-codes" 
                value={zipCodes} 
                onChange={(e) => setZipCodes(e.target.value)} 
                placeholder="e.g. 62401, 62411" 
              />
            </div>
            
            <div>
              <Label htmlFor="delivery-fee">Base Delivery Fee (in cents)</Label>
              <Input 
                id="delivery-fee" 
                type="number" 
                value={deliveryFee} 
                onChange={(e) => setDeliveryFee(e.target.value)} 
                placeholder="0" 
              />
            </div>
            
            <div>
              <Label htmlFor="fee-multiplier">Fee Distance Multiplier</Label>
              <Input 
                id="fee-multiplier" 
                type="number" 
                step="0.1" 
                value={feeMultiplier} 
                onChange={(e) => setFeeMultiplier(e.target.value)} 
                placeholder="1.0" 
              />
            </div>
            
            <div>
              <Label htmlFor="max-driving">Max Driving Minutes</Label>
              <Input 
                id="max-driving" 
                type="number" 
                value={maxDrivingMinutes} 
                onChange={(e) => setMaxDrivingMinutes(e.target.value)} 
                placeholder="30" 
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-geofencing"
                checked={useGeofencing}
                onChange={(e) => setUseGeofencing(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="use-geofencing">Use Advanced Geofencing</Label>
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">
                <p>Use the drawing tools to create a polygon around your service area.</p>
                <p>The polygon can be edited after creation by dragging the vertices.</p>
              </div>
              
              <div className="flex space-x-2 mb-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleClearPolygon}
                >
                  Clear Polygon
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={testAddress}
                  disabled={!polygon}
                >
                  Test Address
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md p-1">
              <div 
                ref={mapRef} 
                className="w-full h-[300px] rounded" 
                style={{ minHeight: "300px" }}
              ></div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              {polyPath.length > 0 
                ? `Polygon with ${polyPath.length} points. Center: ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`
                : "No polygon drawn yet."
              }
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Zone
        </Button>
      </CardFooter>
    </Card>
  );
}