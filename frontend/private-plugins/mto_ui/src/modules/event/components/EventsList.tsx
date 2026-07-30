import { IconEdit, IconTrash } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  useConfirm,
} from 'erxes-ui';
import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { EventFilters } from '@/event/types/eventFilters';
import { MtoEvent, MtoEventCategory } from '@/event/types/event';
import { MTO_EVENTS } from '@/event/graphql/eventQueries';
import { MTO_EVENTS_REMOVE } from '@/event/graphql/eventMutations';
import { EventFormSheet } from '@/event/components/EventFormSheet';

interface EventsListProps {
  filters?: EventFilters;
}

const formatCategoryNames = (categories?: MtoEventCategory[]) => {
  if (!categories?.length) return '—';

  return categories
    .map((category) => category.name?.en || category.name?.mn)
    .filter(Boolean)
    .join(', ');
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString();
};

export function EventsList({ filters }: EventsListProps) {
  const { confirm } = useConfirm();
  const { data, loading, refetch } = useQuery(MTO_EVENTS, {
    variables: {
      status: filters?.status,
      isActive: filters?.isActive,
      searchValue: filters?.searchValue,
      startDateFrom: filters?.startDateFrom
        ? new Date(filters.startDateFrom).toISOString()
        : undefined,
      startDateTo: filters?.startDateTo
        ? new Date(`${filters.startDateTo}T23:59:59`).toISOString()
        : undefined,
      categoryId: filters?.categoryId,
    },
  });

  const [removeEvents] = useMutation(MTO_EVENTS_REMOVE);

  const [editId, setEditId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const events: MtoEvent[] = data?.mtoEvents ?? [];

  const handleRemove = (id: string) => {
    void confirm({
      message: 'Are you sure you want to remove this event?',
      options: { confirmationValue: 'delete' },
    }).then(() => {
      void removeEvents({ variables: { ids: [id] } }).then(() => refetch());
    });
  };

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'title',
      header: 'Title (EN)',
      cell: ({ cell }) => {
        const title = cell.getValue() as MtoEvent['title'];

        return (
          <RecordTableInlineCell className="font-medium max-w-[200px]">
            {title?.en || '—'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'titleMn',
      accessorKey: 'title',
      header: 'Title (MN)',
      cell: ({ cell }) => {
        const title = cell.getValue() as MtoEvent['title'];

        return (
          <RecordTableInlineCell className="max-w-[200px]">
            {title?.mn || '—'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'categories',
      accessorKey: 'categories',
      header: 'Categories',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="max-w-[220px]">
          {formatCategoryNames(cell.getValue() as MtoEventCategory[])}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="max-w-[160px]">
          {(cell.getValue() as string) || '—'}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-xs whitespace-nowrap">
          {formatDateTime(cell.getValue() as string)}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'End',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-xs whitespace-nowrap">
          {formatDateTime(cell.getValue() as string)}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => {
        const status = cell.getValue() as string;

        return (
          <RecordTableInlineCell>
            <Badge variant={status === 'published' ? 'success' : 'secondary'}>
              {status === 'published' ? 'Published' : 'Draft'}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ cell }) => {
        const active = cell.getValue() as boolean;

        return (
          <RecordTableInlineCell>
            <Badge variant={active ? 'success' : 'secondary'}>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-xs">
          <RelativeDateDisplay value={cell.getValue() as string} asChild>
            <RelativeDateDisplay.Value value={cell.getValue() as string} />
          </RelativeDateDisplay>
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const id = row.original._id as string;

        return (
          <RecordTableInlineCell className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setEditId(id);
                setSheetOpen(true);
              }}
            >
              <IconEdit size={16} />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => void handleRemove(id)}
            >
              <IconTrash size={16} />
            </Button>
          </RecordTableInlineCell>
        );
      },
    },
  ];

  return (
    <>
      <RecordTable.Provider columns={columns} data={events} className="m-3">
        <RecordTable>
          <RecordTable.Header />
          <RecordTable.Body>
            {loading && <RecordTable.RowSkeleton rows={10} />}
            <RecordTable.RowList />
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.Provider>

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
