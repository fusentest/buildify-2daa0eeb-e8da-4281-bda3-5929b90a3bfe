import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { geocodingService, type GeocodingResult, type GeocodingError } from '../services/geocodingService';

interface UseLocationSearchOptions {
  debounceMs?: number;
  minSearchLength?: number;
  maxResults?: number;
}

interface UseLocationSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: GeocodingResult[];
  isSearching: boolean;
  searchError: GeocodingError | null;
  manualSearch: (query: string) => Promise<GeocodingResult[]>;
  clearResults: () => void;
  validateInput: (input: string) => { isValid: boolean; error?: string };
}

export const useLocationSearch = (options: UseLocationSearchOptions = {}): UseLocationSearchReturn => {
  const {
    debounceMs = 300,
    minSearchLength = 3,
    maxResults = 10
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<GeocodingError | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search query for API calls
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Update debounced query with delay
  const updateDebouncedQuery = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
  }, [debounceMs]);

  // Update search query and trigger debounced search
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchError(null);
    
    if (query.length >= minSearchLength) {
      updateDebouncedQuery(query);
    } else {
      setDebouncedQuery('');
    }
  }, [minSearchLength, updateDebouncedQuery]);

  // React Query for automatic search suggestions
  const {
    data: searchResults = [],
    isLoading: isSearching,
    error: queryError
  } = useQuery({
    queryKey: ['location-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < minSearchLength) {
        return [];
      }

      try {
        const results = await geocodingService.getSuggestions(debouncedQuery);
        return results.slice(0, maxResults);
      } catch (error) {
        console.error('Search suggestions error:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length >= minSearchLength,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Manual search function for explicit searches
  const manualSearch = useCallback(async (query: string): Promise<GeocodingResult[]> => {
    setSearchError(null);
    
    try {
      const validation = geocodingService.validateLocationInput(query);
      if (!validation.isValid) {
        const error = {
          message: validation.error || 'Invalid input',
          code: 'INVALID_INPUT' as const
        };
        setSearchError(error);
        throw error;
      }

      const results = await geocodingService.geocodeLocation(query);
      return results.slice(0, maxResults);
    } catch (error) {
      const geocodingError = error as GeocodingError;
      setSearchError(geocodingError);
      throw geocodingError;
    }
  }, [maxResults]);

  // Clear search results
  const clearResults = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchError(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Validate input function
  const validateInput = useCallback((input: string) => {
    return geocodingService.validateLocationInput(input);
  }, []);

  // Handle React Query errors
  if (queryError && !searchError) {
    setSearchError({
      message: 'Failed to search locations',
      code: 'API_ERROR'
    });
  }

  return {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    searchResults,
    isSearching,
    searchError,
    manualSearch,
    clearResults,
    validateInput
  };
};