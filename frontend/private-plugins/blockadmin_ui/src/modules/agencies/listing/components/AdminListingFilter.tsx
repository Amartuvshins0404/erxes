import {
  Combobox,
  Command,
  Filter,
  Popover,
  useMultiQueryState,
  useQueryState,
  useRemoveQueryStateByKey,
} from 'erxes-ui';
import { SelectAgency } from '@/agencies/components/SelectAgency';
import { SelectArea } from '@/agencies/components/SelectArea';
import { AgenciesListingsTotalCount } from './AgenciesListingsTotalCount';
import { useState } from 'react';
import { IconCircleDashed } from '@tabler/icons-react';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Sold', value: 'sold' },
] as const;

export const AdminListingFilterBar = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    agencyId: string;
    city: string;
    district: string;
  }>(['searchValue', 'status', 'agencyId', 'city', 'district']);

  const hasFilters = Object.values(queries || {}).some(
    (value) => value !== null,
  );
  return (
    <Filter id="ba-agencies-listings-filter">
      <Filter.Bar>
        <Filter.Popover>
          <Filter.Trigger isFiltered={hasFilters} />
          <Combobox.Content>
            <Filter.View>
              <Command>
                <Filter.CommandInput placeholder="Filter" variant="secondary" />
                <Command.List>
                  <Filter.SearchValueTrigger />
                  <StatusFilterItem />
                  <SelectAgency.FilterItem />
                  <SelectArea.CityFilterItem />
                  <SelectArea.DistrictFilterItem />
                </Command.List>
              </Command>
            </Filter.View>
            <StatusFilterView />
            <SelectAgency.FilterView />
            <SelectArea.CityFilterView />
            <SelectArea.DistrictFilterView />
          </Combobox.Content>
        </Filter.Popover>

        <Filter.Dialog>
          <Filter.View filterKey="searchValue" inDialog>
            <Filter.DialogStringView filterKey="searchValue" label="Search" />
          </Filter.View>
        </Filter.Dialog>

        <Filter.SearchValueBarItem />
        <StatusFilterChip />
        <SelectAgency.FilterChip />
        <SelectArea.CityFilterChip />
        <SelectArea.DistrictFilterChip />
        <AgenciesListingsTotalCount />
      </Filter.Bar>
    </Filter>
  );
};

const StatusCommandContent = ({ onDone }: { onDone?: () => void }) => {
  const [status, setStatus] = useQueryState<string>('status');
  const removeQuery = useRemoveQueryStateByKey();

  const handleSelect = (value: string) => {
    if (value === '') {
      removeQuery('status');
      onDone?.();
    } else {
      setStatus(value);
      onDone?.();
    }
  };

  return (
    <Command>
      <Command.List className="p-1">
        {STATUS_TABS.map(({ label, value }) => (
          <Filter.CommandItem
            key={value}
            value={value}
            onSelect={() => handleSelect(value)}
            className={status === value ? 'text-primary' : ''}
          >
            {label}
          </Filter.CommandItem>
        ))}
      </Command.List>
    </Command>
  );
};

const StatusFilterChip = () => {
  const [status] = useQueryState<string>('status');
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Filter.BarItem queryKey="status">
      <Filter.BarName>
        <IconCircleDashed /> Status
      </Filter.BarName>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton>{status}</Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content className="w-60">
          <StatusCommandContent onDone={() => setOpen(false)} />
        </Combobox.Content>
      </Popover>
    </Filter.BarItem>
  );
};

const StatusFilterView = () => (
  <Filter.View filterKey="status">
    <StatusCommandContent />
  </Filter.View>
);

const StatusFilterItem = () => (
  <Filter.Item value="status">
    <IconCircleDashed /> Status
  </Filter.Item>
);
