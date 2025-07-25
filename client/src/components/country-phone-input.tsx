import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CountrySelector } from './country-selector';
import { countryAPIClient, type CountryInfo } from '@/lib/country-api-client';
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
      const data = await countryAPIClient.getCountryInfo(country);
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
        <div className="min-w-[200px] max-w-[250px]">
          <CountrySelector
            value={countryName || 'Spain'}
            onCountryChange={(country) => {
              onCountryChange?.(country.name);
              fetchCountryInfo(country.name);
            }}
            placeholder="Select country..."
            className="w-full"
          />
        </div>

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
          Format: {countryInfo.calling_code} + local number (without country code)
        </div>
      )}
    </div>
  );
}