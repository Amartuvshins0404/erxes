import { IconEdit, IconSend, IconTrash } from '@tabler/icons-react';
import { Cell, ColumnDef } from '@tanstack/react-table';
import {
  Combobox,
  Command,
  Popover,
  RecordTable,
  useConfirm,
  useQueryState,
} from 'erxes-ui';
import { useEventMutations } from '@/events/hooks/useEventMutations';
import { IEvent } from '~/types/event';

const EventMoreColumnCell = ({ cell }: { cell: Cell<IEvent, unknown> }) => {
  const event = cell.row.original;
  const [, setEditEventId] = useQueryState<string>('editEventId');
  const [, setInviteEventId] = useQueryState<string>('inviteEventId');
  const { confirm } = useConfirm();
  const { deleteEvents } = useEventMutations();

  const isPublished = event.status === 'published';

  const handleDelete = () =>
    confirm({
      message: `Remove "${event.name}"? Its invitations and bookmarks are removed too.`,
    }).then(() => deleteEvents([event._id]));

  return (
    <Popover>
      <Popover.Trigger asChild>
        <RecordTable.MoreButton className="w-full h-full" />
      </Popover.Trigger>
      <Combobox.Content>
        <Command shouldFilter={false}>
          <Command.List>
            <Command.Item
              value="edit"
              onSelect={() => setEditEventId(event._id)}
            >
              <IconEdit /> Edit
            </Command.Item>
            {isPublished && (
              <Command.Item
                value="send-invitations"
                onSelect={() => setInviteEventId(event._id)}
              >
                <IconSend /> Send invitation
              </Command.Item>
            )}
            <Command.Item value="delete" onSelect={handleDelete}>
              <IconTrash /> Delete
            </Command.Item>
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

export const eventMoreColumn: ColumnDef<IEvent> = {
  id: 'more',
  header: () => <RecordTable.ColumnSelector />,
  cell: ({ cell }) => <EventMoreColumnCell cell={cell} />,
  size: 33,
};
