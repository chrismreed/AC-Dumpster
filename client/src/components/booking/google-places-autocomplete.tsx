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
        console.warn('Google Maps API key not found');
        return;
      }

      try {
        // Load the Google Maps JavaScript API with the new import library approach
        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
          
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        // Import the Places library using the new approach
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as any;
        
        setIsLoaded(true);

        if (containerRef.current && !containerRef.current.querySelector('gmp-place-autocomplete')) {
          // Create the new PlaceAutocompleteElement
          const autocompleteElement = new PlaceAutocompleteElement();
          
          // Configure the element
          autocompleteElement.setAttribute('for-map', '');
          autocompleteElement.setAttribute('placeholder', placeholder);
          
          // Style the element to match our design
          Object.assign(autocompleteElement.style, {
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

          // Add the element to the container
          containerRef.current.appendChild(autocompleteElement);

          // Handle place selection
          autocompleteElement.addEventListener('gmp-placeselect', async (event: any) => {
            try {
              const place = event.place;
              
              // Fetch the place details
              await place.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
              });

              if (place.addressComponents && place.location) {
                const addressComponents = place.addressComponents;
                
                let streetNumber = '';
                let route = '';
                let city = '';
                let state = '';
                let zipCode = '';

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
                
                setInputValue(fullAddress);
                onPlaceSelect(parsedData);
              }
            } catch (error) {
              console.error('Error handling place selection:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error loading Google Places API:', error);
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