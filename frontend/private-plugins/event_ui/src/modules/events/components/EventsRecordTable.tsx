import { IconAlertTriangle, IconCalendarEvent } from '@tabler/icons-react';
import { Alert, Empty, RecordTable } from 'erxes-ui';
import { eventsColumns } from '@/events/components/EventsColumns';
import { EventsCommandBar } from '@/events/components/EventsCommandBar';
import { useEvents } from '@/events/hooks/useEvents';
import { EVENTS_CURSOR_SESSION_KEY } from '~/lib/constants';

export const EventsRecordTable = () => {
  const { events, loading, pageInfo, handleFetchMore, error } = useEvents();

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <IconAlertTriangle />
        <Alert.Title>Could not load events</Alert.Title>
        <Alert.Description>{error.message}</Alert.Description>
      </Alert>
    );
  }

  if (!loading && events.length === 0) {
    return (
      <div className="p-6">
        <Empty>
          <Empty.Header>
            <Empty.Media variant="icon">
              <IconCalendarEvent />
            </Empty.Media>
            <Empty.Title>No events here yet</Empty.Title>
            <Empty.Description>
              Create an event, or clear the filters to see past and draft ones.
            </Empty.Description>
          </Empty.Header>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <RecordTable.Provider
        columns={eventsColumns}
        data={events}
        stickyColumns={['more', 'checkbox', 'name']}
        tableId="events-record-table"
        className="m-3 h-full"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={pageInfo?.hasPreviousPage}
          hasNextPage={pageInfo?.hasNextPage}
          dataLength={events.length}
          sessionKey={EVENTS_CURSOR_SESSION_KEY}
        >
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              <RecordTable.CursorBackwardSkeleton
                handleFetchMore={handleFetchMore}
              />
              {loading && <RecordTable.RowSkeleton rows={12} />}
              <RecordTable.RowList />
              <RecordTable.CursorForwardSkeleton
                handleFetchMore={handleFetchMore}
              />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.CursorProvider>
        <EventsCommandBar />
      </RecordTable.Provider>
    </div>
  );
};
