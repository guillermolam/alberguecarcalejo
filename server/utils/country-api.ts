interface CountryInfo {
  name: string;
  callingCode: string;
  flagUrl: string;
  countryCode: string;
}

// Mock country information (in production, this would call actual APIs)
const COUNTRY_DATA: Record<string, CountryInfo> = {
  'spain': {
    name: 'Spain',
    callingCode: '+34',
    flagUrl: 'https://flagcdn.com/w320/es.png',
    countryCode: 'ES'
  },
  'france': {
    name: 'France',
    callingCode: '+33',
    flagUrl: 'https://flagcdn.com/w320/fr.png',
    countryCode: 'FR'
  },
  'germany': {
    name: 'Germany',
    callingCode: '+49',
    flagUrl: 'https://flagcdn.com/w320/de.png',
    countryCode: 'DE'
  },
  'italy': {
    name: 'Italy',
    callingCode: '+39',
    flagUrl: 'https://flagcdn.com/w320/it.png',
    countryCode: 'IT'
  },
  'portugal': {
    name: 'Portugal',
    callingCode: '+351',
    flagUrl: 'https://flagcdn.com/w320/pt.png',
    countryCode: 'PT'
  },
  'united kingdom': {
    name: 'United Kingdom',
    callingCode: '+44',
    flagUrl: 'https://flagcdn.com/w320/gb.png',
    countryCode: 'GB'
  },
  'united states': {
    name: 'United States',
    callingCode: '+1',
    flagUrl: 'https://flagcdn.com/w320/us.png',
    countryCode: 'US'
  }
};

export async function getCountryInfoFromAPI(countryName: string): Promise<CountryInfo> {
  const normalized = countryName.toLowerCase().trim();
  
  const countryInfo = COUNTRY_DATA[normalized];
  if (!countryInfo) {
    throw new Error(`Country "${countryName}" not found`);
  }
  
  return countryInfo;
}