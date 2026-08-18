import { Badge, Button, Combobox, Command, Popover } from 'erxes-ui';
import { PROPERTY_TYPE_LABELS } from '../constants/property';
import React, { useCallback, useMemo, useState } from 'react';
import { IconX } from '@tabler/icons-react';

type PropertyTypeKey = keyof typeof PROPERTY_TYPE_LABELS;

interface SelectPropertyTypeProps {
  value: PropertyTypeKey[];
  onValueChange: (value: PropertyTypeKey[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface SelectPropertyTypeContextValue {
  selected: PropertyTypeKey[];
  toggle: (key: PropertyTypeKey) => void;
  placeholder: string;
}

const SelectPropertyTypeContext =
  React.createContext<SelectPropertyTypeContextValue | null>(null);

const useSelectPropertyTypeContext = () => {
  const ctx = React.useContext(SelectPropertyTypeContext);
  if (!ctx) {
    throw new Error(
      'SelectPropertyType sub-components must be used inside <SelectPropertyType>',
    );
  }
  return ctx;
};

function SelectPropertyTypeRoot({
  value,
  onValueChange,
  placeholder = 'Select property types',
  disabled = false,
}: SelectPropertyTypeProps) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (key: PropertyTypeKey) => {
      if (value.includes(key)) {
        onValueChange(value.filter((v) => v !== key));
      } else {
        onValueChange([...value, key]);
      }
    },
    [value, onValueChange],
  );

  const ctx = useMemo(
    () => ({ selected: value, toggle, placeholder }),
    [value, toggle, placeholder],
  );

  return (
    <SelectPropertyTypeContext.Provider value={ctx}>
      <Popover open={open} onOpenChange={setOpen}>
        <Combobox.Trigger disabled={disabled}>
          <SelectPropertyTypeValue />
        </Combobox.Trigger>
        <Combobox.Content className="w-[--radix-popover-trigger-width] p-0">
          <SelectPropertyTypeList />
        </Combobox.Content>
      </Popover>
    </SelectPropertyTypeContext.Provider>
  );
}

const SelectPropertyTypeValue = () => {
  const { selected, toggle, placeholder } = useSelectPropertyTypeContext();

  if (selected.length === 0) {
    return <Combobox.Value placeholder={placeholder} value={undefined} />;
  }

  if (selected.length === 1) {
    return (
      <Combobox.Value
        placeholder={placeholder}
        value={PROPERTY_TYPE_LABELS[selected[0]]}
      />
    );
  }

  return (
    <span className="flex items-center gap-1.5 flex-nowrap hide-scroll overflow-x-auto">
      {selected.map((key) => (
        <Badge key={key} variant="secondary" className="text-xs pr-0">
          {PROPERTY_TYPE_LABELS[key]}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggle(key);
            }}
          >
            <IconX size={10} />
          </Button>
        </Badge>
      ))}
    </span>
  );
};

const SelectPropertyTypeList = () => {
  const { selected, toggle } = useSelectPropertyTypeContext();

  return (
    <Command>
      <Command.Input placeholder="Search..." focusOnMount />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
            <Command.Item
              key={key}
              value={key}
              onSelect={() => toggle(key as PropertyTypeKey)}
            >
              {label}
              <Combobox.Check
                checked={selected.includes(key as PropertyTypeKey)}
              />
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
};

export const SelectPropertyType = Object.assign(SelectPropertyTypeRoot, {
  Value: SelectPropertyTypeValue,
  List: SelectPropertyTypeList,
});
