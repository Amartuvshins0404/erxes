import { Badge, Button, Combobox, Command, Popover } from 'erxes-ui';
import { SERVICE_LABELS } from '../constants/property';
import React, { useCallback, useMemo, useState } from 'react';
import { IconX } from '@tabler/icons-react';

type ServiceKey = keyof typeof SERVICE_LABELS;

interface SelectServiceProps {
  value: ServiceKey[];
  onValueChange: (value: ServiceKey[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface SelectServiceContextValue {
  selected: ServiceKey[];
  toggle: (key: ServiceKey) => void;
  placeholder: string;
}

const SelectServiceContext =
  React.createContext<SelectServiceContextValue | null>(null);

const useSelectServiceContext = () => {
  const ctx = React.useContext(SelectServiceContext);
  if (!ctx) {
    throw new Error(
      'SelectService sub-components must be used inside <SelectService>',
    );
  }
  return ctx;
};

function SelectServiceRoot({
  value,
  onValueChange,
  placeholder = 'Select services',
  disabled = false,
}: SelectServiceProps) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (key: ServiceKey) => {
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
    <SelectServiceContext.Provider value={ctx}>
      <Popover open={open} onOpenChange={setOpen}>
        <Combobox.Trigger disabled={disabled}>
          <SelectServiceValue />
        </Combobox.Trigger>
        <Combobox.Content className="w-[--radix-popover-trigger-width] p-0">
          <SelectServiceList />
        </Combobox.Content>
      </Popover>
    </SelectServiceContext.Provider>
  );
}

const SelectServiceValue = () => {
  const { selected, toggle, placeholder } = useSelectServiceContext();

  if (selected.length === 0) {
    return <Combobox.Value placeholder={placeholder} value={undefined} />;
  }

  if (selected.length === 1) {
    return (
      <Combobox.Value
        placeholder={placeholder}
        value={SERVICE_LABELS[selected[0]]}
      />
    );
  }

  return (
    <span className="flex items-center gap-1.5 flex-nowrap hide-scroll overflow-x-auto">
      {selected.map((key) => (
        <Badge key={key} variant="secondary" className="text-xs pr-0">
          {SERVICE_LABELS[key]}
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

const SelectServiceList = () => {
  const { selected, toggle } = useSelectServiceContext();

  return (
    <Command>
      <Command.Input placeholder="Search..." focusOnMount />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {Object.entries(SERVICE_LABELS).map(([key, label]) => (
            <Command.Item
              key={key}
              value={key}
              onSelect={() => toggle(key as ServiceKey)}
            >
              {label}
              <Combobox.Check checked={selected.includes(key as ServiceKey)} />
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
};

export const SelectService = Object.assign(SelectServiceRoot, {
  Value: SelectServiceValue,
  List: SelectServiceList,
});
