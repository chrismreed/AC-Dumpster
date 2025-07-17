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
        // Temporarily suppress deprecation warnings
        const originalWarn = 
        console.warn = (...args) => {
          const message = args.join(' ');
          if (!message.includes('google.maps.places.Autocomplete')) {
            originalWarn(...args);
          }
        };

        // Use a simpler approach that works reliably
        const { Loader } = await import('@googlemaps/js-api-loader');
        
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        // Restore console.warn
        
        setIsLoaded(true);

        if (containerRef.current && !containerRef.current.querySelector('input')) {
          // Create a regular input element
          const inputElement = document.createElement('input');
          inputElement.type = 'text';
          inputElement.placeholder = placeholder;
          inputElement.value = inputValue;
          
          // Style the input to match our design
          Object.assign(inputElement.style, {
            width: '100%',
            height: '40px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            padding: '8px 12px',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            backgroundColor: 'white'
          });

          // Add the input to the container
          containerRef.current.appendChild(inputElement);

          // Create the Autocomplete service
          const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            types: ['address'],
            componentRestrictions: { country: 'us' },
            fields: [
              'address_components',
              'formatted_address',
              'geometry.location'
            ]
          });

          // Handle place selection
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (place && place.address_components && place.geometry?.location) {
              const addressComponents = place.address_components;
              
              let streetNumber = '';
              let route = '';
              let city = '';
              let state = '';
              let zipCode = '';

              addressComponents.forEach(component => {
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
            }
          });

          // Handle input changes
          inputElement.addEventListener('input', (e) => {
            const newValue = (e.target as HTMLInputElement).value;
            setInputValue(newValue);
            onChange?.(newValue);
          });
        }
      } catch (error) {
        
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