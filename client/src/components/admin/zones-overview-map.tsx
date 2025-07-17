import { useState, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Polygon } from "@react-google-maps/api";
import { ServiceZone } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface ZonesOverviewMapProps {
  zones: ServiceZone[];
  onEditZone?: (zone: ServiceZone) => void;
  activeZoneId?: number;
}

// Define map styles
const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 39.0997,
  lng: -94.5786, // Default center (Kansas City)
};

// A set of colors for the different zones
const zoneColors = [
  "#FF5733", // Red-Orange
  "#33FF57", // Green
  "#3357FF", // Blue
  "#F033FF", // Purple
  "#FF33A8", // Pink
  "#33FFF5", // Cyan
  "#F9FF33", // Yellow
  "#FF8333", // Orange
  "#8333FF", // Violet
  "#33FFB8", // Teal
];

export function ZonesOverviewMap({ zones, onEditZone, activeZoneId }: ZonesOverviewMapProps) {
  const [libraries] = useState(["drawing", "geometry"]);
  const [activeZone, setActiveZone] = useState<ServiceZone | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Helper function to parse polygon paths from the database
  const parsePolygonPaths = (polygonPathString?: string | null) => {
    if (!polygonPathString) return [];
    
    try {
      const paths = JSON.parse(polygonPathString);
      return Array.isArray(paths) ? paths : [];
    } catch (error) {
      
      return [];
    }
  };

  // Function to fit the map to show all zones
  const fitMapToZones = () => {
    if (!mapRef.current || zones.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    zones.forEach((zone) => {
      const paths = parsePolygonPaths(zone.polygonPath);
      
      if (paths.length > 0) {
        paths.forEach((path: { lat: number; lng: number }) => {
          bounds.extend(new google.maps.LatLng(path.lat, path.lng));
        });
      }
    });
    
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
    }
  };

  // When the map is loaded
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  };

  // When zones change, fit the map to show all zones
  useEffect(() => {
    if (mapLoaded) {
      fitMapToZones();
    }
  }, [zones, mapLoaded]);

  const handlePolygonClick = (zone: ServiceZone) => {
    setActiveZone(zone);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Service Zones Overview</h2>
            <p className="text-gray-500">View all your service zones in one map</p>
          </div>

          <div className="relative">
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
              libraries={libraries as any}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={4}
                onLoad={handleMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                }}
              >
                {zones.map((zone, index) => {
                  const paths = parsePolygonPaths(zone.polygonPath);
                  const colorIndex = index % zoneColors.length;
                  
                  return paths.length > 0 ? (
                    <Polygon
                      key={zone.id}
                      paths={paths}
                      onClick={() => handlePolygonClick(zone)}
                      options={{
                        fillColor: zoneColors[colorIndex],
                        fillOpacity: activeZoneId === zone.id ? 0.7 : 0.5,
                        strokeColor: activeZoneId === zone.id ? "#000000" : zoneColors[colorIndex],
                        strokeOpacity: 1,
                        strokeWeight: activeZoneId === zone.id ? 3 : 2,
                        clickable: true,
                        draggable: false,
                        editable: false,
                        zIndex: (activeZoneId === zone.id || activeZone?.id === zone.id) ? 2 : 1,
                      }}
                    />
                  ) : null;
                })}
              </GoogleMap>
            </LoadScript>

            {activeZone && (
              <div className="absolute top-4 right-4 bg-white p-4 rounded-md shadow-lg max-w-xs">
                <h3 className="font-bold text-lg">{activeZone.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {activeZone.zipCodes ? `ZIP Codes: ${activeZone.zipCodes}` : "No ZIP codes defined"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Delivery Fee: ${activeZone.deliveryFee?.toFixed(2) || "0.00"}
                </p>
                {onEditZone && (
                  <Button 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={() => onEditZone(activeZone)}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Zone
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}