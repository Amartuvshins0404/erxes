import { BLOCK_DEVELOPER_STATUS } from '@/developer/constants/developer';
import {
  Combobox,
  Command,
  Filter,
  Popover,
  PopoverScoped,
  SelectOperationContent,
  SelectTriggerOperation,
  SelectTriggerVariant,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import React, { useState } from 'react';

interface SelectDeveloperStatusContextType {
  value?: string;
  onValueChange: (value: string) => void;
  variant?: `${SelectTriggerVariant}`;
}

const SelectDeveloperStatusContext =
  React.createContext<SelectDeveloperStatusContextType | null>(null);

const useSelectDeveloperStatusContext = () => {
  const context = React.useContext(SelectDeveloperStatusContext);
  if (!context) {
    throw new Error(
      'useSelectStatusContext must be used within SelectStatusProvider',
    );
  }
  return context;
};

export const SelectDeveloperStatusProvider = ({
  children,
  value,
  onValueChange,
  variant,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
  variant?: `${SelectTriggerVariant}`;
}) => {
  const handleValueChange = (value: string) => {
    if (!value) return;
    onValueChange(value);
  };

  return (
    <SelectDeveloperStatusContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        variant,
      }}
    >
      {children}
    </SelectDeveloperStatusContext.Provider>
  );
};

const SelectDeveloperStatusValue = ({
  placeholder,
}: {
  placeholder?: string;
}) => {
  const { value } = useSelectDeveloperStatusContext();

  if (!value) {
    return (
      <span className="text-accent-foreground/80">
        {placeholder || 'Select status...'}
      </span>
    );
  }

  const status = Object.entries(BLOCK_DEVELOPER_STATUS).find(
    ([key]) => key === value,
  );

  return <>{status?.[1].text}</>;
};

const SelectDeveloperStatusCommandItem = ({
  status,
  text,
}: {
  status: string;
  text: string;
}) => {
  const { onValueChange, value } = useSelectDeveloperStatusContext();

  return (
    <Command.Item
      value={status}
      key={status}
      onSelect={() => {
        const newStatus = value === status ? '' : status;

        onValueChange(newStatus);
      }}
    >
      {text}
      <Combobox.Check checked={value === status} />
    </Command.Item>
  );
};

const SelectDeveloperStatusContent = () => {
  return (
    <Command id="status-command-menu">
      <Command.Input placeholder="Төрөл сонгоно уу" />
      <Command.List>
        <Command.Empty>No status found</Command.Empty>
        {Object.entries(BLOCK_DEVELOPER_STATUS).map(([key, status]) => (
          <SelectDeveloperStatusCommandItem
            key={key}
            status={key}
            text={status.text}
          />
        ))}
      </Command.List>
    </Command>
  );
};

const SelectDeveloperStatusFilterView = ({
  queryKey,
}: {
  queryKey?: string;
}) => {
  const [types, setStatus] = useQueryState<string>(queryKey || 'status');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={queryKey || 'status'}>
      <SelectDeveloperStatusProvider
        value={types as string}
        onValueChange={(value) => {
          setStatus(value);
          resetFilterState();
        }}
      >
        <SelectDeveloperStatusContent />
      </SelectDeveloperStatusProvider>
    </Filter.View>
  );
};

const SelectDeveloperStatusFilterBar = ({
  queryKey,
}: {
  queryKey?: string;
}) => {
  const [status, setStatus] = useQueryState<string>(queryKey || 'status');
  const [open, setOpen] = useState(false);

  return (
    <SelectDeveloperStatusProvider
      value={status as string}
      onValueChange={(value) => {
        setStatus(value);
        setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'status'}>
            <SelectDeveloperStatusValue />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <SelectDeveloperStatusContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectDeveloperStatusProvider>
  );
};

const SelectDeveloperStatusRoot = ({
  value,
  variant,
  scope,
  onValueChange,
}: {
  value?: string;
  variant: `${SelectTriggerVariant}`;
  scope?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handleValueChange = (value: string) => {
    onValueChange?.(value);
    setOpen(false);
  };

  return (
    <SelectDeveloperStatusProvider
      value={value}
      onValueChange={handleValueChange}
      variant={variant}
    >
      <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
        <SelectTriggerOperation variant={variant}>
          <SelectDeveloperStatusValue />
        </SelectTriggerOperation>
        <SelectOperationContent variant={variant}>
          <SelectDeveloperStatusContent />
        </SelectOperationContent>
      </PopoverScoped>
    </SelectDeveloperStatusProvider>
  );
};

export const SelectDeveloperStatus = Object.assign(SelectDeveloperStatusRoot, {
  FilterView: SelectDeveloperStatusFilterView,
  FilterBar: SelectDeveloperStatusFilterBar,
});
