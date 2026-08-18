import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { Combobox, Command, Form, Popover } from 'erxes-ui';
import { ONE_FIT_CITIES } from '../graphql/providerLocationQueries';
import type { MultilingualString, OneFitCity } from '../types/provider';

function getDisplayName(city: OneFitCity, lang: 'en' | 'mn'): string {
  const name = city.name?.[lang];
  if (name && name.trim()) return name;
  return city.name?.en || city.name?.mn || city._id;
}

function matchesValue(
  city: OneFitCity,
  value: MultilingualString | undefined,
): boolean {
  if (!value) return false;
  const enMatch = (value.en || '').trim() === (city.name?.en || '').trim();
  const mnMatch = (value.mn || '').trim() === (city.name?.mn || '').trim();
  return enMatch && mnMatch;
}

interface SelectCityProps {
  value?: MultilingualString;
  onValueChange: (value: MultilingualString) => void;
  selectedLanguage?: 'en' | 'mn';
  placeholder?: string;
  disabled?: boolean;
}

export function SelectCity({
  value,
  onValueChange,
  selectedLanguage = 'en',
  placeholder = 'Select city...',
  disabled,
}: SelectCityProps) {
  const [open, setOpen] = useState(false);

  const { data, loading, error } = useQuery(ONE_FIT_CITIES, {
    variables: { isActive: true },
  });

  const cities: OneFitCity[] = data?.oneFitCities ?? [];
  const selectedCity = cities.find((c) => matchesValue(c, value));
  const displayLabel = selectedCity
    ? getDisplayName(selectedCity, selectedLanguage)
    : value?.[selectedLanguage]?.trim()
    ? value[selectedLanguage]
    : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger
        className="w-full"
        variant="outline"
        disabled={disabled}
      >
        <Combobox.Value
          placeholder={placeholder}
          value={displayLabel || undefined}
        />
      </Combobox.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input placeholder="Search city..." />
          <Command.List className="max-h-[300px] overflow-y-auto">
            <Command.Empty>
              {loading
                ? 'Loading...'
                : error
                ? 'Error loading cities'
                : 'No city found'}
            </Command.Empty>
            {!loading &&
              !error &&
              cities.map((city) => (
                <Command.Item
                  key={city._id}
                  value={
                    getDisplayName(city, 'en') + ' ' + (city.name?.mn || '')
                  }
                  onSelect={() => {
                    onValueChange({
                      en: city.name?.en ?? '',
                      mn: city.name?.mn ?? '',
                    });
                    setOpen(false);
                  }}
                >
                  {getDisplayName(city, selectedLanguage)}
                  <Combobox.Check checked={matchesValue(city, value)} />
                </Command.Item>
              ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
}

interface SelectCityFormItemProps extends SelectCityProps {
  label?: string;
  name: string;
  control: React.ComponentProps<typeof Form.Field>['control'];
}

export function SelectCityFormItem({
  name,
  control,
  label = 'City',
  selectedLanguage,
  placeholder,
  disabled,
}: SelectCityFormItemProps) {
  return (
    <Form.Field
      control={control}
      name={name}
      render={({ field }) => (
        <Form.Item>
          {label && <Form.Label>{label}</Form.Label>}
          <Form.Control>
            <SelectCity
              value={field.value}
              onValueChange={field.onChange}
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
