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
import { AssociationFilters } from '@/association/types/associationFilters';
import { MTO_ASSOCIATIONS } from '@/association/graphql/associationQueries';
import { MTO_ASSOCIATIONS_REMOVE } from '@/association/graphql/associationMutations';
import { AssociationFormSheet } from '@/association/components/AssociationFormSheet';

type AssociationRow = {
  _id: string;
  name?: { en?: string; mn?: string };
  logo?: string;
  isActive?: boolean;
  createdAt?: string;
};

interface AssociationsListProps {
  filters?: AssociationFilters;
}

export function AssociationsList({ filters }: AssociationsListProps) {
  const { confirm } = useConfirm();
  const { data, loading, refetch } = useQuery(MTO_ASSOCIATIONS, {
    variables: {
      isActive: filters?.isActive,
    },
  });

  const [removeAssociations] = useMutation(MTO_ASSOCIATIONS_REMOVE);

  const [editId, setEditId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const associations: AssociationRow[] = data?.mtoAssociations ?? [];

  const handleRemove = (id: string) => {
    void confirm({
      message: 'Are you sure you want to remove this association?',
      options: { confirmationValue: 'delete' },
    }).then(() => {
      void removeAssociations({ variables: { ids: [id] } }).then(() => refetch());
    });
  };

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'name',
      header: 'Name (EN)',
      cell: ({ cell }) => {
        const name = cell.getValue() as AssociationRow['name'];
        return (
          <RecordTableInlineCell className="font-medium max-w-[200px]">
            {name?.en || '—'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'nameMn',
      accessorKey: 'name',
      header: 'Name (MN)',
      cell: ({ cell }) => {
        const name = cell.getValue() as AssociationRow['name'];
        return (
          <RecordTableInlineCell className="max-w-[200px]">
            {name?.mn || '—'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
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
      <RecordTable.Provider
        columns={columns}
        data={associations}
        className="m-3"
      >
        <RecordTable>
          <RecordTable.Header />
          <RecordTable.Body>
            {loading && <RecordTable.RowSkeleton rows={10} />}
            <RecordTable.RowList />
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.Provider>

      <AssociationFormSheet
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
