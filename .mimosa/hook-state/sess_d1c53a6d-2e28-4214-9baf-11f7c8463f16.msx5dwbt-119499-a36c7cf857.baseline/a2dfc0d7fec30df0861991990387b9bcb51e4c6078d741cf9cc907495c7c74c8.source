import { IconMap, IconSatellite, IconStack2 } from '@tabler/icons-react';
import { ControlPosition, MapControl } from '@vis.gl/react-google-maps';
import { Button, DropdownMenu } from 'erxes-ui';
import { MapConfig } from '../types';

interface MapTypeConfig {
  mapTypeId: string;
  icon: any;
  label: string;
}

const MapTypeId = {
  ROADMAP: 'roadmap',
  SATELLITE: 'hybrid',
};

const MAP_CONFIGS: Record<string, MapTypeConfig> = {
  roadmap: {
    mapTypeId: MapTypeId.ROADMAP,
    icon: IconMap,
    label: 'Default',
  },
  hybrid: {
    mapTypeId: MapTypeId.SATELLITE,
    icon: IconSatellite,
    label: 'Satellite',
  },
};

const MapTypeSwitcher = ({ config }: { config: MapTypeConfig }) => {
  const Icon = MAP_CONFIGS[config.mapTypeId].icon;

  return (
    <DropdownMenu.RadioItem key={config.mapTypeId} value={config.mapTypeId}>
      <Icon />
      {config.label}
    </DropdownMenu.RadioItem>
  );
};

export const GoogleMapControl = ({
  config,
  setConfig,
}: {
  config: MapConfig;
  setConfig: (config: MapConfig) => void;
}) => {
  const { mapTypeId } = config || {};

  const handleChange = (value: string) => {
    setConfig({ mapTypeId: value });

    localStorage.setItem('erxes-google-map-mapTypeId', value);
  };

  return (
    <MapControl position={ControlPosition.TOP_RIGHT}>
      <div className="m-2">
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="outline">
              <IconStack2 className="w-6 h-6" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" className="min-w-10">
            <DropdownMenu.RadioGroup
              value={mapTypeId}
              onValueChange={(value) => handleChange(value)}
            >
              {Object.values(MAP_CONFIGS).map((config) => (
                <MapTypeSwitcher key={config.mapTypeId} config={config} />
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </MapControl>
  );
};
