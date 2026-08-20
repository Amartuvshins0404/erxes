import { IconCategory } from '@tabler/icons-react';
import { Empty, RecordTable, useConfirm } from 'erxes-ui';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { categoryColumns } from '@/category/components/CategoryColumns';
import { CategoryFormSheet } from '@/category/components/CategoryFormSheet';
import { useCategories } from '@/category/hooks/useCategories';
import { MTO_CATEGORIES_REMOVE } from '@/category/graphql/categoryMutations';

export function CategoriesRecordTable() {
  const { confirm } = useConfirm();
  const { categories, loading, refetch } = useCategories();
  const [removeCategories] = useMutation(MTO_CATEGORIES_REMOVE);
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRemove = (id: string) => {
    void confirm({
      message: 'Are you sure you want to remove this category?',
      options: { confirmationValue: 'delete' },
    }).then(() => {
      void removeCategories({ variables: { ids: [id] } }).then(() => refetch());
    });
  };

  if (!loading && categories.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconCategory />
          </Empty.Media>
          <Empty.Title>No categories found</Empty.Title>
          <Empty.Description>
            There seem to be no categories.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <>
      <RecordTable.Provider
        columns={categoryColumns({
          onEdit: (id) => {
            setEditId(id);
            setSheetOpen(true);
          },
          onRemove: handleRemove,
        })}
        data={categories}
        className="m-3"
        tableId="categories_record_table"
      >
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
