import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '../lib/utils';

const countries = [
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
];

interface CountrySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelector({ 
  value, 
  onValueChange, 
  placeholder = "Seleccionar país...",
  className 
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCountry = countries.find(country => country.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandEmpty>No se encontró ningún país.</CommandEmpty>
          <CommandGroup>
            {countries.map((country) => (
              <CommandItem
                key={country.code}
                onSelect={() => {
                  onValueChange(country.code);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === country.code ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}