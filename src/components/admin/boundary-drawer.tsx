'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLoadScript, GoogleMap, DrawingManager, Polygon, Circle } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Circle as CircleIcon, Trash2, Save } from 'lucide-react';

interface BoundaryDrawerProps {
  apiKey: string;
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  polygonPath?: string;
  onBoundaryChange: (boundary: {
    centerLat?: number;
    centerLng?: number;
    radiusMeters?: number;
    polygonPath?: string;
  }) => void;
}

interface LatLng {
  lat: number;
  lng: number;
}

export function BoundaryDrawer({
  apiKey,
  centerLat,
  centerLng,
  radiusMeters,
  polygonPath,
  onBoundaryChange
}: BoundaryDrawerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<'circle' | 'polygon' | null>(null);
  const [drawnCircle, setDrawnCircle] = useState<{
    center: LatLng;
    radius: number;
  } | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<LatLng[]>([]);
  const [manualLat, setManualLat] = useState(centerLat?.toString() || '');
  const [manualLng, setManualLng] = useState(centerLng?.toString() || '');
  const [manualRadius, setManualRadius] = useState(radiusMeters?.toString() || '');

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: ['drawing', 'geometry'],
  });

  // Initialize with existing data
  useEffect(() => {
    if (centerLat && centerLng && radiusMeters) {
      setDrawnCircle({
        center: { lat: centerLat, lng: centerLng },
        radius: radiusMeters
      });
      setDrawingMode('circle');
    } else if (polygonPath) {
      try {
        const path = JSON.parse(polygonPath);
        setDrawnPolygon(path);
        setDrawingMode('polygon');
      } catch (e) {
        console.error('Invalid polygon path:', e);
      }
    }
  }, [centerLat, centerLng, radiusMeters, polygonPath]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Center on existing coordinates or default location
    const center = centerLat && centerLng
      ? { lat: centerLat, lng: centerLng }
      : { lat: 40.7128, lng: -74.0060 }; // Default to NYC

    map.setCenter(center);
    map.setZoom(12);
  }, [centerLat, centerLng]);

  const onCircleComplete = useCallback((circle: google.maps.Circle) => {
    const center = circle.getCenter();
    const radius = circle.getRadius();

    if (center) {
      const circleData = {
        center: { lat: center.lat(), lng: center.lng() },
        radius: radius
      };

      setDrawnCircle(circleData);
      setDrawnPolygon([]); // Clear polygon when drawing circle

      onBoundaryChange({
        centerLat: center.lat(),
        centerLng: center.lng(),
        radiusMeters: radius,
        polygonPath: undefined
      });

      setManualLat(center.lat().toString());
      setManualLng(center.lng().toString());
      setManualRadius(radius.toString());
    }
  }, [onBoundaryChange]);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coordinates: LatLng[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({
        lat: point.lat(),
        lng: point.lng()
      });
    }

    setDrawnPolygon(coordinates);
    setDrawnCircle(null); // Clear circle when drawing polygon

    onBoundaryChange({
      centerLat: undefined,
      centerLng: undefined,
      radiusMeters: undefined,
      polygonPath: JSON.stringify(coordinates)
    });
  }, [onBoundaryChange]);

  const handleManualEntry = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const radius = parseFloat(manualRadius);

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
      const circleData = {
        center: { lat, lng },
        radius
      };

      setDrawnCircle(circleData);
      setDrawnPolygon([]);

      onBoundaryChange({
        centerLat: lat,
        centerLng: lng,
        radiusMeters: radius,
        polygonPath: undefined
      });

      // Update map center
      if (map) {
        map.setCenter({ lat, lng });
        map.setZoom(14);
      }
    }
  };

  const clearBoundary = () => {
    setDrawnCircle(null);
    setDrawnPolygon([]);
    setDrawingMode(null);
    onBoundaryChange({
      centerLat: undefined,
      centerLng: undefined,
      radiusMeters: undefined,
      polygonPath: undefined
    });
  };

  if (loadError) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-800">Error loading Google Maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border">
        <h4 className="font-medium text-blue-900 mb-2">Draw Service Boundary</h4>
        <p className="text-sm text-blue-700 mb-4">
          Use the drawing tools to define your service area. You can draw circles for simple round areas or polygons for custom shapes.
        </p>

        {/* Drawing Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            type="button"
            variant={drawingMode === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDrawingMode(drawingMode === 'circle' ? null : 'circle')}
          >
            <CircleIcon className="h-4 w-4 mr-2" />
            Draw Circle
          </Button>
          <Button
            type="button"
            variant={drawingMode === 'polygon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Draw Polygon
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearBoundary}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Manual Entry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="manualLat" className="text-sm">Latitude</Label>
            <Input
              id="manualLat"
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="40.7128"
            />
          </div>
          <div>
            <Label htmlFor="manualLng" className="text-sm">Longitude</Label>
            <Input
              id="manualLng"
              type="number"
              step="0.000001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="-74.0060"
            />
          </div>
          <div>
            <Label htmlFor="manualRadius" className="text-sm">Radius (meters)</Label>
            <Input
              id="manualRadius"
              type="number"
              value={manualRadius}
              onChange={(e) => setManualRadius(e.target.value)}
              placeholder="5000"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleManualEntry}
          className="mb-4"
        >
          <Save className="h-4 w-4 mr-2" />
          Apply Manual Coordinates
        </Button>
      </div>

      {/* Map Container */}
      <div className="h-96 w-full border rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          onLoad={onMapLoad}
          options={{
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Drawing Manager */}
          <DrawingManager
            options={{
              drawingControl: false,
              drawingMode: drawingMode === 'circle'
                ? google.maps.drawing.OverlayType.CIRCLE
                : drawingMode === 'polygon'
                ? google.maps.drawing.OverlayType.POLYGON
                : null,
              circleOptions: {
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                strokeColor: '#1d4ed8',
                strokeWeight: 2,
                clickable: true,
                editable: true,
                zIndex: 1,
              },
              polygonOptions: {
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                strokeColor: '#1d4ed8',
                strokeWeight: 2,
                clickable: true,
                editable: true,
                zIndex: 1,
              },
            }}
            onCircleComplete={onCircleComplete}
            onPolygonComplete={onPolygonComplete}
          />

          {/* Render Drawn Circle */}
          {drawnCircle && (
            <Circle
              center={drawnCircle.center}
              radius={drawnCircle.radius}
              options={{
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                strokeColor: '#1d4ed8',
                strokeWeight: 2,
              }}
            />
          )}

          {/* Render Drawn Polygon */}
          {drawnPolygon.length > 0 && (
            <Polygon
              paths={drawnPolygon}
              options={{
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                strokeColor: '#1d4ed8',
                strokeWeight: 2,
              }}
            />
          )}
        </GoogleMap>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Click "Draw Circle" or "Draw Polygon" to start drawing</li>
          <li>For circles: Click and drag to define the radius</li>
          <li>For polygons: Click to add points, double-click to finish</li>
          <li>Or enter coordinates manually in the fields above</li>
        </ul>
      </div>
    </div>
  );
}