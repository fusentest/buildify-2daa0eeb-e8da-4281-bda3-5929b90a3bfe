import { useState, useCallback } from 'react';
import { Search, MapPin, Star, StarOff, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { toast } from 'sonner';
import { useLocationSearch } from '../hooks/useLocationSearch';
import { handleManualLocationEntry, type GeocodingResult } from '../services/geocodingService';

interface Location {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  currentLocation?: Location | null;
}

// Form validation schema
const manualLocationSchema = z.object({
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Location contains invalid characters')
});

type ManualLocationForm = z.infer<typeof manualLocationSchema>;

const LocationSearch = ({ onLocationSelect, currentLocation }: LocationSearchProps) => {
  const [savedLocations, setSavedLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('weather-saved-locations');
    return saved ? JSON.parse(saved) : [];
  });
  const [isManualSearching, setIsManualSearching] = useState(false);

  // Use the location search hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    manualSearch,
    clearResults
  } = useLocationSearch({
    debounceMs: 300,
    minSearchLength: 3,
    maxResults: 8
  });

  // Form for manual location entry
  const form = useForm<ManualLocationForm>({
    resolver: zodResolver(manualLocationSchema),
    defaultValues: {
      location: ''
    }
  });

  // Convert GeocodingResult to Location
  const convertToLocation = (result: GeocodingResult): Location => ({
    id: result.id,
    name: result.name,
    region: result.region,
    country: result.country,
    lat: result.lat,
    lon: result.lon
  });

  // Handle location selection from search results
  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setSearchQuery('');
    clearResults();
    form.reset();
    toast.success(`Weather updated for ${location.name}`);
  };

  // Handle manual location entry form submission
  const onManualSubmit = async (data: ManualLocationForm) => {
    setIsManualSearching(true);
    
    await handleManualLocationEntry(
      data.location,
      (result) => {
        const location = convertToLocation(result);
        handleLocationSelect(location);
      },
      (error) => {
        console.error('Manual location entry error:', error);
        // Error is already shown via toast in handleManualLocationEntry
      }
    );
    
    setIsManualSearching(false);
  };

  const toggleSavedLocation = (location: Location) => {
    const isCurrentlySaved = savedLocations.some(saved => saved.id === location.id);
    
    let newSavedLocations: Location[];
    if (isCurrentlySaved) {
      newSavedLocations = savedLocations.filter(saved => saved.id !== location.id);
      toast.success(`Removed ${location.name} from favorites`);
    } else {
      newSavedLocations = [...savedLocations, location];
      toast.success(`Added ${location.name} to favorites`);
    }
    
    setSavedLocations(newSavedLocations);
    localStorage.setItem('weather-saved-locations', JSON.stringify(newSavedLocations));
  };

  const isLocationSaved = (location: Location) => {
    return savedLocations.some(saved => saved.id === location.id);
  };

  return (
    <div className="space-y-4">
      {/* Auto-complete Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Search Locations</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Start typing a city name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Manual Location Entry Form */}
            <div>
              <h3 className="text-sm font-medium mb-2">Or Enter Location Manually</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onManualSubmit)} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="e.g., New York, London, Tokyo"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={isManualSearching}
                    className="shrink-0"
                  >
                    {isManualSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      'Find Location'
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Error */}
      {searchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-complete Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Search Results</h3>
            <div className="space-y-2">
              {searchResults.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleLocationSelect(location)}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.region}, {location.country}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSavedLocation(location);
                    }}
                  >
                    {isLocationSaved(location) ? (
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Saved Locations</h3>
            <div className="flex flex-wrap gap-2">
              {savedLocations.map((location) => (
                <Badge
                  key={location.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleLocationSelect(location)}
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {location.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;