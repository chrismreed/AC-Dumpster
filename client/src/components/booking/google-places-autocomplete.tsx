import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
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

// Extend the global interface for the new PlaceAutocompleteElement
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': any;
    }
  }
}

export function GooglePlacesAutocomplete({
  onPlaceSelect,
  placeholder = "Enter street address",
  value = "",
  onChange,
  className
}: GooglePlacesAutocompleteProps) {
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not found');
        return;
      }

      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        // Import the new PlaceAutocompleteElement
        const { PlaceAutocompleteElement } = await google.maps.importLibrary('places') as any;
        
        setIsLoaded(true);

        if (autocompleteRef.current) {
          const autocomplete = new PlaceAutocompleteElement({
            locationRestriction: { country: 'us' },
            requestedRegionCode: 'us',
            includedPrimaryTypes: ['street_address'],
            includedRegionCodes: ['us'],
          });

          autocomplete.style.width = '100%';
          autocomplete.style.height = '40px';
          autocomplete.style.borderRadius = '6px';
          autocomplete.style.border = '1px solid #e2e8f0';
          autocomplete.style.padding = '8px 12px';
          autocomplete.style.fontSize = '14px';
          autocomplete.style.fontFamily = 'inherit';
          autocomplete.placeholder = placeholder;
          autocomplete.value = inputValue;

          autocomplete.addEventListener('gmp-placeselect', (event: any) => {
            const place = event.place;
            
            if (place && place.addressComponents && place.location) {
              const addressComponents = place.addressComponents;
              
              let streetNumber = '';
              let route = '';
              let city = '';
              let state = '';
              let zipCode = '';

              console.log('Address components:', addressComponents);

              addressComponents.forEach((component: any) => {
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

              console.log('Parsed address data:', parsedData);
              
              // Update input value to show the selected address
              setInputValue(fullAddress);

              onPlaceSelect(parsedData);
            }
          });

          // Clear existing content and append the new element
          autocompleteRef.current.innerHTML = '';
          autocompleteRef.current.appendChild(autocomplete);
        }
      } catch (error) {
        console.error('Error loading Google Places API:', error);
      }
    };

    initializeAutocomplete();
  }, [onPlaceSelect, placeholder]);

  useEffect(() => {
    setInputValue(value);
    // Update the autocomplete element's value if it exists
    if (autocompleteRef.current) {
      const autocompleteElement = autocompleteRef.current.querySelector('gmp-place-autocomplete');
      if (autocompleteElement) {
        autocompleteElement.value = value;
      }
    }
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
    <div 
      ref={autocompleteRef}
      className={`w-full ${className || ''}`}
      style={{ minHeight: '40px' }}
    >
      {!isLoaded && (
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Loading address suggestions..."
          className={className}
          disabled={true}
        />
      )}
    </div>
  );
}