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
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
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
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        setIsLoaded(true);

        if (inputRef.current && !autocompleteRef.current) {
          // Use the legacy Autocomplete (works reliably, supported for 12+ months)
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'us' }
          });

          autocomplete.setFields(['address_components', 'geometry', 'formatted_address']);

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (!place.address_components || !place.geometry?.location) {
              console.error('Missing address components or location');
              return;
            }

            let streetNumber = '';
            let route = '';
            let city = '';
            let state = '';
            let zipCode = '';

            place.address_components.forEach((component) => {
              const types = component.types;
              
              if (types.includes('street_number')) {
                streetNumber = component.long_name;
              } else if (types.includes('route')) {
                route = component.long_name;
              } else if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
              } else if (types.includes('postal_code')) {
                zipCode = component.long_name;
              }
            });

            const fullAddress = `${streetNumber} ${route}`.trim();
            
            const parsedData = {
              address: fullAddress,
              city,
              state,
              zipCode,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            };

            setInputValue(fullAddress);
            onPlaceSelect(parsedData);
          });

          autocompleteRef.current = autocomplete;
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoaded(true);
      }
    };

    initializeAutocomplete();
  }, [onPlaceSelect]);

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

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
      placeholder={isLoaded ? placeholder : "Loading address suggestions..."}
      className={className}
      disabled={!isLoaded && !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
    />
  );
}
