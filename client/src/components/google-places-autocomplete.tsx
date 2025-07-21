import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader } from '@googlemaps/js-api-loader';

declare global {
  interface Window {
    google: any;
  }
  
  namespace google.maps.places {
    class PlaceAutocompleteElement extends HTMLElement {
      constructor(options?: {
        componentRestrictions?: { country: string[] };
        fields?: string[];
        types?: string[];
      });
      placeholder: string;
      addEventListener(type: 'gmp-placeselect', listener: (event: any) => void): void;
    }
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
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [useFallback, setUseFallback] = useState(true);

  useEffect(() => {
    const initializeModernAutocomplete = () => {
      try {
        if (!window.google?.maps) {
          throw new Error('Google Maps not loaded');
        }

        // Check if the new API is available (requires newer Maps API version)
        if (!window.google?.maps?.places) {
          throw new Error('Modern Places API not available');
        }
        
        if (!google.maps.places?.PlaceAutocompleteElement) {
          throw new Error('PlaceAutocompleteElement not available');
        }

        // Create the new PlaceAutocompleteElement
        const autocompleteElement = new google.maps.places.PlaceAutocompleteElement();

        // Style the element to match our design
        autocompleteElement.style.width = '100%';
        autocompleteElement.style.height = '40px';
        autocompleteElement.style.border = '1px solid hsl(var(--border))';
        autocompleteElement.style.borderRadius = 'calc(var(--radius) - 2px)';
        autocompleteElement.style.padding = '8px 12px';
        autocompleteElement.style.fontSize = '14px';
        autocompleteElement.style.backgroundColor = 'hsl(var(--background))';
        autocompleteElement.style.color = 'hsl(var(--foreground))';
        autocompleteElement.style.fontFamily = 'inherit';

        // Set placeholder
        autocompleteElement.placeholder = placeholder;

        // Add event listener for place selection
        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          try {
            const place = event.place;
            if (place?.formattedAddress) {
              onChange(place.formattedAddress);
              onPlaceSelected?.(place);
            }
          } catch (error) {
            console.error('Error processing place selection:', error);
          }
        });

        // Clear container and append the new element
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(autocompleteElement);
          autocompleteElementRef.current = autocompleteElement;
          setUseFallback(false);
        }
      } catch (error) {
        console.error('Error initializing modern Google Places:', error);
        // Keep using fallback
        setUseFallback(true);
      }
    };

    const initializeLegacyAutocomplete = () => {
      try {
        if (window.google?.maps?.places?.Autocomplete && fallbackInputRef.current) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            fallbackInputRef.current,
            {
              types: ['address'],
              fields: ['address_components', 'formatted_address', 'geometry', 'place_id']
            }
          );

          const handlePlaceChanged = () => {
            try {
              const place = autocomplete.getPlace();
              if (place && place.address_components) {
                if (place.formatted_address) {
                  onChange(place.formatted_address);
                }
                onPlaceSelected?.(place);
              }
            } catch (error) {
              console.error('Error processing legacy place selection:', error);
            }
          };

          autocomplete.addListener('place_changed', handlePlaceChanged);
        }
      } catch (error) {
        console.error('Error initializing legacy Google Places:', error);
      }
    };

    let mounted = true;

    const loadGoogleMapsAPI = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        
        if (!apiKey) {
          console.warn('No Google Places API key configured, using fallback input');
          setUseFallback(true);
          return;
        }
        
        console.log('Loading Google Maps API with Places library...');
        
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"]
        });

        await loader.load();
        console.log('Google Maps API loaded successfully');

        if (!mounted) return;

        // Try modern API first, fallback to legacy
        try {
          initializeModernAutocomplete();
        } catch (modernError) {
          console.log('Modern API failed, trying legacy:', modernError);
          if (mounted) {
            initializeLegacyAutocomplete();
          }
        }
      } catch (error) {
        console.warn('Google Maps API loading failed:', error);
        console.warn('Using fallback input');
        if (mounted) {
          setUseFallback(true);
        }
      }
    };

    // Load Google Maps API if not already loaded
    if (!window.google?.maps) {
      loadGoogleMapsAPI();
    } else {
      // Try modern API first, fallback to legacy
      initializeModernAutocomplete().catch(() => {
        initializeLegacyAutocomplete();
      });
    }

    return () => {
      mounted = false;
      if (autocompleteElementRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (useFallback) {
    return (
      <Input
        ref={fallbackInputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <div ref={containerRef} className={className} />
  );
}