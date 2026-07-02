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
import { useMemo, useState } from 'react';
import { CategoryFilters } from '@/category/types/categoryFilters';
import { MtoCategory } from '@/category/types/category';
import { MTO_CATEGORIES } from '@/category/graphql/categoryQueries';
import { MTO_CATEGORIES_REMOVE } from '@/category/graphql/categoryMutations';
import { CategoryFormSheet } from '@/category/components/CategoryFormSheet';
import { isMainCategory } from '@/category/hooks/useCategoryOptions';

interface CategoriesListProps {
  filters?: CategoryFilters;
}

export function CategoriesList({ filters }: CategoriesListProps) {
  const { confirm } = useConfirm();
  const { data, loading, refetch } = useQuery(MTO_CATEGORIES, {
    variables: {
      isActive: filters?.isActive,
      level: filters?.level && filters.level !== 'all' ? filters.level : undefined,
      onlyTopLevel: filters?.level === 'main' ? true : undefined,
    },
  });

  const [removeCategories] = useMutation(MTO_CATEGORIES_REMOVE);

  const [editId, setEditId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const categories = useMemo(() => {
    const rows = (data?.mtoAssociations ?? []) as MtoCategory[];

    if (filters?.level === 'sub') {
      return rows.filter((category) => !isMainCategory(category));
    }

    return rows;
  }, [data?.mtoAssociations, filters?.level]);

  const handleRemove = (id: string) => {
    void confirm({
      message: 'Are you sure you want to remove this category?',
      options: { confirmationValue: 'delete' },
    }).then(() => {
      void removeCategories({ variables: { ids: [id] } }).then(() => refetch());
    });
  };

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'name',
      header: 'Name (EN)',
      cell: ({ cell }) => {
        const name = cell.getValue() as MtoCategory['name'];

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
        const name = cell.getValue() as MtoCategory['name'];

        return (
          <RecordTableInlineCell className="max-w-[200px]">
            {name?.mn || '—'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'level',
      header: 'Level',
      cell: ({ row }) => {
        const category = row.original as MtoCategory;
        const main = isMainCategory(category);

        return (
          <RecordTableInlineCell>
            <Badge variant={main ? 'default' : 'secondary'}>
              {main ? 'Main' : 'Sub'}
            </Badge>
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
              onClick={() => handleRemove(id)}
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
      <RecordTable.Provider columns={columns} data={categories} className="m-3">
        <RecordTable>
          <RecordTable.Header />
          <RecordTable.Body>
            {loading && <RecordTable.RowSkeleton rows={10} />}
            <RecordTable.RowList />
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.Provider>

      <CategoryFormSheet
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
