import {
  IconBuilding,
  IconCalendarClock,
  IconCalendarPlus,
  IconCalendarTime,
  IconCheck,
  IconFlag,
  IconFlagOff,
  IconMap2,
  IconMapStar,
  IconProgress,
  IconSearch,
} from '@tabler/icons-react';

import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { SelectCity } from './select/SelectCity';
import { SelectDistrict } from './select/SelectDistrict';
import { SelectProjectStatus } from './select/SelectProjectStatus';
import { SelectProjectTypes } from './select/SelectProjectTypes';

const ProjectsFilterPopover = () => {
  const [queries, setQueries] = useMultiQueryState<{
    searchValue: string;
    types: string[];
    created: string;
    city: string;
    district: string;
    isPublished: boolean;
    startDate: string;
    endDate: string;
  }>([
    'searchValue',
    'types',
    'created',
    'city',
    'district',
    'isPublished',
    'startDate',
    'endDate',
  ]);

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
                <Filter.CommandItem
                  onSelect={() => setQueries({ isPublished: true })}
                >
                  <IconFlag />
                  Published
                  {queries.isPublished && <IconCheck className="ml-auto" />}
                </Filter.CommandItem>
                <Filter.CommandItem
                  onSelect={() => setQueries({ isPublished: false })}
                >
                  <IconFlagOff />
                  Not published
                  {queries.isPublished === false && (
                    <IconCheck className="ml-auto" />
                  )}
                </Filter.CommandItem>
                <Command.Separator className="my-1" />
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  Search
                </Filter.Item>
                <Filter.Item value="types">
                  <IconBuilding />
                  Types
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
                <Filter.Item value="startDate">
                  <IconCalendarClock />
                  Start Date
                </Filter.Item>
                <Filter.Item value="endDate">
                  <IconCalendarTime />
                  End Date
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <Filter.View filterKey="created">
            <Filter.DateView filterKey="created" />
          </Filter.View>
          <Filter.View filterKey="startDate">
            <Filter.DateView filterKey="startDate" />
          </Filter.View>
          <Filter.View filterKey="endDate">
            <Filter.DateView filterKey="endDate" />
          </Filter.View>
          <SelectProjectTypes.FilterView />
          <SelectProjectStatus.FilterView />
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
        <Filter.View filterKey="startDate" inDialog>
          <Filter.DialogDateView filterKey="startDate" />
        </Filter.View>
        <Filter.View filterKey="endDate" inDialog>
          <Filter.DialogDateView filterKey="endDate" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const ProjectsFilter = () => {
  const [queries, setQueries] = useMultiQueryState<{
    searchValue: string;
    isPublished: boolean;
  }>(['searchValue', 'isPublished']);

  return (
    <Filter id="projects-filter">
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
        <Filter.BarItem queryKey="types">
          <Filter.BarName>
            <IconBuilding />
            Types
          </Filter.BarName>
          <SelectProjectTypes.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgress />
            Status
          </Filter.BarName>
          <SelectProjectStatus.FilterBar />
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
        <Filter.BarItem queryKey="startDate">
          <Filter.BarName>
            <IconCalendarClock />
            Start Date
          </Filter.BarName>
          <Filter.Date filterKey="startDate" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="endDate">
          <Filter.BarName>
            <IconCalendarTime />
            End Date
          </Filter.BarName>
          <Filter.Date filterKey="endDate" />
        </Filter.BarItem>
        <ProjectsFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
