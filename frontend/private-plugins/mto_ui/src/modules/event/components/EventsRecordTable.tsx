import { IconCalendarEvent } from '@tabler/icons-react';
import { Empty, RecordTable, useConfirm } from 'erxes-ui';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { eventColumns } from '@/event/components/EventColumns';
import { EventFormSheet } from '@/event/components/EventFormSheet';
import { useEvents } from '@/event/hooks/useEvents';
import { MTO_EVENTS_REMOVE } from '@/event/graphql/eventMutations';

export function EventsRecordTable() {
  const { confirm } = useConfirm();
  const { events, loading, refetch } = useEvents();
  const [removeEvents] = useMutation(MTO_EVENTS_REMOVE);
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRemove = (id: string) => {
    void confirm({
      message: 'Are you sure you want to remove this event?',
      options: { confirmationValue: 'delete' },
    }).then(() => {
      void removeEvents({ variables: { ids: [id] } }).then(() => refetch());
    });
  };

  if (!loading && events.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconCalendarEvent />
          </Empty.Media>
          <Empty.Title>No events found</Empty.Title>
          <Empty.Description>There seem to be no events.</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden h-full">
        <RecordTable.Provider
          columns={eventColumns({
            onEdit: (id) => {
              setEditId(id);
              setSheetOpen(true);
            },
            onRemove: handleRemove,
          })}
          data={events}
          className="m-3 h-full"
          stickyColumns={['title']}
          tableId="events_record_table"
        >
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              {loading && <RecordTable.RowSkeleton rows={10} />}
              <RecordTable.RowList />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.Provider>
      </div>

      <EventFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditId(null);
        }}
        editId={editId}
        onSaved={() => void refetch()}
      />
    </>
  );
}
