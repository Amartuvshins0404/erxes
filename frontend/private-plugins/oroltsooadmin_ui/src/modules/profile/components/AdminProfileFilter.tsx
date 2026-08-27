import { IconClockCheck, IconSearch, IconShieldCheck, IconWorld } from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  useMultiQueryState,
} from 'erxes-ui';

import { SelectReviewStatus } from '../constants/reviewStatusFilter';

const AdminProfileFilterPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    reviewStatus: string;
    subdomain: string;
    synced: string;
  }>(['searchValue', 'reviewStatus', 'subdomain', 'synced']);

  const hasFilters = Object.values(queries || {}).some(
    (value) => value !== null,
  );

  return (
    <>
      <Filter.Popover>
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder="Шүүлтүүр"
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  Хайх
                </Filter.Item>
                <Filter.Item value="reviewStatus">
                  <IconShieldCheck />
                  Хяналтын төлөв
                </Filter.Item>
                <Filter.Item value="subdomain" inDialog>
                  <IconWorld />
                  Байгууллага
                </Filter.Item>
                <Filter.Item value="synced">
                  <IconClockCheck />
                  Сүүлд ирсэн
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <Filter.View filterKey="synced">
            <Filter.DateView filterKey="synced" />
          </Filter.View>
          <SelectReviewStatus.FilterView />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
        <Filter.View filterKey="subdomain" inDialog>
          <Filter.DialogStringView filterKey="subdomain" />
        </Filter.View>
        <Filter.View filterKey="synced" inDialog>
          <Filter.DialogDateView filterKey="synced" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const AdminProfileFilter = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    subdomain: string;
  }>(['searchValue', 'subdomain']);

  return (
    <Filter id="oroltsooadmin-profiles-filter">
      <Filter.Bar>
        <Filter.BarItem queryKey="searchValue">
          <Filter.BarName>
            <IconSearch />
            Хайх
          </Filter.BarName>
          <Filter.BarButton filterKey="searchValue" inDialog>
            {queries?.searchValue || ''}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="reviewStatus">
          <Filter.BarName>
            <IconShieldCheck />
            Хяналт
          </Filter.BarName>
          <SelectReviewStatus.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="subdomain">
          <Filter.BarName>
            <IconWorld />
            Байгууллага
          </Filter.BarName>
          <Filter.BarButton filterKey="subdomain" inDialog>
            {queries?.subdomain || ''}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="synced">
          <Filter.BarName>
            <IconClockCheck />
            Сүүлд ирсэн
          </Filter.BarName>
          <Filter.Date filterKey="synced" />
        </Filter.BarItem>
        <AdminProfileFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
