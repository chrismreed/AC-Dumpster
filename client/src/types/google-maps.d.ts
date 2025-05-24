// Type definitions for the Google Maps API

declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor();
      extend(latLng: LatLng): void;
      getCenter(): LatLng;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      center: LatLng | LatLngLiteral;
      zoom: number;
      streetViewControl?: boolean;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
    }

    namespace drawing {
      enum OverlayType {
        POLYGON = "polygon",
      }

      class DrawingManager {
        constructor(options?: DrawingManagerOptions);
        setMap(map: Map | null): void;
        setDrawingMode(drawingMode: OverlayType | null): void;
      }

      interface DrawingManagerOptions {
        drawingMode?: OverlayType | null;
        drawingControl?: boolean;
        drawingControlOptions?: {
          position: ControlPosition;
          drawingModes: OverlayType[];
        };
        polygonOptions?: PolygonOptions;
      }
    }

    enum ControlPosition {
      TOP_CENTER,
    }

    class Polygon {
      constructor(options?: PolygonOptions);
      setMap(map: Map | null): void;
      setEditable(editable: boolean): void;
      getPath(): MVCArray<LatLng>;
    }

    interface PolygonOptions {
      fillColor?: string;
      fillOpacity?: number;
      strokeWeight?: number;
      strokeColor?: string;
      editable?: boolean;
      draggable?: boolean;
    }

    class MVCArray<T> {
      getArray(): T[];
    }

    namespace event {
      function addListener(instance: any, eventName: string, handler: Function): MapsEventListener;
    }

    interface MapsEventListener {
      remove(): void;
    }
  }
}

export {};