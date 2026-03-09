'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, Polygon } from '@react-google-maps/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GeofenceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (polygonPath: { lat: number; lng: number }[]) => void;
  initialPolygon?: { lat: number; lng: number }[] | null;
  zoneName: string;
  initialCenter?: { lat: number; lng: number };
  inline?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 39.1200,
  lng: -88.5434,
};

export function GeofenceEditor({
  isOpen,
  onClose,
  onSave,
  initialPolygon,
  zoneName,
  initialCenter,
  inline = false,
}: GeofenceEditorProps) {
  const { isLoaded } = useGoogleMaps();

  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [path, setPath] = useState<{ lat: number; lng: number }[]>(initialPolygon || []);
  const [isDrawing, setIsDrawing] = useState(!initialPolygon);

  const center = initialCenter || initialPolygon?.[0] || defaultCenter;

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isOpen || !e.latLng) return;

      const newPoint = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      setPath((prev) => [...prev, newPoint]);
    },
    [isOpen]
  );

  const handleClear = useCallback(() => {
    setPath([]);
    setIsDrawing(true);
    if (polygon) {
      polygon.setMap(null);
    }
  }, [polygon]);

  const handleSave = useCallback(() => {
    if (path.length < 3) {
      alert('Please draw a polygon with at least 3 points');
      return;
    }
    onSave(path);
  }, [path, onSave]);

  const handleCancel = useCallback(() => {
    setPath(initialPolygon || []);
    setIsDrawing(!initialPolygon);
    onClose();
  }, [initialPolygon, onClose]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-3"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Inline mode - just render the map
  if (inline) {
    return (
      <div className="w-full h-full">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={10}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            mapTypeId: 'terrain',
          }}
        >
          {path.length > 0 && (
            <Polygon
              paths={path}
              options={{
                fillColor: '#22c55e',
                fillOpacity: 0.35,
                strokeColor: '#16a34a',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                editable: isOpen,
                draggable: false,
              }}
              onLoad={(poly) => {
                setPolygon(poly);
                if (isOpen) {
                  // Listen to path changes when editing
                  const pathArr = poly.getPath();
                  google.maps.event.addListener(pathArr, 'set_at', () => {
                    const newPath = pathArr.getArray().map((latLng) => ({
                      lat: latLng.lat(),
                      lng: latLng.lng(),
                    }));
                    setPath(newPath);
                  });
                  google.maps.event.addListener(pathArr, 'insert_at', () => {
                    const newPath = pathArr.getArray().map((latLng) => ({
                      lat: latLng.lat(),
                      lng: latLng.lng(),
                    }));
                    setPath(newPath);
                  });
                  google.maps.event.addListener(pathArr, 'remove_at', () => {
                    const newPath = pathArr.getArray().map((latLng) => ({
                      lat: latLng.lat(),
                      lng: latLng.lng(),
                    }));
                    setPath(newPath);
                  });

                  // Add right-click handler to delete vertices
                  google.maps.event.addListener(poly, 'rightclick', (e: any) => {
                    // Check if a vertex was clicked
                    if (e.vertex !== undefined) {
                      const pathArr = poly.getPath();
                      // Don't allow deletion if we'd have fewer than 3 points
                      if (pathArr.getLength() > 3) {
                        pathArr.removeAt(e.vertex);
                      } else {
                        alert('A polygon must have at least 3 points');
                      }
                    }
                  });
                }
              }}
            />
          )}
        </GoogleMap>

        {/* Action buttons for inline mode */}
        {isOpen && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button variant="outline" onClick={handleClear} size="sm">
              Clear
            </Button>
            <Button onClick={handleSave} className="bg-yellow-600 hover:bg-yellow-700" size="sm">
              Save Geofence
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Modal mode (original behavior)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Service Area Boundary</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Define the exact boundary for this service zone
          </p>
        </DialogHeader>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">How to draw a geofence:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Click points on the map to create your service area</li>
            <li>• Complete the shape by clicking the first point again</li>
            <li>• Edit by dragging the points after drawing is complete</li>
            <li className="text-amber-600">• Right-click on any point to delete it</li>
          </ul>
        </div>

        {/* Map */}
        <div className="h-[500px]">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={10}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              mapTypeId: 'terrain',
            }}
          >
            {path.length > 0 && (
              <Polygon
                paths={path}
                options={{
                  fillColor: '#22c55e',
                  fillOpacity: 0.35,
                  strokeColor: '#16a34a',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  editable: true,
                  draggable: false,
                }}
                onLoad={(poly) => {
                  setPolygon(poly);
                  // Listen to path changes when editing
                  const pathArr = poly.getPath();
                  google.maps.event.addListener(pathArr, 'set_at', () => {
                    const newPath = pathArr.getArray().map((latLng) => ({
                      lat: latLng.lat(),
                      lng: latLng.lng(),
                    }));
                    setPath(newPath);
                  });

                  // Add right-click handler to delete vertices
                  google.maps.event.addListener(poly, 'rightclick', (e: any) => {
                    // Check if a vertex was clicked
                    if (e.vertex !== undefined) {
                      const pathArr = poly.getPath();
                      // Don't allow deletion if we'd have fewer than 3 points
                      if (pathArr.getLength() > 3) {
                        pathArr.removeAt(e.vertex);
                      } else {
                        alert('A polygon must have at least 3 points');
                      }
                    }
                  });
                  google.maps.event.addListener(pathArr, 'insert_at', () => {
                    const newPath = pathArr.getArray().map((latLng) => ({
                      lat: latLng.lat(),
                      lng: latLng.lng(),
                    }));
                    setPath(newPath);
                  });
                  google.maps.event.addListener(pathArr, 'remove_at', () => {
                    const newPath = pathArr.getArray().map((latLng) => ({
                      lat: latLng.lat(),
                      lng: latLng.lng(),
                    }));
                    setPath(newPath);
                  });
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-yellow-600 hover:bg-yellow-700">
              Save Geofence
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
