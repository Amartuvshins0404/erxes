import { IconSearch, IconTag, IconToggleLeft, IconWorld } from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';

import { SelectPostStatus } from '../constants/postStatusFilter';

const AdminPostFilterPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    subdomain: string;
    tag: string;
  }>(['searchValue', 'status', 'subdomain', 'tag']);

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
                <Filter.Item value="status">
                  <IconToggleLeft />
                  Төлөв
                </Filter.Item>
                <Filter.Item value="subdomain" inDialog>
                  <IconWorld />
                  Байгууллага
                </Filter.Item>
                <Filter.Item value="tag" inDialog>
                  <IconTag />
                  Шошго
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <SelectPostStatus.FilterView />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
        <Filter.View filterKey="subdomain" inDialog>
          <Filter.DialogStringView filterKey="subdomain" />
        </Filter.View>
        <Filter.View filterKey="tag" inDialog>
          <Filter.DialogStringView filterKey="tag" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const AdminPostFilter = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    subdomain: string;
    tag: string;
  }>(['searchValue', 'subdomain', 'tag']);

  return (
    <Filter id="oroltsooadmin-posts-filter">
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
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconToggleLeft />
            Төлөв
          </Filter.BarName>
          <SelectPostStatus.FilterBar />
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
        <Filter.BarItem queryKey="tag">
          <Filter.BarName>
            <IconTag />
            Шошго
          </Filter.BarName>
          <Filter.BarButton filterKey="tag" inDialog>
            {queries?.tag || ''}
          </Filter.BarButton>
        </Filter.BarItem>
        <AdminPostFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
