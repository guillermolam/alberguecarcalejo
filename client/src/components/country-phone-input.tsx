import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import { countryBFFClient, type CountryInfo } from '@/lib/country-bff-client';
import { useI18n } from '@/contexts/i18n-context';



interface CountryPhoneInputProps {
  countryName?: string;
  localPhone: string;
  onLocalPhoneChange: (phone: string) => void;
  onCountryChange?: (countryName: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}

// Common countries for the phone input
const COMMON_COUNTRIES = [
  { name: 'Spain', code: 'ESP' },
  { name: 'France', code: 'FRA' },
  { name: 'Portugal', code: 'PRT' },
  { name: 'United Kingdom', code: 'GBR' },
  { name: 'Germany', code: 'DEU' },
  { name: 'Italy', code: 'ITA' },
  { name: 'United States', code: 'USA' },
  { name: 'Brazil', code: 'BRA' },
  { name: 'Argentina', code: 'ARG' },
  { name: 'Mexico', code: 'MEX' },
];

export function CountryPhoneInput({
  countryName,
  localPhone,
  onLocalPhoneChange,
  onCountryChange,
  label = "Phone Number",
  required = false,
  placeholder = "Local phone number",
  error
}: CountryPhoneInputProps) {
  const { t } = useI18n();
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (countryName && countryName.trim().length > 0) {
      fetchCountryInfo(countryName);
    } else {
      // Default to Spain for Spanish DNI/NIE
      setCountryInfo({
        country_name: 'Spain',
        country_code: 'ESP',
        calling_code: '+34',
        flag_url: 'https://flagcdn.com/w320/es.png'
      });
    }
  }, [countryName]);

  const fetchCountryInfo = async (country: string) => {
    setLoading(true);
    setFetchError(null);
    
    try {
      const data = await countryBFFClient.getCountryInfo(country);
      setCountryInfo(data);
    } catch (err) {
      console.error('Error fetching country info:', err);
      setFetchError('Unable to load country information');
      setCountryInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">
        {label} {required && '*'}
      </label>
      <div className="flex gap-2">
        {/* Country Selector with Flag and Code */}
        <Select 
          value={countryName || 'Spain'} 
          onValueChange={(value) => {
            onCountryChange?.(value);
            fetchCountryInfo(value);
          }}
        >
          <SelectTrigger className="min-w-[140px] max-w-[180px]">
            <div className="flex items-center gap-2 overflow-hidden">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 bg-gray-200 animate-pulse rounded"></div>
                  <span className="text-sm text-gray-500">...</span>
                </div>
              ) : countryInfo ? (
                <>
                  <img 
                    src={countryInfo.flag_url} 
                    alt={`${countryInfo.country_name} flag`}
                    className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {countryInfo.calling_code}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 bg-gray-200 rounded-sm"></div>
                  <span className="text-sm text-gray-500">+--</span>
                </div>
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            {COMMON_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.name}>
                <div className="flex items-center gap-2">
                  <img 
                    src={`https://flagcdn.com/w320/${country.code.toLowerCase().slice(0, 2)}.png`}
                    alt={`${country.name} flag`}
                    className="w-5 h-4 object-cover rounded-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span>{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Local Phone Number Input */}
        <div className="flex-1">
          <Input
            type="tel"
            value={localPhone}
            onChange={(e) => {
              // Only allow numeric characters and common phone separators
              const value = e.target.value.replace(/[^0-9\s\-\+\(\)]/g, '');
              onLocalPhoneChange(value);
            }}
            placeholder={placeholder}
            maxLength={15}
            className={error ? 'border-red-500' : ''}
          />
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-600 mt-1">{error}</div>
      )}
      
      {fetchError && (
        <div className="text-sm text-red-600 mt-1">{fetchError}</div>
      )}
      
      {countryInfo && (
        <div className="text-xs text-gray-500 mt-1">
          Formato: {countryInfo.calling_code} + número local (sin código país)
        </div>
      )}
    </div>
  );
}