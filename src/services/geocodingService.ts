import { toast } from 'sonner';

export interface GeocodingResult {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  formatted_address?: string;
}

export interface GeocodingError {
  message: string;
  code: 'INVALID_INPUT' | 'NO_RESULTS' | 'API_ERROR' | 'NETWORK_ERROR';
}

class GeocodingService {
  private readonly API_KEY = 'YOUR_API_KEY'; // Replace with actual API key
  private readonly BASE_URL = 'https://api.weatherapi.com/v1';

  /**
   * Geocode a location string to coordinates
   */
  async geocodeLocation(locationString: string): Promise<GeocodingResult[]> {
    if (!locationString || locationString.trim().length < 2) {
      throw new GeocodingError({
        message: 'Location must be at least 2 characters long',
        code: 'INVALID_INPUT'
      });
    }

    const cleanedInput = locationString.trim();
    
    try {
      const response = await fetch(
        `${this.BASE_URL}/search.json?key=${this.API_KEY}&q=${encodeURIComponent(cleanedInput)}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new GeocodingError({
            message: 'Invalid API key. Please check your configuration.',
            code: 'API_ERROR'
          });
        }
        if (response.status === 429) {
          throw new GeocodingError({
            message: 'Too many requests. Please try again later.',
            code: 'API_ERROR'
          });
        }
        throw new GeocodingError({
          message: 'Failed to fetch location data',
          code: 'API_ERROR'
        });
      }

      const results = await response.json();
      
      if (!Array.isArray(results) || results.length === 0) {
        throw new GeocodingError({
          message: `No locations found for "${cleanedInput}". Try a different search term.`,
          code: 'NO_RESULTS'
        });
      }

      return results.map((result: any) => ({
        id: `${result.lat}-${result.lon}`,
        name: result.name,
        region: result.region || '',
        country: result.country,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        formatted_address: `${result.name}, ${result.region ? result.region + ', ' : ''}${result.country}`
      }));

    } catch (error) {
      if (error instanceof GeocodingError) {
        throw error;
      }
      
      console.error('Geocoding error:', error);
      throw new GeocodingError({
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      });
    }
  }

  /**
   * Validate location input
   */
  validateLocationInput(input: string): { isValid: boolean; error?: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Location is required' };
    }

    const trimmed = input.trim();
    
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Location must be at least 2 characters long' };
    }

    if (trimmed.length > 100) {
      return { isValid: false, error: 'Location must be less than 100 characters' };
    }

    // Check for potentially malicious input
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:/i
    ];

    if (dangerousPatterns.some(pattern => pattern.test(trimmed))) {
      return { isValid: false, error: 'Invalid characters in location' };
    }

    return { isValid: true };
  }

  /**
   * Get suggestions for partial input
   */
  async getSuggestions(partialInput: string): Promise<GeocodingResult[]> {
    if (partialInput.length < 3) {
      return [];
    }

    try {
      return await this.geocodeLocation(partialInput);
    } catch (error) {
      // Silently fail for suggestions to avoid spamming user with errors
      console.warn('Failed to get suggestions:', error);
      return [];
    }
  }
}

// Create singleton instance
export const geocodingService = new GeocodingService();

// Helper function for manual location entry with user feedback
export const handleManualLocationEntry = async (
  locationString: string,
  onSuccess: (location: GeocodingResult) => void,
  onError?: (error: GeocodingError) => void
): Promise<void> => {
  try {
    // Validate input first
    const validation = geocodingService.validateLocationInput(locationString);
    if (!validation.isValid) {
      const error = new GeocodingError({
        message: validation.error || 'Invalid input',
        code: 'INVALID_INPUT'
      });
      
      toast.error(error.message);
      onError?.(error);
      return;
    }

    // Show loading state
    toast.info('Searching for location...');

    // Geocode the location
    const results = await geocodingService.geocodeLocation(locationString);
    
    if (results.length === 0) {
      const error = new GeocodingError({
        message: `No locations found for "${locationString}"`,
        code: 'NO_RESULTS'
      });
      
      toast.error(error.message);
      onError?.(error);
      return;
    }

    // Use the first result (most relevant)
    const location = results[0];
    
    toast.success(`Found: ${location.formatted_address}`);
    onSuccess(location);

  } catch (error) {
    const geocodingError = error instanceof GeocodingError 
      ? error 
      : new GeocodingError({
          message: 'Failed to find location',
          code: 'API_ERROR'
        });
    
    toast.error(geocodingError.message);
    onError?.(geocodingError);
  }
};