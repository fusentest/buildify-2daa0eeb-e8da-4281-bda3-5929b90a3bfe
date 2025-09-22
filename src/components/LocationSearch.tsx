import { useState, useCallback } from 'react';
import { Search, MapPin, Star, StarOff } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

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

const LocationSearch = ({ onLocationSelect, currentLocation }: LocationSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedLocations, setSavedLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('weather-saved-locations');
    return saved ? JSON.parse(saved) : [];
  });

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using WeatherAPI.com search endpoint
      const response = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=YOUR_API_KEY&q=${encodeURIComponent(query)}`
      );
      
      if (response.ok) {
        const results = await response.json();
        const locations: Location[] = results.map((result: any) => ({
          id: `${result.lat}-${result.lon}`,
          name: result.name,
          region: result.region,
          country: result.country,
          lat: result.lat,
          lon: result.lon,
        }));
        setSearchResults(locations);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchLocations(searchQuery);
  };

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setSearchQuery('');
    setSearchResults([]);
    toast.success(`Weather updated for ${location.name}`);
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
      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a city or location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchLocations(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isSearching || searchQuery.length < 3}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
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