import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function GooglePlacesAutocomplete({
  onPlaceSelect,
  placeholder = "Enter street address",
  value = "",
  onChange,
  className
}: GooglePlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        return;
      }

      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: 'beta',
          libraries: ['places']
        });

        await loader.load();
        setIsLoaded(true);

        if (containerRef.current && !containerRef.current.querySelector('gmp-place-autocomplete')) {
          // Use the new PlaceAutocompleteElement
          const autocompleteElement = document.createElement('gmp-place-autocomplete') as any;
          
          // Configure the element
          autocompleteElement.setAttribute('placeholder', placeholder);
          autocompleteElement.setAttribute('type', 'address');
          
          // Style the element to match our design
          Object.assign(autocompleteElement.style, {
            width: '100%',
            '--gmp-autocomplete-font-size': '14px',
            '--gmp-autocomplete-input-height': '40px',
            '--gmp-autocomplete-input-padding': '8px 12px',
            '--gmp-autocomplete-border-radius': '6px',
            '--gmp-autocomplete-border-color': '#e2e8f0',
            '--gmp-autocomplete-background-color': 'white'
          });

          // Add the element to the container
          containerRef.current.appendChild(autocompleteElement);

          // Listen for place selection - support both old and new event names
          const handlePlaceSelect = async (event: any) => {
            // Try new API first (event.placePrediction), then fall back to old (event.detail.place)
            let place = event.placePrediction?.toPlace?.() || event.detail?.place;
            
            if (!place) {
              console.error('No place data in event.detail');
              return;
            }

            try {
              // Fetch the required fields from the place object
              await place.fetchFields({
                fields: ['addressComponents', 'formattedAddress', 'location']
              });

              if (!place.addressComponents || !place.location) {
                console.error('Missing address components or location data');
                return;
              }

              let streetNumber = '';
              let route = '';
              let city = '';
              let state = '';
              let zipCode = '';

              // Parse address components using the new API
              place.addressComponents.forEach((component: any) => {
                const types = component.types;
                
                if (types.includes('street_number')) {
                  streetNumber = component.longText;
                } else if (types.includes('route')) {
                  route = component.longText;
                } else if (types.includes('locality')) {
                  city = component.longText;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.shortText;
                } else if (types.includes('postal_code')) {
                  zipCode = component.longText;
                }
              });

              const fullAddress = `${streetNumber} ${route}`.trim();
              
              const parsedData = {
                address: fullAddress,
                city,
                state,
                zipCode,
                coordinates: {
                  lat: place.location.lat(),
                  lng: place.location.lng()
                }
              };

              setInputValue(fullAddress);
              onPlaceSelect(parsedData);
            } catch (error) {
              console.error('Error fetching place details:', error);
            }
          };

          // Listen to both event types for compatibility
          autocompleteElement.addEventListener('gmp-select', handlePlaceSelect);
          autocompleteElement.addEventListener('gmp-placeselect', handlePlaceSelect);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoaded(true); // Allow fallback to regular input
      }
    };

    initializeAutocomplete();
  }, [onPlaceSelect, placeholder]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  if (!isLoaded) {
    return (
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Loading address suggestions..."
        className={className}
        disabled={true}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className || ''}`}
    />
  );
}
