import { useState, useEffect } from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';

interface UnitToggleProps {
  onUnitChange: (isCelsius: boolean) => void;
}

const UnitToggle = ({ onUnitChange }: UnitToggleProps) => {
  const [isCelsius, setIsCelsius] = useState(() => {
    const saved = localStorage.getItem('weather-unit-celsius');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('weather-unit-celsius', JSON.stringify(isCelsius));
    onUnitChange(isCelsius);
  }, [isCelsius, onUnitChange]);

  const handleToggle = (checked: boolean) => {
    setIsCelsius(checked);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="unit-toggle" className="text-sm font-medium">
            Temperature Unit
          </Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="unit-toggle" className="text-sm text-muted-foreground">
              °F
            </Label>
            <Switch
              id="unit-toggle"
              checked={isCelsius}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="unit-toggle" className="text-sm text-muted-foreground">
              °C
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitToggle;