import {
  APIProvider,
  ColorScheme,
  Map,
  MapMouseEvent,
  Marker,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { REACT_APP_GOOGLE_MAP_API_KEY, themeState } from 'erxes-ui';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

export interface PlaceSelectData {
  address: { en: string; mn: string };
  city: { en: string; mn: string };
  district?: { en: string; mn: string };
  coordinates: { lat: number; lng: number };
}

const DEFAULT_CENTER = { lat: 47.92123, lng: 106.918556 };

const ADDRESS_COMPONENTS: Record<string, string | string[]> = {
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

const COLOR_SCHEMA: Record<string, ColorScheme> = {
  light: 'LIGHT',
  dark: 'DARK',
  system: 'FOLLOW_SYSTEM',
};

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
): string {
  const c = components.find((a) => a.types.includes(type));
  return c?.long_name ?? '';
}

function parseGeocodeResult(
  results: google.maps.GeocoderResult[] | undefined,
  lat: number,
  lng: number,
): PlaceSelectData {
  const formatted = results?.[0]?.formatted_address ?? '';
  const components = results?.[0]?.address_components ?? [];

  let city =
    getComponent(components, ADDRESS_COMPONENTS.city as string) ||
    getComponent(components, 'locality');
  let district =
    getComponent(components, ADDRESS_COMPONENTS.district as string) ||
    getComponent(components, 'sublocality_level_1');
  const addressTypes = ADDRESS_COMPONENTS.address as string[];
  const addressParts: string[] = [];
  for (const type of addressTypes) {
    const part = getComponent(components, type);
    if (part) addressParts.push(part);
  }
  const addressStr = addressParts.length ? addressParts.join(', ') : formatted;

  return {
    address: { en: addressStr, mn: addressStr },
    city: { en: city, mn: city },
    district: district ? { en: district, mn: district } : undefined,
    coordinates: { lat, lng },
  };
}

function MapContent({
  coordinates,
  onSelect,
  disabled,
  theme,
}: {
  coordinates: { lat: number; lng: number };
  onSelect: (data: PlaceSelectData) => void;
  disabled?: boolean;
  theme: string;
}) {
  const geocodingLibrary = useMapsLibrary('geocoding');
  const [geocodingService, setGeocodingService] =
    useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!geocodingLibrary) return;
    setGeocodingService(new geocodingLibrary.Geocoder());
  }, [geocodingLibrary]);

  const handleClick = useCallback(
    async (event: MapMouseEvent) => {
      if (disabled) return;
      const { detail } = event ?? {};
      const lat = detail?.latLng?.lat;
      const lng = detail?.latLng?.lng;
      if (lat === undefined || lng === undefined) return;

      if (geocodingService) {
        const { results } =
          (await geocodingService.geocode({
            location: { lat, lng },
          })) ?? {};
        const data = parseGeocodeResult(results, lat, lng);
        onSelect(data);
      } else {
        onSelect({
          address: { en: '', mn: '' },
          city: { en: '', mn: '' },
          coordinates: { lat, lng },
        });
      }
    },
    [disabled, geocodingService, onSelect],
  );

  return (
    <div className="w-full h-full" style={{ minHeight: 280, height: '100%' }}>
      <Map
        defaultZoom={15}
        defaultCenter={coordinates}
        onClick={handleClick}
        gestureHandling="greedy"
        disableDefaultUI
        colorScheme={COLOR_SCHEMA[theme] ?? 'FOLLOW_SYSTEM'}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      >
        <Marker position={coordinates} />
      </Map>
    </div>
  );
}

export interface ProviderLocationMapProps {
  coordinates?: { lat?: number; lng?: number };
  onSelect: (data: PlaceSelectData) => void;
  disabled?: boolean;
}

export function ProviderLocationMap({
  coordinates,
  onSelect,
  disabled,
}: ProviderLocationMapProps) {
  const apiKey = REACT_APP_GOOGLE_MAP_API_KEY || 'test';
  const theme = useAtomValue(themeState);

  if (!apiKey) {
    return (
      <div
        className="w-full rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-sm"
        style={{ height: 280 }}
      >
        Set REACT_APP_GOOGLE_MAP_API_KEY to enable map selection.
      </div>
    );
  }

  const hasCoordinates = coordinates?.lat != null && coordinates?.lng != null;
  const center = hasCoordinates
    ? { lat: coordinates!.lat!, lng: coordinates!.lng! }
    : DEFAULT_CENTER;

  return (
    <div
      className="w-full rounded-md overflow-hidden border"
      style={{ height: 280, minHeight: 280 }}
    >
      <APIProvider apiKey={apiKey} language="en">
        <MapContent
          coordinates={center}
          onSelect={onSelect}
          disabled={disabled}
          theme={theme}
        />
      </APIProvider>
    </div>
  );
}
