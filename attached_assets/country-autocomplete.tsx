import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  nationality: string;
}

// Comprehensive country list with nationality information
const COUNTRIES: Country[] = [
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸', nationality: 'ESP' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', nationality: 'FRA' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹', nationality: 'PRT' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹', nationality: 'ITA' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', nationality: 'DEU' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', nationality: 'GBR' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', nationality: 'USA' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱', nationality: 'NLD' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪', nationality: 'BEL' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭', nationality: 'CHE' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹', nationality: 'AUT' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱', nationality: 'POL' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: '🇨🇿', nationality: 'CZE' },
  { name: 'Hungary', code: 'HU', dialCode: '+36', flag: '🇭🇺', nationality: 'HUN' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪', nationality: 'SWE' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴', nationality: 'NOR' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰', nationality: 'DNK' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮', nationality: 'FIN' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪', nationality: 'IRL' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', nationality: 'CAN' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', nationality: 'AUS' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', nationality: 'NZL' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', nationality: 'JPN' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', nationality: 'KOR' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳', nationality: 'CHN' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷', nationality: 'BRA' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷', nationality: 'ARG' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽', nationality: 'MEX' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱', nationality: 'CHL' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴', nationality: 'COL' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪', nationality: 'PER' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: '🇪🇨', nationality: 'ECU' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598', flag: '🇺🇾', nationality: 'URY' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58', flag: '🇻🇪', nationality: 'VEN' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', nationality: 'IND' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', nationality: 'IDN' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', nationality: 'THA' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', nationality: 'VNM' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', nationality: 'PHL' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', nationality: 'MYS' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', nationality: 'SGP' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', nationality: 'ZAF' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦', nationality: 'MAR' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬', nationality: 'EGY' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷', nationality: 'TUR' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱', nationality: 'ISR' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺', nationality: 'RUS' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380', flag: '🇺🇦', nationality: 'UKR' },
  { name: 'Romania', code: 'RO', dialCode: '+40', flag: '🇷🇴', nationality: 'ROU' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359', flag: '🇧🇬', nationality: 'BGR' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷', nationality: 'GRC' },
  { name: 'Croatia', code: 'HR', dialCode: '+385', flag: '🇭🇷', nationality: 'HRV' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386', flag: '🇸🇮', nationality: 'SVN' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421', flag: '🇸🇰', nationality: 'SVK' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370', flag: '🇱🇹', nationality: 'LTU' },
  { name: 'Latvia', code: 'LV', dialCode: '+371', flag: '🇱🇻', nationality: 'LVA' },
  { name: 'Estonia', code: 'EE', dialCode: '+372', flag: '🇪🇪', nationality: 'EST' }
];

interface CountryAutocompleteProps {
  value?: string;
  onCountrySelect: (country: Country) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export const CountryAutocomplete: React.FC<CountryAutocompleteProps> = ({
  value = '',
  onCountrySelect,
  placeholder = 'Select country...',
  className = '',
  error
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update search value when value prop changes (from OCR or other sources)
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Find matching countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    country.nationality.toLowerCase().includes(searchValue.toLowerCase()) ||
    country.code.toLowerCase().includes(searchValue.toLowerCase())
  ).slice(0, 10); // Limit to 10 results for performance

  const handleCountrySelect = (country: Country) => {
    setSearchValue(country.name);
    setOpen(false);
    
    // Call the callback with complete country information
    onCountrySelect(country);
    
    // Blur the input to hide mobile keyboard
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    setOpen(true);
  };

  const selectedCountry = COUNTRIES.find(country => 
    country.name.toLowerCase() === searchValue.toLowerCase()
  );

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                'pr-10',
                error ? 'border-red-500' : '',
                className
              )}
              onFocus={() => setOpen(true)}
              autoComplete="country"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {selectedCountry && (
                <span className="text-lg mr-1" title={selectedCountry.name}>
                  {selectedCountry.flag}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search countries..." 
              value={searchValue}
              onValueChange={handleInputChange}
            />
            <CommandList>
              <CommandEmpty>No countries found.</CommandEmpty>
              <CommandGroup>
                {filteredCountries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={country.name}
                    onSelect={() => handleCountrySelect(country)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-sm text-gray-500">{country.dialCode}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        searchValue.toLowerCase() === country.name.toLowerCase()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default CountryAutocomplete;