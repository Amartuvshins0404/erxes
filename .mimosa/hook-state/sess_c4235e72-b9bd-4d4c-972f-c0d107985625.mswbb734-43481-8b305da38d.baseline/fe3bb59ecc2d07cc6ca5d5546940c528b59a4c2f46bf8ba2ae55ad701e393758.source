import { ADDRESS_CITY } from '@/block/constants/address';
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

interface SelectCityContextType {
  value?: string;
  onValueChange: (value: string) => void;
  variant?: `${SelectTriggerVariant}`;
}

const SelectCityContext = React.createContext<SelectCityContextType | null>(
  null,
);

const useSelectCityContext = () => {
  const context = React.useContext(SelectCityContext);
  if (!context) {
    throw new Error(
      'useSelectCityContext must be used within SelectCityProvider',
    );
  }
  return context;
};

export const SelectCityProvider = ({
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
    <SelectCityContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        variant,
      }}
    >
      {children}
    </SelectCityContext.Provider>
  );
};

const SelectCityValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useSelectCityContext();

  if (!value) {
    return (
      <span className="text-accent-foreground/80">
        {placeholder || 'Select city...'}
      </span>
    );
  }

  const city = ADDRESS_CITY.find((city) => city === value);

  return <>{city}</>;
};

const SelectCityCommandItem = ({ city }: { city: string }) => {
  const { onValueChange, value } = useSelectCityContext();

  return (
    <Command.Item
      value={city}
      key={city}
      onSelect={() => {
        const newCity = value === city ? '' : city;

        onValueChange(newCity);
      }}
    >
      {city}
      <Combobox.Check checked={value === city} />
    </Command.Item>
  );
};

const SelectCityContent = () => {
  return (
    <Command id="city-command-menu">
      <Command.Input placeholder="Search city..." />
      <Command.List>
        <Command.Empty>No city found</Command.Empty>
        {ADDRESS_CITY.map((city) => (
          <SelectCityCommandItem key={city} city={city} />
        ))}
      </Command.List>
    </Command>
  );
};

const SelectCityFilterView = ({ queryKey }: { queryKey?: string }) => {
  const [city, setCity] = useQueryState<string>(queryKey || 'city');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={queryKey || 'city'}>
      <SelectCityProvider
        value={city as string}
        onValueChange={(value) => {
          setCity(value);
          resetFilterState();
        }}
      >
        <SelectCityContent />
      </SelectCityProvider>
    </Filter.View>
  );
};

const SelectCityFilterBar = ({ queryKey }: { queryKey?: string }) => {
  const [city, setCity] = useQueryState<string>(queryKey || 'city');
  const [open, setOpen] = useState(false);

  return (
    <SelectCityProvider
      value={city as string}
      onValueChange={(value) => {
        setCity(value);
        setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'city'}>
            <SelectCityValue />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <SelectCityContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectCityProvider>
  );
};

const SelectCityRoot = ({
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
    <SelectCityProvider
      value={value}
      onValueChange={handleValueChange}
      variant={variant}
    >
      <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
        <SelectTriggerOperation variant={variant}>
          <SelectCityValue />
        </SelectTriggerOperation>
        <SelectOperationContent variant={variant}>
          <SelectCityContent />
        </SelectOperationContent>
      </PopoverScoped>
    </SelectCityProvider>
  );
};

export const SelectCity = Object.assign(SelectCityRoot, {
  FilterView: SelectCityFilterView,
  FilterBar: SelectCityFilterBar,
});
