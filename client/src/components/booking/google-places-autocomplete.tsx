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
          version: 'beta', // Use beta version for PlaceAutocompleteElement
          libraries: ['places']
        });

        await loader.load();
        
        // Import the Places library
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as any;
        
        setIsLoaded(true);

        if (autocompleteRef.current && autocompleteRef.current.children.length === 0) {
          try {
            // Create the PlaceAutocompleteElement
            const placeAutocomplete = new PlaceAutocompleteElement({
              componentRestrictions: { country: ['us'] },
              types: ['address']
            });

            // Style the element
            placeAutocomplete.style.width = '100%';
            placeAutocomplete.style.height = '40px';
            placeAutocomplete.style.borderRadius = '6px';
            placeAutocomplete.style.border = '1px solid #e2e8f0';
            placeAutocomplete.style.padding = '8px 12px';
            placeAutocomplete.style.fontSize = '14px';
            placeAutocomplete.style.fontFamily = 'inherit';
            placeAutocomplete.style.outline = 'none';
            placeAutocomplete.style.boxSizing = 'border-box';
            
            // Set placeholder
            placeAutocomplete.placeholder = placeholder;
            
            // Append the new element only if container is empty
            autocompleteRef.current.appendChild(placeAutocomplete);

            // Add the gmp-placeselect event listener
            placeAutocomplete.addEventListener('gmp-placeselect', async ({ placePrediction }: any) => {
              try {
                const place = placePrediction.toPlace();
                await place.fetchFields({ 
                  fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'] 
                });
                
                console.log('Place selected:', place.toJSON());
                
                if (place.addressComponents && place.location) {
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
              } catch (err) {
                console.error('Error processing place selection:', err);
              }
            });
          } catch (err) {
            console.error('Error creating PlaceAutocompleteElement:', err);
          }
        }
      } catch (error) {
        console.error('Error loading Google Places API:', error);
      }
    };

    initializeAutocomplete();
  }, [onPlaceSelect, placeholder]);

  useEffect(() => {
    setInputValue(value);
    // Update the PlaceAutocompleteElement's value if it exists
    if (autocompleteRef.current) {
      const placeAutocompleteElement = autocompleteRef.current.querySelector('gmp-place-autocomplete');
      if (placeAutocompleteElement) {
        placeAutocompleteElement.value = value;
      }
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

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
      ref={autocompleteRef}
      className={`w-full ${className || ''}`}
      style={{ minHeight: '40px' }}
    />
  );
}