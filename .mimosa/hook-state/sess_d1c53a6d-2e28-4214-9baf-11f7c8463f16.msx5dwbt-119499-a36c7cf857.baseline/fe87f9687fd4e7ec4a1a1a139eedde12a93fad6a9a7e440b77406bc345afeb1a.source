import { useDeveloperInfo } from '@/block/hooks/useDeveloperInfo';
import { useDevelopersInline } from '@/developer/hooks/useDevelopers';
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
import { useDebounce } from 'use-debounce';

interface IDeveloper {
  _id: string;
  name: string;
  verificationStatus: string;
}

interface SelectDeveloperContextType {
  value?: string;
  onValueChange: (value: {
    _id: string;
    name: string;
    verificationStatus: string;
  }) => void;
  variant?: `${SelectTriggerVariant}`;
  selectedDevelopers: IDeveloper[];
  contentDevelopers: IDeveloper[];
  search: string;
  setSearch: (search: string) => void;
  setSelectedDevelopers: (selectedDevelopers: IDeveloper[]) => void;
  handleFetchMore: () => void;
  totalCount?: number;
}

const SelectDeveloperContext =
  React.createContext<SelectDeveloperContextType | null>(null);

const useSelectDeveloperContext = () => {
  const context = React.useContext(SelectDeveloperContext);
  if (!context) {
    throw new Error(
      'useSelectDeveloperContext must be used within SelectDeveloperProvider',
    );
  }
  return context;
};

export const SelectDeveloperProvider = ({
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
  const [selectedDevelopers, setSelectedDevelopers] = useState<IDeveloper[]>(
    [],
  );
  const [search, setSearch] = useState('');

  const [debouncedSearch] = useDebounce(search, 500);

  const {
    developers = [],
    loading,
    handleFetchMore,
    totalCount,
  } = useDevelopersInline({
    variables: {
      searchValue: debouncedSearch,
    },
  });

  useEffect(() => {
    if (!value || loading) return;

    const selectedDeveloper = developers.filter((dev) => dev._id === value);

    if (selectedDeveloper) {
      setSelectedDevelopers(selectedDeveloper);
    }
  }, [developers, value, loading]);

  const selectedIds = new Set(selectedDevelopers.map((d) => d._id));

  const contentDevelopers = developers.filter(
    (dev) => !selectedIds.has(dev._id),
  );

  const handleValueChange = (dev: IDeveloper) => {
    if (!dev) return;
    onValueChange(dev._id);
  };

  return (
    <SelectDeveloperContext.Provider
      value={{
        selectedDevelopers,
        contentDevelopers,
        value,
        onValueChange: handleValueChange,
        variant,
        search,
        setSearch,
        setSelectedDevelopers,
        handleFetchMore,
        totalCount,
      }}
    >
      {children}
    </SelectDeveloperContext.Provider>
  );
};

const SelectDeveloperValue = ({ placeholder }: { placeholder?: string }) => {
  const {
    value,
    contentDevelopers,
    selectedDevelopers,
    setSelectedDevelopers,
  } = useSelectDeveloperContext();

  const selectedDeveloper =
    selectedDevelopers?.find((d) => d._id === value) ||
    contentDevelopers.find((d) => d._id === value);

  const { developerInfo } = useDeveloperInfo(
    selectedDeveloper ? undefined : value,
  );

  useEffect(() => {
    if (developerInfo) {
      setSelectedDevelopers([developerInfo]);
    }
  }, [developerInfo, setSelectedDevelopers]);

  if (!value) {
    return (
      <span className="text-accent-foreground/80">
        {placeholder || 'Select developer...'}
      </span>
    );
  }

  return <>{selectedDeveloper?.name || developerInfo?.name}</>;
};

const SelectDeveloperCommandItem = ({
  developer,
}: {
  developer: IDeveloper;
}) => {
  const { onValueChange, value } = useSelectDeveloperContext();

  return (
    <Command.Item
      value={developer._id}
      key={developer._id}
      onSelect={() => {
        onValueChange(developer);
      }}
    >
      {developer.name}
      <Combobox.Check checked={value === developer._id} />
    </Command.Item>
  );
};

const SelectDeveloperContent = () => {
  const {
    selectedDevelopers = [],
    contentDevelopers = [],
    search,
    setSearch,
    handleFetchMore,
    totalCount,
  } = useSelectDeveloperContext();

  return (
    <Command id="developer-command-menu">
      <Command.Input
        placeholder="Search developer..."
        value={search}
        onValueChange={setSearch}
      />
      <Command.List>
        <Command.Empty>No developer found</Command.Empty>
        {!!selectedDevelopers?.length && (
          <>
            {(selectedDevelopers || []).map((developer) => (
              <SelectDeveloperCommandItem
                key={developer._id}
                developer={developer}
              />
            ))}
            <Command.Separator className="my-1" />
          </>
        )}

        {(contentDevelopers || []).map((developer) => (
          <SelectDeveloperCommandItem
            key={developer._id}
            developer={developer}
          />
        ))}

        <Combobox.FetchMore
          fetchMore={handleFetchMore}
          currentLength={
            (contentDevelopers?.length || 0) + selectedDevelopers?.length || 0
          }
          totalCount={totalCount || 0}
        />
      </Command.List>
    </Command>
  );
};

const SelectDeveloperFilterView = ({ queryKey }: { queryKey?: string }) => {
  const [developer, setDeveloper] = useQueryState<string>(
    queryKey || 'developerId',
  );
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={queryKey || 'developerId'}>
      <SelectDeveloperProvider
        value={developer as string}
        onValueChange={(value) => {
          setDeveloper(value);
          resetFilterState();
        }}
      >
        <SelectDeveloperContent />
      </SelectDeveloperProvider>
    </Filter.View>
  );
};

const SelectDeveloperFilterBar = ({ queryKey }: { queryKey?: string }) => {
  const [developer, setDeveloper] = useQueryState<string>(
    queryKey || 'developerId',
  );
  const [open, setOpen] = useState(false);

  return (
    <SelectDeveloperProvider
      value={developer as string}
      onValueChange={(value) => {
        setDeveloper(value);
        setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'developerId'}>
            <SelectDeveloperValue />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <SelectDeveloperContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectDeveloperProvider>
  );
};

const SelectDeveloperRoot = ({
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
    <SelectDeveloperProvider
      value={value}
      onValueChange={handleValueChange}
      variant={variant}
    >
      <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
        <SelectTriggerOperation variant={variant}>
          <SelectDeveloperValue />
        </SelectTriggerOperation>
        <SelectOperationContent variant={variant}>
          <SelectDeveloperContent />
        </SelectOperationContent>
      </PopoverScoped>
    </SelectDeveloperProvider>
  );
};

export const SelectDeveloper = Object.assign(SelectDeveloperRoot, {
  FilterView: SelectDeveloperFilterView,
  FilterBar: SelectDeveloperFilterBar,
});
