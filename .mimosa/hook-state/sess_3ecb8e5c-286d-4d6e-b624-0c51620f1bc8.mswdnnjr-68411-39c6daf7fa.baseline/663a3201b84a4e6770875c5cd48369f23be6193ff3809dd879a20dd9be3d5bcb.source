import { Badge, Button, Combobox, Command, Popover } from 'erxes-ui';
import { CLIENT_TYPE_LABELS } from '../constants/property';
import React, { useCallback, useMemo, useState } from 'react';
import { IconX } from '@tabler/icons-react';

type ClientTypeKey = keyof typeof CLIENT_TYPE_LABELS;

interface SelectClientTypeProps {
  value: ClientTypeKey[];
  onValueChange: (value: ClientTypeKey[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface SelectClientTypeContextValue {
  selected: ClientTypeKey[];
  toggle: (key: ClientTypeKey) => void;
  placeholder: string;
}

const SelectClientTypeContext =
  React.createContext<SelectClientTypeContextValue | null>(null);

const useSelectClientTypeContext = () => {
  const ctx = React.useContext(SelectClientTypeContext);
  if (!ctx) {
    throw new Error(
      'SelectClientType sub-components must be used inside <SelectClientType>',
    );
  }
  return ctx;
};

function SelectClientTypeRoot({
  value,
  onValueChange,
  placeholder = 'Select client types',
  disabled = false,
}: SelectClientTypeProps) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (key: ClientTypeKey) => {
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
    <SelectClientTypeContext.Provider value={ctx}>
      <Popover open={open} onOpenChange={setOpen}>
        <Combobox.Trigger disabled={disabled}>
          <SelectClientTypeValue />
        </Combobox.Trigger>
        <Combobox.Content className="w-[--radix-popover-trigger-width] p-0">
          <SelectClientTypeList />
        </Combobox.Content>
      </Popover>
    </SelectClientTypeContext.Provider>
  );
}

const SelectClientTypeValue = () => {
  const { selected, toggle, placeholder } = useSelectClientTypeContext();

  if (selected.length === 0) {
    return <Combobox.Value placeholder={placeholder} value={undefined} />;
  }

  if (selected.length === 1) {
    return (
      <Combobox.Value
        placeholder={placeholder}
        value={CLIENT_TYPE_LABELS[selected[0]]}
      />
    );
  }

  return (
    <span className="flex items-center gap-1.5 flex-nowrap hide-scroll overflow-x-auto">
      {selected.map((key) => (
        <Badge key={key} variant="secondary" className="text-xs pr-0">
          {CLIENT_TYPE_LABELS[key]}
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

const SelectClientTypeList = () => {
  const { selected, toggle } = useSelectClientTypeContext();

  return (
    <Command>
      <Command.Input placeholder="Search..." focusOnMount />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {Object.entries(CLIENT_TYPE_LABELS).map(([key, label]) => (
            <Command.Item
              key={key}
              value={key}
              onSelect={() => toggle(key as ClientTypeKey)}
            >
              {label}
              <Combobox.Check
                checked={selected.includes(key as ClientTypeKey)}
              />
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
};

export const SelectClientType = Object.assign(SelectClientTypeRoot, {
  Value: SelectClientTypeValue,
  List: SelectClientTypeList,
});
