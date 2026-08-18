import {
  IconCalendarClock,
  IconCalendarPlus,
  IconFlag,
  IconFlagOff,
  IconMap2,
  IconMapStar,
  IconProgress,
  IconSearch,
} from '@tabler/icons-react';

import { SelectCity } from '@/block/components/select/SelectCity';
import { SelectDistrict } from '@/block/components/select/SelectDistrict';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { SelectDeveloperStatus } from './select/SelectDeveloperStatus';

const DevelopersFilterPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    city: string;
    district: string;
    created: string;
    foundedAt: string;
  }>(['searchValue', 'city', 'district', 'created', 'foundedAt']);

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
                placeholder="Filter"
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  Search
                </Filter.Item>
                <Filter.Item value="status">
                  <IconProgress />
                  Status
                </Filter.Item>
                <Filter.Item value="city">
                  <IconMap2 />
                  City
                </Filter.Item>
                <Filter.Item value="district">
                  <IconMapStar />
                  District
                </Filter.Item>
                <Filter.Item value="created">
                  <IconCalendarPlus />
                  Created At
                </Filter.Item>
                <Filter.Item value="foundedAt">
                  <IconCalendarClock />
                  Founded At
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <Filter.View filterKey="created">
            <Filter.DateView filterKey="created" />
          </Filter.View>
          <Filter.View filterKey="foundedAt">
            <Filter.DateView filterKey="foundedAt" />
          </Filter.View>
          <SelectDeveloperStatus.FilterView />
          <SelectCity.FilterView />
          <SelectDistrict.FilterView />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
        <Filter.View filterKey="created" inDialog>
          <Filter.DialogDateView filterKey="created" />
        </Filter.View>
        <Filter.View filterKey="foundedAt" inDialog>
          <Filter.DialogDateView filterKey="foundedAt" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const DevelopersFilter = () => {
  const [queries, setQueries] = useMultiQueryState<{
    searchValue: string;
    isPublished: boolean;
  }>(['searchValue', 'isPublished']);

  return (
    <Filter id="developers-filter">
      <Filter.Bar>
        <Filter.BarItem queryKey="isPublished">
          <Filter.BarName>
            {queries?.isPublished ? <IconFlag /> : <IconFlagOff />}
          </Filter.BarName>
          <Filter.BarButton
            onClick={() => setQueries({ isPublished: !queries?.isPublished })}
          >
            {queries?.isPublished ? 'Published' : 'Not published'}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="searchValue">
          <Filter.BarName>
            <IconSearch />
            Search
          </Filter.BarName>
          <Filter.BarButton filterKey="searchValue" inDialog>
            {queries?.searchValue || ''}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgress />
            Status
          </Filter.BarName>
          <SelectDeveloperStatus.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="city">
          <Filter.BarName>
            <IconMap2 />
            City
          </Filter.BarName>
          <SelectCity.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="district">
          <Filter.BarName>
            <IconMapStar />
            District
          </Filter.BarName>
          <SelectDistrict.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="created">
          <Filter.BarName>
            <IconCalendarPlus />
            Created At
          </Filter.BarName>
          <Filter.Date filterKey="created" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="foundedAt">
          <Filter.BarName>
            <IconCalendarClock />
            Founded At
          </Filter.BarName>
          <Filter.Date filterKey="foundedAt" />
        </Filter.BarItem>
        <DevelopersFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
