import React, { useState, useMemo } from "react";
import { useCountries } from "use-react-countries";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountryOption {
  code: string;
  name: string;
  phoneCode: string;
  flag: string;           // Unicode emoji from the hook
}

interface CountrySelectorProps {
  value?: string;
  onCountryChange: (country: CountryOption) => void;
  placeholder?: string;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onCountryChange,
  placeholder = "Select country…",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // 1️⃣  Pull the live list of countries (≈ 250 rows)
  const { countries } = useCountries();

  // 2️⃣  Adapt the library objects to the shape the rest
  //     of this component already expects
  const countryOptions: CountryOption[] = useMemo(
    () =>
      countries.map((c: any) => ({
        code: c.name,                   // you can swap to iso2/iso3 if preferred
        name: c.name,
        phoneCode: `+${c.countryCallingCode}`,
        flag: c.emoji,
      })),
    [countries]
  );

  const selectedCountry = useMemo(
    () => countryOptions.find((c) => c.code === value),
    [value, countryOptions]
  );

  const filteredCountries = useMemo(() => {
    if (!search) return countryOptions;

    const s = search.toLowerCase();
    return countryOptions.filter(
      ({ name, phoneCode, code }) =>
        name.toLowerCase().includes(s) ||
        phoneCode.includes(search) ||
        code.toLowerCase().includes(s)
    );
  }, [search, countryOptions]);

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
            placeholder="Search by country or dial code…"
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
