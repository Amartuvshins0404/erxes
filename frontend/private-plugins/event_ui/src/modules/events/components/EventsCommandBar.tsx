import { IconTrash } from '@tabler/icons-react';
import { Row } from '@tanstack/react-table';
import { Button, CommandBar, RecordTable, Separator, useConfirm } from 'erxes-ui';
import { useEventMutations } from '@/events/hooks/useEventMutations';
import { IEvent } from '~/types/event';

export const EventsCommandBar = () => {
  const { table } = RecordTable.useRecordTable();
  const { deleteEvents, loading } = useEventMutations();
  const { confirm } = useConfirm();

  const selectedRows = table.getFilteredSelectedRowModel().rows as Row<IEvent>[];
  const eventIds = selectedRows.map((row) => row.original._id);

  const handleRemove = () =>
    confirm({
      message: `Remove ${eventIds.length} event${
        eventIds.length > 1 ? 's' : ''
      }? Their invitations and bookmarks are removed too.`,
    }).then(async () => {
      await deleteEvents(eventIds);
      table.resetRowSelection();
    });

  return (
    <CommandBar open={selectedRows.length > 0}>
      <CommandBar.Bar>
        <CommandBar.Value>{selectedRows.length} selected</CommandBar.Value>
        <Separator.Inline />
        <Button variant="destructive" disabled={loading} onClick={handleRemove}>
          <IconTrash />
          Remove
        </Button>
      </CommandBar.Bar>
    </CommandBar>
  );
};
