import {
  APIProvider,
  ColorScheme,
  Map,
  MapMouseEvent,
  Marker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { REACT_APP_GOOGLE_MAP_API_KEY, themeState } from 'erxes-ui';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { MapConfig } from '../types/map';
import { GoogleMapControl } from './GoogleMapControl';

const COLOR_SCHEMA: any = {
  light: 'LIGHT',
  dark: 'DARK',
  system: 'FOLLOW_SYSTEM',
};

const ADDRESS_COMPONENTS = {
  city: 'administrative_area_level_1',
  district: 'administrative_area_level_2',
  address: [
    'postal_code',
    'sublocality_level_1',
    'route',
    'premise',
    'street_number',
  ],
};

export const GoogleMap = ({
  coordinate,
  onSelect,
}: {
  coordinate?: { lat?: number; lng?: number };
  onSelect?: (value: {
    lat: number;
    lng: number;
    city?: string;
    district?: string;
    address?: string;
  }) => void;
} = {}) => {
  const theme = useAtomValue(themeState);

  const coordinates = {
    lat: coordinate?.lat ?? 47.92123,
    lng: coordinate?.lng ?? 106.918556,
  };

  return (
    <APIProvider apiKey={REACT_APP_GOOGLE_MAP_API_KEY || ''} language="mn">
      <MapContent coordinates={coordinates} onSelect={onSelect} theme={theme} />
    </APIProvider>
  );
};

const MapContent = ({
  coordinates,
  onSelect,
  theme,
}: {
  coordinates: { lat: number; lng: number };
  onSelect?: (value: {
    lat: number;
    lng: number;
    city?: string;
    district?: string;
    address?: string;
  }) => void;
  theme: string;
}) => {
  const map = useMap();
  const geocodingLibrary = useMapsLibrary('geocoding');

  const [geocodingService, setGeocodingService] =
    useState<google.maps.Geocoder | null>(null);

  const [config, setConfig] = useState<MapConfig>({
    mapTypeId: localStorage.getItem('erxes-google-map-mapTypeId') || 'roadmap',
  });

  useEffect(() => {
    if (!geocodingLibrary || !map) return;

    setGeocodingService(new geocodingLibrary.Geocoder());
  }, [geocodingLibrary, map]);

  const handleClick = async (event: MapMouseEvent) => {
    const { detail } = event || {};

    if (detail?.latLng?.lat && detail?.latLng?.lng) {
      onSelect?.({ lat: detail.latLng.lat, lng: detail.latLng.lng });
    }

    if (geocodingLibrary && detail.latLng) {
      const { results } =
        (await geocodingService?.geocode({
          location: detail.latLng,
        })) || {};

      const addresses = results?.[0]?.address_components || [];

      if (addresses?.length) {
        const address = {
          city: '',
          district: '',
          address: '',
        };

        for (const ADDRESS_COMPONENT_KEY in ADDRESS_COMPONENTS) {
          const key = ADDRESS_COMPONENT_KEY as keyof typeof ADDRESS_COMPONENTS;

          const ADDRESS_COMPONENT = ADDRESS_COMPONENTS[key];

          if (!ADDRESS_COMPONENT) continue;

          if (Array.isArray(ADDRESS_COMPONENT)) {
            const components = [];

            for (const COMPONENT_TYPE of ADDRESS_COMPONENT) {
              const component = addresses.find((address) =>
                address.types.includes(COMPONENT_TYPE),
              );

              if (component) {
                components.push(component.long_name);
              }
            }

            if (components.length) {
              address[key] = components.join(', ');
            }

            continue;
          }

          address[key] =
            addresses.find((address) =>
              address.types.includes(ADDRESS_COMPONENT),
            )?.long_name || '';
        }

        onSelect?.({
          ...address,
          lat: detail.latLng.lat,
          lng: detail.latLng.lng,
        });
      }
    }
  };

  return (
    <Map
      defaultZoom={15}
      defaultCenter={coordinates}
      onClick={handleClick}
      gestureHandling="greedy"
      disableDefaultUI
      colorScheme={COLOR_SCHEMA[theme] as ColorScheme}
      mapTypeId={config.mapTypeId}
    >
      <GoogleMapControl config={config} setConfig={setConfig} />
      <Marker position={coordinates} />
    </Map>
  );
};
