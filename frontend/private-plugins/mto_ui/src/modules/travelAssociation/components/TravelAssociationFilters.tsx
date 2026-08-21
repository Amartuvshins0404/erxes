import { IconCalendarClock, IconCalendarTime, IconSearch } from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  useMultiQueryState,
} from 'erxes-ui';

const TravelAssociationFiltersPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    foundDateFrom: string;
    foundDateTo: string;
  }>(['searchValue', 'foundDateFrom', 'foundDateTo']);

  const hasFilters = Object.values(queries || {}).some((value) => value !== null);

  return (
    <>
      <Filter.Popover>
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder="Filter"
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  Search
                </Filter.Item>
                <Command.Separator className="my-1" />
                <Filter.Item value="foundDateFrom">
                  <IconCalendarClock />
                  Found date from
                </Filter.Item>
                <Filter.Item value="foundDateTo">
                  <IconCalendarTime />
                  Found date to
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <Filter.View filterKey="foundDateFrom">
            <Filter.DateView filterKey="foundDateFrom" />
          </Filter.View>
          <Filter.View filterKey="foundDateTo">
            <Filter.DateView filterKey="foundDateTo" />
          </Filter.View>
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
        <Filter.View filterKey="foundDateFrom" inDialog>
          <Filter.DialogDateView filterKey="foundDateFrom" />
        </Filter.View>
        <Filter.View filterKey="foundDateTo" inDialog>
          <Filter.DialogDateView filterKey="foundDateTo" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const TravelAssociationFilters = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
  }>(['searchValue']);

  return (
    <Filter id="travel-associations-filter">
      <Filter.Bar>
        {queries?.searchValue && (
          <Filter.BarItem queryKey="searchValue">
            <Filter.BarName>
              <IconSearch />
              Search
            </Filter.BarName>
            <Filter.BarButton filterKey="searchValue" inDialog>
              {queries.searchValue}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        <Filter.BarItem queryKey="foundDateFrom">
          <Filter.BarName>
            <IconCalendarClock />
            Found date from
          </Filter.BarName>
          <Filter.Date filterKey="foundDateFrom" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="foundDateTo">
          <Filter.BarName>
            <IconCalendarTime />
            Found date to
          </Filter.BarName>
          <Filter.Date filterKey="foundDateTo" />
        </Filter.BarItem>
        <TravelAssociationFiltersPopover />
      </Filter.Bar>
    </Filter>
  );
};
