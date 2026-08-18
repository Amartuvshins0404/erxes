import clsx from 'clsx';
import {
  Badge,
  Combobox,
  Command,
  Popover,
  SelectOperationContent,
  PopoverScoped,
  SelectTriggerOperation,
  SelectTriggerVariant,
  Button,
} from 'erxes-ui';
import { useState } from 'react';
import { PriorityBadge, PriorityIcon, PriorityTitle } from './PriorityInline';
import { CONTRACT_PRIORITIES_OPTIONS } from '../constants/priorityLabels';
import React from 'react';
import { IconSelector } from '@tabler/icons-react';

export const SelectContractType = () => {
  const [value, setValue] = useState<string>('main');
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <Popover.Trigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Button
          className="h-6 border pl-2 pr-1"
          size="sm"
          variant="secondary"
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        >
          {value}
          <IconSelector className="size-4 ml-2 text-muted-foreground" />
        </Button>
      </Popover.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {['main', 'reinsurance', 'other'].map((type) => (
              <Command.Item
                value={type}
                onSelect={() => {
                  setValue(type);
                  setOpen(false);
                }}
              >
                {type}
                <Combobox.Check checked={value === type} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

export const SelectContractCategory = () => {
  const [value, setValue] = useState<string>('insurance');
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Badge variant="secondary">{value}</Badge>
      </Popover.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {['insurance', 'main', 'reinsurance', 'other'].map((type) => (
              <Command.Item
                value={type}
                onSelect={() => {
                  setValue(type);
                  setOpen(false);
                }}
              >
                {type}
                <Combobox.Check checked={value === type} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

export const SelectContractPriority = () => {
  const [value, setValue] = useState<string>('high');
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Badge variant="secondary">{value}</Badge>
      </Popover.Trigger>
    </Popover>
  );
};

interface SelectPriorityContextType {
  value: number;
  onValueChange: (value: number) => void;
  variant?: `${SelectTriggerVariant}`;
}

const SelectPriorityContext =
  React.createContext<SelectPriorityContextType | null>(null);

const useSelectPriorityContext = () => {
  const context = React.useContext(SelectPriorityContext);
  if (!context) {
    throw new Error(
      'useSelectPriorityContext must be used within SelectPriorityProvider',
    );
  }
  return context;
};

const SelectPriorityProvider = ({
  children,
  value = 0,
  onValueChange,
  variant,
}: {
  children: React.ReactNode;
  value?: number;
  onValueChange: (value: number) => void;
  variant?: `${SelectTriggerVariant}`;
}) => {
  return (
    <SelectPriorityContext.Provider
      value={{
        value,
        onValueChange,
        variant,
      }}
    >
      {children}
    </SelectPriorityContext.Provider>
  );
};

const SelectPriorityBadgeValue = ({
  placeholder,
}: {
  placeholder?: string;
}) => {
  const { value } = useSelectPriorityContext();

  if (!value) {
    return (
      <span className="text-accent-foreground/80">
        {placeholder || 'Select priority'}
      </span>
    );
  }

  return <PriorityBadge priority={value} />;
};

const SelectPriorityValue = () => {
  const { value } = useSelectPriorityContext();

  return (
    <>
      <PriorityIcon priority={value} />
      <PriorityTitle priority={value} />
    </>
  );
};

const SelectPriorityCommandItem = ({ priority }: { priority: number }) => {
  const { onValueChange, value } = useSelectPriorityContext();
  const priorityLabel = CONTRACT_PRIORITIES_OPTIONS[priority];
  return (
    <Command.Item
      value={clsx(priorityLabel, value)}
      onSelect={() => onValueChange(priority)}
    >
      <div className="flex items-center gap-2 flex-1">
        <PriorityIcon priority={priority} />
        <PriorityTitle priority={priority} />
      </div>
      <Combobox.Check checked={value === priority} />
    </Command.Item>
  );
};

const SelectPriorityContent = () => {
  return (
    <Command>
      <Command.Input placeholder="Search priority" />
      <Command.Empty>No priority found</Command.Empty>
      <Command.List>
        {CONTRACT_PRIORITIES_OPTIONS.map((priority, index) => (
          <SelectPriorityCommandItem key={priority} priority={index} />
        ))}
      </Command.List>
    </Command>
  );
};

export const SelectContractPriorityRoot = ({
  value,
  onValueChange,
  scope,
  variant,
}: {
  value?: number;
  onValueChange: (value: number) => void;
  scope?: string;
  variant: `${SelectTriggerVariant}`;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectPriorityProvider
      value={value}
      onValueChange={(value) => {
        setOpen(false);
        onValueChange(value);
      }}
      variant={variant}
    >
      <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
        <SelectTriggerOperation variant={variant}>
          {variant === SelectTriggerVariant.TABLE ? (
            <SelectPriorityBadgeValue />
          ) : (
            <SelectPriorityValue />
          )}
        </SelectTriggerOperation>
        <SelectOperationContent variant={variant}>
          <SelectPriorityContent />
        </SelectOperationContent>
      </PopoverScoped>
    </SelectPriorityProvider>
  );
};
