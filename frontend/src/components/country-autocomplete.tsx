import React, { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Check, ChevronDown } from 'lucide-react';

const countries = [
  'España', 'Portugal', 'Francia', 'Alemania', 'Italia', 'Reino Unido',
  'Estados Unidos', 'Canadá', 'Australia', 'Brasil', 'Argentina', 'México',
  'Japón', 'Corea del Sur', 'China', 'India', 'Rusia', 'Sudáfrica'
];

interface CountryAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CountryAutocomplete({ 
  value, 
  onValueChange, 
  placeholder = "Escribe o selecciona un país...",
  className 
}: CountryAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!inputValue) return countries;
    return countries.filter(country =>
      country.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (country: string) => {
    setInputValue(country);
    onValueChange(country);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    // Delay closing to allow for selection
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pr-8"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      
      {isOpen && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCountries.map((country, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between"
              onClick={() => handleSelect(country)}
            >
              <span>{country}</span>
              {value === country && <Check className="h-4 w-4 text-green-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}