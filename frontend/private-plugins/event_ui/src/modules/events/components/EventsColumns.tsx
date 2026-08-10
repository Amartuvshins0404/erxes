import {
  IconCalendarEvent,
  IconCalendarPlus,
  IconClock,
  IconListNumbers,
  IconMapPin,
  IconTag,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  RecordTable,
  RecordTableInlineCell,
  useQueryState,
} from 'erxes-ui';
import { eventMoreColumn } from '@/events/components/EventMoreColumn';
import { EVENT_STATUS_LABELS } from '~/lib/constants';
import { formatDateTime } from '~/lib/datetime';
import { EventStatus, IEvent } from '~/types/event';

const STATUS_VARIANT: Record<
  EventStatus,
  'default' | 'secondary' | 'destructive'
> = {
  published: 'default',
  draft: 'secondary',
  cancelled: 'destructive',
};

const NameCell = ({ event }: { event: IEvent }) => {
  const [, setEditEventId] = useQueryState<string>('editEventId');

  return (
    <RecordTableInlineCell>
      <RecordTableInlineCell.Anchor
        onClick={() => setEditEventId(event._id)}
      >
        {event.name}
      </RecordTableInlineCell.Anchor>
    </RecordTableInlineCell>
  );
};

const venueLabel = (event: IEvent) => {
  if (event.isOnline) {
    return 'Online';
  }

  const { address, district, city } = event.location ?? {};

  return address || [district, city].filter(Boolean).join(', ') || '-';
};

export const eventsColumns: ColumnDef<IEvent>[] = [
  eventMoreColumn,
  RecordTable.checkboxColumn as ColumnDef<IEvent>,
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <RecordTable.InlineHead icon={IconCalendarEvent} label="Event" />
    ),
    size: 280,
    cell: ({ row }) => <NameCell event={row.original} />,
  },
  {
    id: 'startDate',
    accessorKey: 'startDate',
    header: () => (
      <RecordTable.InlineHead icon={IconCalendarEvent} label="Starts" />
    ),
    size: 170,
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {formatDateTime(cell.getValue() as string)}
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'endDate',
    accessorKey: 'endDate',
    header: () => <RecordTable.InlineHead icon={IconClock} label="Ends" />,
    size: 170,
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {formatDateTime(cell.getValue() as string)}
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'location',
    accessorFn: (event) => venueLabel(event),
    header: () => <RecordTable.InlineHead icon={IconMapPin} label="Venue" />,
    size: 240,
    cell: ({ row }) => (
      <RecordTableInlineCell>{venueLabel(row.original)}</RecordTableInlineCell>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => <RecordTable.InlineHead icon={IconTag} label="Status" />,
    size: 130,
    cell: ({ cell }) => {
      const status = (cell.getValue() as EventStatus) ?? 'draft';

      return (
        <RecordTableInlineCell>
          <Badge variant={STATUS_VARIANT[status]}>
            {EVENT_STATUS_LABELS[status]}
          </Badge>
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'attendance',
    accessorKey: 'goingCount',
    header: () => <RecordTable.InlineHead icon={IconUsers} label="Going" />,
    size: 120,
    cell: ({ row }) => {
      const { goingCount, capacity } = row.original;

      return (
        <RecordTableInlineCell>
          {capacity ? `${goingCount ?? 0} / ${capacity}` : goingCount ?? 0}
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'isOnline',
    accessorKey: 'isOnline',
    header: () => <RecordTable.InlineHead icon={IconWorld} label="Format" />,
    size: 120,
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <Badge variant="secondary">
          {cell.getValue() ? 'Online' : 'In person'}
        </Badge>
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'agenda',
    accessorFn: (event) => event.agenda?.length ?? 0,
    header: () => (
      <RecordTable.InlineHead icon={IconListNumbers} label="Agenda" />
    ),
    size: 110,
    cell: ({ row }) => {
      const count = row.original.agenda?.length ?? 0;

      return (
        <RecordTableInlineCell>
          {count ? `${count} item${count > 1 ? 's' : ''}` : '-'}
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => (
      <RecordTable.InlineHead icon={IconCalendarPlus} label="Created at" />
    ),
    size: 170,
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {formatDateTime(cell.getValue() as string)}
      </RecordTableInlineCell>
    ),
  },
];
