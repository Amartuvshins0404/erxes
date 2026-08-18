import { Combobox, Command, Popover } from 'erxes-ui';
import React, { useMemo, useState } from 'react';
import { ADDRESS_CITY, ADDRESS_DISTRICT } from '../constants/address';
import { IconCheck } from '@tabler/icons-react';

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

const SelectCityList = ({ onClose }: { onClose: () => void }) => {
  const { onCityChange, onDistrictChange, city } = useSelectAreaContext();

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
                onClose();
              }}
              className="flex justify-between"
            >
              {c}
              {c === city && <IconCheck />}
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
        <SelectCityList onClose={() => setOpen(false)} />
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

const SelectDistrictList = ({ onClose }: { onClose: () => void }) => {
  const { city, onDistrictChange, district } = useSelectAreaContext();
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
              onSelect={() => {
                onDistrictChange?.(d.value);
                onClose();
              }}
              className="flex justify-between"
            >
              {d.label}
              {d.label === district && <IconCheck />}
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
        <SelectDistrictList onClose={() => setOpen(false)} />
      </Combobox.Content>
    </Popover>
  );
};

export const SelectArea = Object.assign(SelectAreaRoot, {
  City: SelectCity,
  District: SelectDistrict,
});
