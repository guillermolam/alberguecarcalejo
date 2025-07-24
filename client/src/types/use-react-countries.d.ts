declare module 'use-react-countries' {
  interface Country {
    name: string;
    iso2: string;
    iso3: string;
    countryCallingCode: string;
    emoji: string;
  }

  interface UseCountriesReturn {
    countries: Country[];
  }

  export function useCountries(): UseCountriesReturn;
}