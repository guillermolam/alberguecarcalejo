import React, { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountryOption {
  code: string;
  name: string;
  phoneCode: string;
  flag: string;
}

// Comprehensive country list with flags and phone codes
const COUNTRIES: CountryOption[] = [
  { code: "ESP", name: "Spain", phoneCode: "+34", flag: "🇪🇸" },
  { code: "FRA", name: "France", phoneCode: "+33", flag: "🇫🇷" },
  { code: "DEU", name: "Germany", phoneCode: "+49", flag: "🇩🇪" },
  { code: "ITA", name: "Italy", phoneCode: "+39", flag: "🇮🇹" },
  { code: "PRT", name: "Portugal", phoneCode: "+351", flag: "🇵🇹" },
  { code: "GBR", name: "United Kingdom", phoneCode: "+44", flag: "🇬🇧" },
  { code: "USA", name: "United States", phoneCode: "+1", flag: "🇺🇸" },
  { code: "CAN", name: "Canada", phoneCode: "+1", flag: "🇨🇦" },
  { code: "AUS", name: "Australia", phoneCode: "+61", flag: "🇦🇺" },
  { code: "JPN", name: "Japan", phoneCode: "+81", flag: "🇯🇵" },
  { code: "KOR", name: "South Korea", phoneCode: "+82", flag: "🇰🇷" },
  { code: "CHN", name: "China", phoneCode: "+86", flag: "🇨🇳" },
  { code: "IND", name: "India", phoneCode: "+91", flag: "🇮🇳" },
  { code: "BRA", name: "Brazil", phoneCode: "+55", flag: "🇧🇷" },
  { code: "ARG", name: "Argentina", phoneCode: "+54", flag: "🇦🇷" },
  { code: "MEX", name: "Mexico", phoneCode: "+52", flag: "🇲🇽" },
  { code: "NLD", name: "Netherlands", phoneCode: "+31", flag: "🇳🇱" },
  { code: "BEL", name: "Belgium", phoneCode: "+32", flag: "🇧🇪" },
  { code: "CHE", name: "Switzerland", phoneCode: "+41", flag: "🇨🇭" },
  { code: "AUT", name: "Austria", phoneCode: "+43", flag: "🇦🇹" },
  { code: "SWE", name: "Sweden", phoneCode: "+46", flag: "🇸🇪" },
  { code: "NOR", name: "Norway", phoneCode: "+47", flag: "🇳🇴" },
  { code: "DNK", name: "Denmark", phoneCode: "+45", flag: "🇩🇰" },
  { code: "FIN", name: "Finland", phoneCode: "+358", flag: "🇫🇮" },
  { code: "POL", name: "Poland", phoneCode: "+48", flag: "🇵🇱" },
  { code: "CZE", name: "Czech Republic", phoneCode: "+420", flag: "🇨🇿" },
  { code: "HUN", name: "Hungary", phoneCode: "+36", flag: "🇭🇺" },
  { code: "ROU", name: "Romania", phoneCode: "+40", flag: "🇷🇴" },
  { code: "BGR", name: "Bulgaria", phoneCode: "+359", flag: "🇧🇬" },
  { code: "GRC", name: "Greece", phoneCode: "+30", flag: "🇬🇷" },
];

interface CountrySelectorProps {
  value?: string;
  onCountryChange: (country: CountryOption) => void;
  placeholder?: string;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onCountryChange,
  placeholder = "Select country...",
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = useMemo(() => {
    return COUNTRIES.find(country => country.code === value);
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!search) return COUNTRIES;
    
    const searchLower = search.toLowerCase();
    return COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(searchLower) ||
      country.phoneCode.includes(search) ||
      country.code.toLowerCase().includes(searchLower)
    );
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
              <span className="text-gray-500">({selectedCountry.phoneCode})</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search by country name or phone code..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code}
                  onSelect={() => {
                    onCountryChange(country);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="text-gray-500 ml-auto">{country.phoneCode}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};