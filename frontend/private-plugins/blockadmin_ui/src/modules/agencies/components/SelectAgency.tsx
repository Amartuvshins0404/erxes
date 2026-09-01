import {
  Combobox,
  Command,
  Filter,
  Popover,
  PopoverScoped,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { IconBuildingStore } from '@tabler/icons-react';
import { IAgencyInline, useAgenciesInline } from '../hooks/useAgencies';
import { useAgencyDetail } from '../hooks/useAgencyDetail';

const AGENCY_FILTER_KEY = 'agencyId';

interface SelectAgencyContextType {
  value?: string;
  onValueChange: (value: string) => void;
  agencies: IAgencyInline[];
  search: string;
  setSearch: (search: string) => void;
  loading: boolean;
  handleFetchMore: () => void;
  totalCount: number;
}

const SelectAgencyContext =
  React.createContext<SelectAgencyContextType | null>(null);

const useSelectAgencyContext = () => {
  const context = React.useContext(SelectAgencyContext);

  if (!context) {
    throw new Error(
      'SelectAgency sub-components must be used inside <SelectAgency>',
    );
  }

  return context;
};

const agencyLabel = (agency?: IAgencyInline | null) =>
  agency?.name || agency?.brandName || '';

export const SelectAgencyProvider = ({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);

  const { agencies, loading, totalCount, handleFetchMore } = useAgenciesInline({
    variables: { searchValue: debouncedSearch || undefined },
  });

  return (
    <SelectAgencyContext.Provider
      value={{
        value,
        onValueChange,
        agencies: agencies ?? [],
        search,
        setSearch,
        loading,
        handleFetchMore,
        totalCount: totalCount ?? 0,
      }}
    >
      {children}
    </SelectAgencyContext.Provider>
  );
};

const SelectAgencyValue = () => {
  const [agencyId] = useQueryState<string>(AGENCY_FILTER_KEY);
  const { agencies } = useSelectAgencyContext();

  const loadedAgency = agencies.find((agency) => agency._id === agencyId);

  const { agency } = useAgencyDetail({
    variables: { id: agencyId as string },
    skip: !agencyId || !!loadedAgency,
  });

  if (!agencyId) {
    return <span className="text-accent-foreground/80">Select agency...</span>;
  }

  return (
    <span className="truncate">
      {agencyLabel(loadedAgency) || agencyLabel(agency) || agencyId}
    </span>
  );
};

const SelectAgencyContent = () => {
  const {
    agencies,
    value,
    onValueChange,
    search,
    setSearch,
    loading,
    handleFetchMore,
    totalCount,
  } = useSelectAgencyContext();

  return (
    <Command shouldFilter={false}>
      <Command.Input
        placeholder="Search agency..."
        value={search}
        onValueChange={setSearch}
        focusOnMount
      />
      <Command.List>
        {!loading && <Command.Empty>No agency found</Command.Empty>}
        {agencies.map((agency) => (
          <Command.Item
            key={agency._id}
            value={agency._id}
            onSelect={() => onValueChange(agency._id)}
          >
            {agencyLabel(agency) || agency._id}
            <Combobox.Check checked={value === agency._id} />
          </Command.Item>
        ))}
        <Combobox.FetchMore
          fetchMore={handleFetchMore}
          currentLength={agencies.length}
          totalCount={totalCount}
        />
      </Command.List>
    </Command>
  );
};

const SelectAgencyFilterItem = () => (
  <Filter.Item value={AGENCY_FILTER_KEY}>
    <IconBuildingStore /> Agency
  </Filter.Item>
);

const SelectAgencyFilterView = () => {
  const [agencyId, setAgencyId] = useQueryState<string>(AGENCY_FILTER_KEY);
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={AGENCY_FILTER_KEY}>
      <SelectAgencyProvider
        value={agencyId as string}
        onValueChange={(value) => {
          setAgencyId(value);
          resetFilterState();
        }}
      >
        <SelectAgencyContent />
      </SelectAgencyProvider>
    </Filter.View>
  );
};

const SelectAgencyFilterChip = () => {
  const [agencyId, setAgencyId] = useQueryState<string>(AGENCY_FILTER_KEY);
  const [open, setOpen] = useState(false);

  return (
    <Filter.BarItem queryKey={AGENCY_FILTER_KEY}>
      <Filter.BarName>
        <IconBuildingStore /> Agency
      </Filter.BarName>
      <SelectAgencyProvider
        value={agencyId as string}
        onValueChange={(value) => {
          setAgencyId(value);
          setOpen(false);
        }}
      >
        <PopoverScoped open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <Filter.BarButton>
              <SelectAgencyValue />
            </Filter.BarButton>
          </Popover.Trigger>
          <Combobox.Content>
            <SelectAgencyContent />
          </Combobox.Content>
        </PopoverScoped>
      </SelectAgencyProvider>
    </Filter.BarItem>
  );
};

export const SelectAgency = {
  FilterItem: SelectAgencyFilterItem,
  FilterView: SelectAgencyFilterView,
  FilterChip: SelectAgencyFilterChip,
};
