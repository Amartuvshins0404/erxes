import {
  IconCalendarEvent,
  IconLayoutList,
  IconProgress,
  IconSearch,
} from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  useFilterContext,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_OPTIONS,
  EVENT_TABS,
  EVENT_TAB_LABELS,
  EventPageTab,
} from '~/lib/constants';
import { EventHotKeyScope } from '~/lib/hotkeys';
import { EventStatus } from '~/types/event';

const ViewCommand = ({ onDone }: { onDone?: () => void }) => {
  const [eventTab, setEventTab] = useQueryState<string>('eventTab');

  const handleSelect = (value: EventPageTab | null) => {
    setEventTab(value);
    onDone?.();
  };

  return (
    <Command>
      <Filter.CommandInput placeholder="Search view" variant="secondary" />
      <Command.List className="p-1">
        <Filter.CommandItem value="all-events" onSelect={() => handleSelect(null)}>
          <IconLayoutList />
          All events
        </Filter.CommandItem>
        {EVENT_TABS.map((tab) => (
          <Filter.CommandItem
            key={tab}
            value={EVENT_TAB_LABELS[tab]}
            onSelect={() => handleSelect(tab)}
            className={eventTab === tab ? 'text-primary' : ''}
          >
            <IconLayoutList />
            {EVENT_TAB_LABELS[tab]}
          </Filter.CommandItem>
        ))}
      </Command.List>
    </Command>
  );
};

const ViewFilterView = () => {
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="eventTab">
      <ViewCommand onDone={resetFilterState} />
    </Filter.View>
  );
};

const ViewFilterBar = () => {
  const [eventTab] = useQueryState<string>('eventTab');

  return (
    <Filter.BarItem queryKey="eventTab">
      <Filter.BarName>
        <IconLayoutList />
        View
      </Filter.BarName>
      <Filter.BarButton filterKey="eventTab">
        {EVENT_TAB_LABELS[eventTab as EventPageTab] ?? eventTab}
      </Filter.BarButton>
    </Filter.BarItem>
  );
};

const StatusCommand = ({ onDone }: { onDone?: () => void }) => {
  const [status, setStatus] = useQueryState<string>('status');

  const handleSelect = (value: EventStatus | null) => {
    setStatus(value);
    onDone?.();
  };

  return (
    <Command>
      <Filter.CommandInput placeholder="Search status" variant="secondary" />
      <Command.List className="p-1">
        <Filter.CommandItem
          value="all-statuses"
          onSelect={() => handleSelect(null)}
        >
          <IconProgress />
          All statuses
        </Filter.CommandItem>
        {EVENT_STATUS_OPTIONS.map((option) => (
          <Filter.CommandItem
            key={option.value}
            value={option.label}
            onSelect={() => handleSelect(option.value)}
            className={status === option.value ? 'text-primary' : ''}
          >
            <IconProgress />
            {option.label}
          </Filter.CommandItem>
        ))}
      </Command.List>
    </Command>
  );
};

const StatusFilterView = () => {
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="status">
      <StatusCommand onDone={resetFilterState} />
    </Filter.View>
  );
};

const StatusFilterBar = () => {
  const [status] = useQueryState<string>('status');

  return (
    <Filter.BarItem queryKey="status">
      <Filter.BarName>
        <IconProgress />
        Status
      </Filter.BarName>
      <Filter.BarButton filterKey="status">
        {EVENT_STATUS_LABELS[status as EventStatus] ?? status}
      </Filter.BarButton>
    </Filter.BarItem>
  );
};

const EventsFilterPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    eventTab: string;
    status: string;
    startDate: string;
  }>(['searchValue', 'eventTab', 'status', 'startDate']);

  const hasFilters = Object.values(queries || {}).some(
    (value) => value !== null,
  );

  return (
    <>
      <Filter.Popover scope={EventHotKeyScope.EventsPage}>
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
                <Filter.Item value="eventTab">
                  <IconLayoutList />
                  View
                </Filter.Item>
                <Filter.Item value="status">
                  <IconProgress />
                  Status
                </Filter.Item>
                <Filter.Item value="startDate">
                  <IconCalendarEvent />
                  Start date
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <ViewFilterView />
          <StatusFilterView />
          <Filter.View filterKey="startDate">
            <Filter.DateView filterKey="startDate" />
          </Filter.View>
        </Combobox.Content>
      </Filter.Popover>

      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" label="Search" />
        </Filter.View>
        <Filter.View filterKey="startDate" inDialog>
          <Filter.DialogDateView filterKey="startDate" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const EventsFilter = () => (
  <Filter id="events-filter">
    <Filter.Bar>
      <Filter.SearchValueBarItem />

      <ViewFilterBar />

      <StatusFilterBar />

      <Filter.BarItem queryKey="startDate">
        <Filter.BarName>
          <IconCalendarEvent />
          Start date
        </Filter.BarName>
        <Filter.Date filterKey="startDate" />
      </Filter.BarItem>

      <EventsFilterPopover />
    </Filter.Bar>
  </Filter>
);
