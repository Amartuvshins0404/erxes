import { ADDRESS_DISTRICT } from '@/block/constants/address';
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
import React, { useEffect, useState } from 'react';

interface SelectDistrictContextType {
  value?: string;
  onValueChange: (value: string) => void;
  variant?: `${SelectTriggerVariant}`;
}

const SelectDistrictContext =
  React.createContext<SelectDistrictContextType | null>(null);

const useSelectDistrictContext = () => {
  const context = React.useContext(SelectDistrictContext);
  if (!context) {
    throw new Error(
      'useSelectDistrictContext must be used within SelectDistrictProvider',
    );
  }
  return context;
};

export const SelectDistrictProvider = ({
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
  const [city] = useQueryState<string | null>('city');
  const [_, setDistrict] = useQueryState<string | null>('district');

  useEffect(() => {
    if (!city) return;

    const districts = ADDRESS_DISTRICT[city];

    const district = districts.find((district) => district.value === value);

    if (!district) {
      setDistrict(null);
    }
  }, [city]);

  const handleValueChange = (value: string) => {
    if (!value) return;
    onValueChange(value);
  };

  return (
    <SelectDistrictContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        variant,
      }}
    >
      {children}
    </SelectDistrictContext.Provider>
  );
};

const SelectDistrictValue = ({ placeholder }: { placeholder?: string }) => {
  const [city] = useQueryState<string | null>('city');
  const { value } = useSelectDistrictContext();

  if (!value) {
    return (
      <span className="text-accent-foreground/80">
        {placeholder || 'Select district...'}
      </span>
    );
  }

  if (!city) {
    const districts = Object.values(ADDRESS_DISTRICT).flatMap(
      (district) => district,
    );

    const district = districts.find((district) => district.value === value);

    return <span>{district?.label}</span>;
  }

  const district = ADDRESS_DISTRICT[city].find(
    (district) => district.value === value,
  );

  return <>{district?.label}</>;
};

const SelectDistrictCommandItem = ({ district }: { district: string }) => {
  const { onValueChange, value } = useSelectDistrictContext();

  return (
    <Command.Item
      value={district}
      key={district}
      onSelect={() => {
        const newDistrict = value === district ? '' : district;

        onValueChange(newDistrict);
      }}
    >
      {district}
      <Combobox.Check checked={value === district} />
    </Command.Item>
  );
};

const SelectDistrictContent = () => {
  const [city] = useQueryState<string | null>('city');

  if (!city) {
    return (
      <Command id="district-command-menu">
        <Command.Input placeholder="Search district..." />
        <Command.List>
          <Command.Empty>No district found</Command.Empty>
          {Object.entries(ADDRESS_DISTRICT).map(([city, districts]) => (
            <Command.Group key={city} heading={city}>
              {districts.map((district) => (
                <SelectDistrictCommandItem
                  key={district.value}
                  district={district.value}
                />
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    );
  }

  const districts = ADDRESS_DISTRICT[city || 'Улаанбаатар'];

  return (
    <Command id="district-command-menu">
      <Command.Input placeholder="Search district..." />
      <Command.List>
        <Command.Empty>No district found</Command.Empty>
        {districts.map((district) => (
          <SelectDistrictCommandItem
            key={district.value}
            district={district.value}
          />
        ))}
      </Command.List>
    </Command>
  );
};

const SelectDistrictFilterView = ({ queryKey }: { queryKey?: string }) => {
  const [district, setDistrict] = useQueryState<string>(queryKey || 'district');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={queryKey || 'district'}>
      <SelectDistrictProvider
        value={district as string}
        onValueChange={(value) => {
          setDistrict(value);
          resetFilterState();
        }}
      >
        <SelectDistrictContent />
      </SelectDistrictProvider>
    </Filter.View>
  );
};

const SelectDistrictFilterBar = ({ queryKey }: { queryKey?: string }) => {
  const [district, setDistrict] = useQueryState<string>(queryKey || 'district');
  const [open, setOpen] = useState(false);

  return (
    <SelectDistrictProvider
      value={district as string}
      onValueChange={(value) => {
        setDistrict(value);
        setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'district'}>
            <SelectDistrictValue />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <SelectDistrictContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectDistrictProvider>
  );
};

const SelectDistrictRoot = ({
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
    <SelectDistrictProvider
      value={value}
      onValueChange={handleValueChange}
      variant={variant}
    >
      <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
        <SelectTriggerOperation variant={variant}>
          <SelectDistrictValue />
        </SelectTriggerOperation>
        <SelectOperationContent variant={variant}>
          <SelectDistrictContent />
        </SelectOperationContent>
      </PopoverScoped>
    </SelectDistrictProvider>
  );
};

export const SelectDistrict = Object.assign(SelectDistrictRoot, {
  FilterView: SelectDistrictFilterView,
  FilterBar: SelectDistrictFilterBar,
});
