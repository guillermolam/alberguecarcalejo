import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader } from '@googlemaps/js-api-loader';
import { apiRequest } from '@/lib/queryClient';

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

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export function GooglePlacesAutocomplete({
  value = '',
  onChange,
  onPlaceSelected,
  placeholder = "",
  className
}: GooglePlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [useFallback, setUseFallback] = useState(true);
  console.log('GooglePlacesAutocomplete render - useFallback:', useFallback, 'value:', value);
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

        // Create the new PlaceAutocompleteElement with proper configuration
        const autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
          types: ["address"],
          componentRestrictions: { country: ["es"] }
        });

        // Apply shadcn Input class names directly to the element
        autocompleteElement.className = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
        
        // Set tabindex to make it focusable
        autocompleteElement.setAttribute('tabindex', '0');
        
        // Ensure proper value setting (Google Places elements handle this differently)
        if (value) {
          try {
            (autocompleteElement as any).value = value;
          } catch (e) {
            console.log('Could not set value on Google Places element:', e);
          }
        }
        
        // Add standard focus/blur event listeners to the DOM element
        (autocompleteElement as any).addEventListener('focus', () => {
          console.log('Google Places element focused');
        });
        
        (autocompleteElement as any).addEventListener('blur', () => {
          console.log('Google Places element blurred');
        });

        // Set placeholder and other attributes
        autocompleteElement.placeholder = placeholder || "Enter an address";
        autocompleteElement.setAttribute('data-testid', 'google-places-input');

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
          // Set placeholder for legacy input
          fallbackInputRef.current.placeholder = placeholder || "Enter an address";
          
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
        const apiKey = (import.meta.env as any).VITE_GOOGLE_PLACES_API_KEY;
        
        if (!apiKey) {
          console.warn('No Google Places API key configured, using fallback input');
          setUseFallback(true);
          return;
        }
        
        console.log('Loading Google Maps API with Places library...', 'API Key:', apiKey ? 'Present' : 'Missing');
        
        const loader = new Loader({
          apiKey: apiKey,
          version: "beta",
          libraries: ["places"]
        });

        await loader.load();
        console.log('Google Maps API loaded successfully');

        if (!mounted) return;

        // Try modern API first, fallback to legacy, then to our enhanced fallback
        try {
          initializeModernAutocomplete();
          setUseFallback(false);
        } catch (modernError) {
          console.log('Modern API failed, trying legacy:', modernError);
          try {
            if (mounted) {
              initializeLegacyAutocomplete();
              setUseFallback(false);
            }
          } catch (legacyError) {
            console.log('Legacy API also failed, using enhanced fallback:', legacyError);
            if (mounted) {
              setUseFallback(true);
            }
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
      // Try modern API first, fallback to legacy, then to enhanced fallback
      try {
        initializeModernAutocomplete();
        setUseFallback(false);
      } catch (modernError) {
        try {
          initializeLegacyAutocomplete();
          setUseFallback(false);
        } catch (legacyError) {
          console.log('Both modern and legacy APIs failed, using enhanced fallback');
          setUseFallback(true);
        }
      }
    }

    return () => {
      mounted = false;
      if (autocompleteElementRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Enhanced fallback with client-side Google Places autocomplete
  const searchAddresses = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Try using client-side Google Places API directly
    if (window.google?.maps?.places?.AutocompleteService) {
      setIsLoading(true);
      try {
        console.log('Using Google Places AutocompleteService for query:', query);
        const service = new window.google.maps.places.AutocompleteService();
        
        service.getPlacePredictions(
          {
            input: query,
            types: ['address']
          },
          (predictions: any, status: any) => {
            console.log('Google Places response:', { status, predictions });
            setIsLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const mappedSuggestions = predictions.map((p: any) => ({
                place_id: p.place_id,
                description: p.description,
                structured_formatting: p.structured_formatting
              }));
              console.log('Setting suggestions:', mappedSuggestions);
              setSuggestions(mappedSuggestions);
              setShowSuggestions(true);
            } else {
              console.log('No predictions or error status:', status);
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
        return;
      } catch (error) {
        console.error('Client-side Google Places failed:', error);
        setIsLoading(false);
      }
    } else {
      console.log('Google Places AutocompleteService not available, window.google:', !!window.google?.maps?.places);
    }

    // Fallback to simple input without suggestions
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: PlacePrediction) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Trigger place selected callback with the suggestion data
    if (onPlaceSelected) {
      onPlaceSelected({
        formatted_address: suggestion.description,
        place_id: suggestion.place_id
      });
    }
  };

  if (useFallback) {
    return (
      <div className="relative w-full">
        <Input
          ref={fallbackInputRef}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
            
            // Debounced search
            clearTimeout((window as any).addressSearchTimeout);
            (window as any).addressSearchTimeout = setTimeout(() => {
              searchAddresses(newValue);
            }, 300);
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow clicks
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder || "Enter an address"}
          className={`w-full ${className || ""}`}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur event
                  handleSuggestionSelect(suggestion);
                }}
              >
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.structured_formatting?.main_text || suggestion.description}
                </div>
                {suggestion.structured_formatting?.secondary_text && (
                  <div className="text-xs text-gray-500">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full ${className || ""}`} />
  );
}