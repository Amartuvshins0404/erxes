import { useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import { Combobox, Command, Form, Popover } from 'erxes-ui';
import { ONE_FIT_CITIES } from '../graphql/providerLocationQueries';
import { ONE_FIT_DISTRICTS } from '../graphql/providerLocationQueries';
import type {
  MultilingualString,
  MultilingualStringOptional,
  OneFitCity,
  OneFitDistrict,
} from '../types/provider';

function getCityIdFromValue(
  cityValue: MultilingualString | undefined,
  cities: OneFitCity[],
): string | undefined {
  if (!cityValue) return undefined;
  const en = (cityValue.en || '').trim();
  const mn = (cityValue.mn || '').trim();
  const found = cities.find(
    (c) => (c.name?.en || '').trim() === en && (c.name?.mn || '').trim() === mn,
  );
  return found?._id;
}

function getDistrictDisplayName(
  district: OneFitDistrict,
  lang: 'en' | 'mn',
): string {
  const name = district.name?.[lang];
  if (name && name.trim()) return name;
  return district.name?.en || district.name?.mn || district._id;
}

function matchesDistrictValue(
  district: OneFitDistrict,
  value: MultilingualStringOptional | undefined,
): boolean {
  if (!value) return false;
  const enMatch = (value.en || '').trim() === (district.name?.en || '').trim();
  const mnMatch = (value.mn || '').trim() === (district.name?.mn || '').trim();
  return enMatch && mnMatch;
}

interface SelectDistrictProps {
  value?: MultilingualStringOptional;
  onValueChange: (value: MultilingualStringOptional | undefined) => void;
  cityValue?: MultilingualString;
  selectedLanguage?: 'en' | 'mn';
  placeholder?: string;
  disabled?: boolean;
}

export function SelectDistrict({
  value,
  onValueChange,
  cityValue,
  selectedLanguage = 'en',
  placeholder = 'Select district...',
  disabled,
}: SelectDistrictProps) {
  const [open, setOpen] = useState(false);

  const { data: citiesData } = useQuery(ONE_FIT_CITIES, {
    variables: { isActive: true },
  });

  const cities: OneFitCity[] = citiesData?.oneFitCities ?? [];
  const cityId = useMemo(
    () => getCityIdFromValue(cityValue, cities),
    [cityValue, cities],
  );

  const {
    data: districtsData,
    loading,
    error,
  } = useQuery(ONE_FIT_DISTRICTS, {
    variables: { cityId: cityId ?? undefined, isActive: true },
    skip: !cityId,
  });

  const districts: OneFitDistrict[] = districtsData?.oneFitDistricts ?? [];
  const selectedDistrict = districts.find((d) =>
    matchesDistrictValue(d, value),
  );
  const displayLabel = selectedDistrict
    ? getDistrictDisplayName(selectedDistrict, selectedLanguage)
    : value?.[selectedLanguage]?.trim()
    ? value[selectedLanguage]
    : '';

  const hasCity = !!cityId;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger
        className="w-full"
        variant="outline"
        disabled={disabled || !hasCity}
      >
        <Combobox.Value
          placeholder={!hasCity ? 'Select a city first' : placeholder}
          value={displayLabel || undefined}
        />
      </Combobox.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input placeholder="Search district..." />
          <Command.List className="max-h-[300px] overflow-y-auto">
            <Command.Empty>
              {!hasCity
                ? 'Select a city first'
                : loading
                ? 'Loading...'
                : error
                ? 'Error loading districts'
                : 'No district found'}
            </Command.Empty>
            {hasCity && !loading && !error && (
              <Command.Item
                value="__none__"
                onSelect={() => {
                  onValueChange(undefined);
                  setOpen(false);
                }}
              >
                None
                <Combobox.Check checked={!value?.en && !value?.mn} />
              </Command.Item>
            )}
            {hasCity &&
              !loading &&
              !error &&
              districts.map((district) => (
                <Command.Item
                  key={district._id}
                  value={
                    getDistrictDisplayName(district, 'en') +
                    ' ' +
                    (district.name?.mn || '')
                  }
                  onSelect={() => {
                    onValueChange({
                      en: district.name?.en ?? '',
                      mn: district.name?.mn ?? '',
                    });
                    setOpen(false);
                  }}
                >
                  {getDistrictDisplayName(district, selectedLanguage)}
                  <Combobox.Check
                    checked={matchesDistrictValue(district, value)}
                  />
                </Command.Item>
              ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
}

interface SelectDistrictFormItemProps extends SelectDistrictProps {
  label?: string;
  name: string;
  control: React.ComponentProps<typeof Form.Field>['control'];
}

export function SelectDistrictFormItem({
  name,
  control,
  label = 'District',
  cityValue,
  selectedLanguage,
  placeholder,
  disabled,
}: SelectDistrictFormItemProps) {
  return (
    <Form.Field
      control={control}
      name={name}
      render={({ field }) => (
        <Form.Item>
          {label && <Form.Label>{label}</Form.Label>}
          <Form.Control>
            <SelectDistrict
              value={field.value}
              onValueChange={field.onChange}
              cityValue={cityValue}
              selectedLanguage={selectedLanguage}
              placeholder={placeholder}
              disabled={disabled}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
}
