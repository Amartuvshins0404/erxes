import { Combobox, Command, Filter, Popover, useQueryState } from 'erxes-ui';
import React, { useMemo, useState } from 'react';
import { ADDRESS_CITY, ADDRESS_DISTRICT } from '../constants/address';
import { IconBuilding, IconMapPin } from '@tabler/icons-react';

interface SelectAreaProps {
  city: string;
  district?: string;
  onCityChange?: (value: string) => void;
  onDistrictChange?: (value: string) => void;
  disabled?: boolean;
}

interface SelectAreaContextValue {
  city: string;
  district?: string;
  onCityChange?: (value: string) => void;
  onDistrictChange?: (value: string) => void;
  disabled?: boolean;
}

const SelectAreaContext = React.createContext<SelectAreaContextValue | null>(
  null,
);

const useSelectAreaContext = () => {
  const ctx = React.useContext(SelectAreaContext);
  if (!ctx) {
    throw new Error(
      'SelectArea sub-components must be used inside <SelectArea>',
    );
  }
  return ctx;
};

function SelectAreaRoot({
  city,
  district,
  onCityChange,
  onDistrictChange,
  children,
  disabled = false,
}: SelectAreaProps & { children?: React.ReactNode }) {
  const ctx = useMemo(
    () => ({
      city,
      district,
      onCityChange,
      onDistrictChange,
      disabled,
    }),
    [city, district, onCityChange, onDistrictChange, disabled],
  );

  return (
    <SelectAreaContext.Provider value={ctx}>
      {children}
    </SelectAreaContext.Provider>
  );
}

const SelectCityValue = () => {
  const { city } = useSelectAreaContext();
  return (
    <Combobox.Value placeholder="Select a city" value={city || undefined} />
  );
};

const SelectCityList = () => {
  const { onCityChange, onDistrictChange } = useSelectAreaContext();

  return (
    <Command>
      <Command.Input placeholder="Search city..." focusOnMount />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {ADDRESS_CITY.map((c) => (
            <Command.Item
              key={c}
              value={c}
              onSelect={() => {
                onCityChange?.(c);
                onDistrictChange?.('');
              }}
            >
              {c}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
};

const SelectCity = () => {
  const [open, setOpen] = useState(false);
  const { disabled } = useSelectAreaContext();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger disabled={disabled}>
        <SelectCityValue />
      </Combobox.Trigger>
      <Combobox.Content className="w-[--radix-popover-trigger-width] p-0">
        <SelectCityList />
      </Combobox.Content>
    </Popover>
  );
};

const SelectDistrictValue = () => {
  const { district } = useSelectAreaContext();
  return (
    <Combobox.Value
      placeholder="Select a district"
      value={district || undefined}
    />
  );
};

const SelectDistrictList = () => {
  const { city, onDistrictChange } = useSelectAreaContext();
  const districts = ADDRESS_DISTRICT[city] ?? [];

  return (
    <Command>
      <Command.Input placeholder="Search district..." focusOnMount />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {districts.map((d) => (
            <Command.Item
              key={d.value}
              value={d.value}
              onSelect={() => onDistrictChange?.(d.value)}
            >
              {d.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
};

const SelectDistrict = () => {
  const [open, setOpen] = useState(false);
  const { disabled } = useSelectAreaContext();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger disabled={disabled}>
        <SelectDistrictValue />
      </Combobox.Trigger>
      <Combobox.Content className="w-[--radix-popover-trigger-width] p-0">
        <SelectDistrictList />
      </Combobox.Content>
    </Popover>
  );
};

// ─── Filter building blocks ───────────────────────────────────────────────────

const CityCommandContent = ({ onDone }: { onDone?: () => void }) => {
  const [city, setCity] = useQueryState<string>('city');
  const [, setDistrict] = useQueryState<string>('district');

  const handleSelect = (value: string) => {
    setCity(value);
    setDistrict(null);
    onDone?.();
  };

  return (
    <Command>
      <Filter.CommandInput placeholder="Search city..." variant="secondary" />
      <Command.List className="p-1">
        {ADDRESS_CITY.map((c) => (
          <Filter.CommandItem
            key={c}
            value={c}
            onSelect={() => handleSelect(c)}
            className={city === c ? 'text-primary' : ''}
          >
            {c}
          </Filter.CommandItem>
        ))}
      </Command.List>
    </Command>
  );
};

const DistrictCommandContent = ({ onDone }: { onDone?: () => void }) => {
  const [city] = useQueryState<string>('city');
  const [district, setDistrict] = useQueryState<string>('district');
  const districts = ADDRESS_DISTRICT[city as string] ?? [];

  const handleSelect = (value: string) => {
    setDistrict(value);
    onDone?.();
  };

  return (
    <Command>
      <Filter.CommandInput
        placeholder="Search district..."
        variant="secondary"
      />
      <Command.List className="p-1">
        {districts.length === 0 ? (
          <Command.Empty>Select a city first.</Command.Empty>
        ) : (
          districts.map((d) => (
            <Filter.CommandItem
              key={d.value}
              value={d.value}
              onSelect={() => handleSelect(d.value)}
              className={district === d.value ? 'text-primary' : ''}
            >
              {d.label}
            </Filter.CommandItem>
          ))
        )}
      </Command.List>
    </Command>
  );
};

// ─── Filter items (shown in root popover list) ────────────────────────────────

const SelectCityFilterItem = () => (
  <Filter.Item value="city">
    <IconMapPin /> City
  </Filter.Item>
);

const SelectDistrictFilterItem = () => (
  <Filter.Item value="district">
    <IconBuilding />
    District
  </Filter.Item>
);

// ─── Filter sub-views (rendered inside Combobox.Content) ─────────────────────

const SelectCityFilterView = () => (
  <Filter.View filterKey="city">
    <CityCommandContent />
  </Filter.View>
);

const SelectDistrictFilterView = () => (
  <Filter.View filterKey="district">
    <DistrictCommandContent />
  </Filter.View>
);

// ─── Filter bar chips ─────────────────────────────────────────────────────────

const SelectCityFilterChip = () => {
  const [city] = useQueryState<string>('city');
  const [open, setOpen] = useState(false);

  return (
    <Filter.BarItem queryKey="city">
      <Filter.BarName>
        <IconMapPin /> City
      </Filter.BarName>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton>{city}</Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content className="w-60">
          <CityCommandContent onDone={() => setOpen(false)} />
        </Combobox.Content>
      </Popover>
    </Filter.BarItem>
  );
};

const SelectDistrictFilterChip = () => {
  const [city] = useQueryState<string>('city');
  const [district] = useQueryState<string>('district');
  const [open, setOpen] = useState(false);
  const districts = ADDRESS_DISTRICT[city as string] ?? [];
  const selectedDistrict = districts.find((d) => d.value === district);

  return (
    <Filter.BarItem queryKey="district">
      <Filter.BarName>
        <IconBuilding />
        District
      </Filter.BarName>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton>
            {selectedDistrict?.label ?? district}
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content className="w-60">
          <DistrictCommandContent onDone={() => setOpen(false)} />
        </Combobox.Content>
      </Popover>
    </Filter.BarItem>
  );
};

export const SelectArea = Object.assign(SelectAreaRoot, {
  City: SelectCity,
  District: SelectDistrict,
  CityFilterItem: SelectCityFilterItem,
  DistrictFilterItem: SelectDistrictFilterItem,
  CityFilterView: SelectCityFilterView,
  DistrictFilterView: SelectDistrictFilterView,
  CityFilterChip: SelectCityFilterChip,
  DistrictFilterChip: SelectDistrictFilterChip,
});
