
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MapPin, RefreshCw, ThermometerSun, Wind, Droplets, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { ThemeToggle } from '../components/theme-toggle';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      code: number;
    };
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    feelslike_c: number;
    feelslike_f: number;
    uv: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          code: number;
        };
      };
    }>;
  };
}

const WeatherPage = () => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to retrieve your location. Please enable location services.');
          toast.error('Location access denied. Weather data may not be accurate.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      toast.error('Your browser does not support geolocation.');
    }
  }, []);

  // Fetch weather data
  const { data: weatherData, isLoading, isError, error, refetch } = useQuery<WeatherData>({
    queryKey: ['weather', coordinates?.latitude, coordinates?.longitude],
    queryFn: async () => {
      if (!coordinates) throw new Error('Location coordinates not available');
      
      // Using WeatherAPI.com as an example - you would need to replace with your actual API key
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=YOUR_API_KEY&q=${coordinates.latitude},${coordinates.longitude}&days=3&aqi=no&alerts=no`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      return response.json();
    },
    enabled: !!coordinates,
    retry: 1,
  });

  const refreshLocation = () => {
    if (navigator.geolocation) {
      toast.info('Updating your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          refetch();
          toast.success('Location updated successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not update location. Please check your location settings.');
        }
      );
    }
  };

  const getWeatherIcon = (code: number) => {
    // Simple mapping of weather condition codes to icons
    if (code >= 1000 && code < 1003) return <Sun className="h-12 w-12 text-yellow-500" />;
    if (code >= 1003 && code < 1063) return <Cloud className="h-12 w-12 text-gray-500" />;
    if (code >= 1063 && code < 1200) return <CloudRain className="h-12 w-12 text-blue-500" />;
    if (code >= 1200 && code < 1300) return <CloudSnow className="h-12 w-12 text-blue-200" />;
    if (code >= 1300 && code < 1400) return <CloudFog className="h-12 w-12 text-gray-400" />;
    return <ThermometerSun className="h-12 w-12 text-orange-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Weather GPS</h1>
        <ThemeToggle />
      </header>

      {locationError && (
        <Card className="mb-6 border-red-300 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <MapPin className="h-5 w-5" />
              <p>{locationError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Location</CardTitle>
              <CardDescription>
                {coordinates 
                  ? `Lat: ${coordinates.latitude.toFixed(4)}, Long: ${coordinates.longitude.toFixed(4)}` 
                  : 'Detecting your location...'}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={refreshLocation} disabled={isLoading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error Loading Weather</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : 'Failed to load weather data. Please try again.'}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      ) : weatherData ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{weatherData.location.name}</CardTitle>
              <CardDescription>
                {weatherData.location.region}, {weatherData.location.country}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  {getWeatherIcon(weatherData.current.condition.code)}
                  <div>
                    <h2 className="text-4xl font-bold">{weatherData.current.temp_c}°C</h2>
                    <p className="text-muted-foreground">{weatherData.current.condition.text}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Feels Like</p>
                      <p className="font-medium">{weatherData.current.feelslike_c}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wind</p>
                      <p className="font-medium">{weatherData.current.wind_kph} km/h {weatherData.current.wind_dir}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="font-medium">{weatherData.current.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">UV Index</p>
                      <p className="font-medium">{weatherData.current.uv}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {weatherData.forecast && (
            <Card>
              <CardHeader>
                <CardTitle>3-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weatherData.forecast.forecastday.map((day) => (
                    <Card key={day.date}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center">
                          <p className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                          {getWeatherIcon(day.day.condition.code)}
                          <p className="mt-2">{day.day.condition.text}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="font-bold">{day.day.maxtemp_c}°</span>
                            <span className="text-muted-foreground">{day.day.mintemp_c}°</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Weather GPS App © {new Date().getFullYear()}</p>
        <p className="mt-1">Note: You'll need to replace 'YOUR_API_KEY' with an actual WeatherAPI.com API key</p>
      </footer>
    </div>
  );
};

export default WeatherPage;