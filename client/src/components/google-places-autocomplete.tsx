import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    google: any;
  }
}

interface GooglePlacesAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: any) => void;
  placeholder?: string;
  className?: string;
}

export function GooglePlacesAutocomplete({
  value = '',
  onChange,
  onPlaceSelected,
  placeholder = "Enter an address",
  className
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
    
    const initializeAutocomplete = () => {
      if (window.google && window.google.maps && inputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: ['es', 'fr', 'pt'] }, // Camino countries
            fields: ['address_components', 'formatted_address', 'geometry', 'place_id']
          }
        );

        const handlePlaceChanged = () => {
          try {
            const place = autocompleteRef.current.getPlace();
            if (place && place.address_components) {
              // Update the input value
              if (place.formatted_address) {
                onChange(place.formatted_address);
              }
              // Trigger place selection callback with comprehensive data
              onPlaceSelected?.(place);
            }
          } catch (error) {
            console.error('Error processing place selection:', error);
          }
        };

        autocompleteRef.current.addListener('place_changed', handlePlaceChanged);
        
        // Handle keyboard events for better UX
        keydownHandler = (e: KeyboardEvent) => {
          if (e.key === 'Tab' || e.key === 'Enter') {
            // Small delay to allow autocomplete to process
            setTimeout(() => {
              try {
                if (autocompleteRef.current) {
                  const place = autocompleteRef.current.getPlace();
                  if (place && place.address_components) {
                    handlePlaceChanged();
                  }
                }
              } catch (error) {
                console.error('Error handling keyboard selection:', error);
              }
            }, 100);
          }
        };

        if (inputRef.current && keydownHandler) {
          inputRef.current.addEventListener('keydown', keydownHandler);
        }
      }
    };

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBhfWQngB6-nBsCfcjROUyl203icnmn0sQ&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.head.appendChild(script);
    } else {
      initializeAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
      if (inputRef.current && keydownHandler) {
        inputRef.current.removeEventListener('keydown', keydownHandler);
      }
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}