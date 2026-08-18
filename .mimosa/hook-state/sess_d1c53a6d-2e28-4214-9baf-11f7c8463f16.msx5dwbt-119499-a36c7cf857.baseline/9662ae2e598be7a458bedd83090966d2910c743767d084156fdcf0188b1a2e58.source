import { Combobox, Command, Filter, Popover } from 'erxes-ui';
import { CLIENT_BUSINESS_MAIN_TYPE_OPTIONS } from '../constants/clientTypes';
import { useState } from 'react';

export const ClientBusinessTypesSelectContent = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) => {
  return (
    <Command>
      <Command.Input
        placeholder="Search business type"
        variant="secondary"
        className="bg-background"
        focusOnMount
      />
      <Command.List>
        {CLIENT_BUSINESS_MAIN_TYPE_OPTIONS.map((option) => (
          <Command.Item
            key={option.value}
            value={option.value}
            onSelect={() => onSelect(option.value)}
          >
            {option.label}
            <Combobox.Check checked={selected === option.value} />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
};

export const ClientBusinessTypesSelect = ({
  selected,
  onSelect,
  inBar,
}: {
  selected: string;
  onSelect: (value: string) => void;
  inBar?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const Trigger = inBar
    ? ({ children }: { children: React.ReactNode }) => (
        <Popover.Trigger asChild>
          <Filter.BarButton>{children}</Filter.BarButton>
        </Popover.Trigger>
      )
    : Combobox.Trigger;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger>
        <Combobox.Value
          placeholder="Select business type"
          value={
            selected
              ? CLIENT_BUSINESS_MAIN_TYPE_OPTIONS.find(
                  (option) => option.value === selected,
                )?.label
              : undefined
          }
        />
      </Trigger>
      <Combobox.Content>
        <ClientBusinessTypesSelectContent
          selected={selected}
          onSelect={(value) => {
            onSelect(value);
            setOpen(false);
          }}
        />
      </Combobox.Content>
    </Popover>
  );
};
