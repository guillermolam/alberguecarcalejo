import { apiRequest } from './queryClient';

export interface CountryInfo {
  calling_code: string;
  flag_url: string;
  country_code: string;
  country_name: string;
}

class CountryBFFClient {
  private cache = new Map<string, { data: CountryInfo; timestamp: number }>();
  private readonly CACHE_DURATION = 3600000; // 1 hour

  async getCountryInfo(countryName: string): Promise<CountryInfo> {
    const cacheKey = countryName.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiRequest('/api/country/info', {
        method: 'POST',
        body: { countryName }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch country info: ${response.status}`);
      }

      const countryInfo: CountryInfo = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: countryInfo,
        timestamp: Date.now()
      });

      return countryInfo;
    } catch (error) {
      console.error('Error fetching country info:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const countryBFFClient = new CountryBFFClient();