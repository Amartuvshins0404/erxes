import { Label, RecordTable } from 'erxes-ui';
import { useCollectiveSuppliers } from '../hooks/useCollectiveSuppliers';
import { supplierColumns } from './supplierColumns';

const PER_PAGE = 20;

export const CollectiveSuppliersList = () => {
  const { suppliers, loading, error } = useCollectiveSuppliers();

  if (error) {
    return <div className="p-6 text-destructive">{error.message}</div>;
  }

  const RecordMain = () => {
    if (loading) {
      return <RecordTable.RowSkeleton rows={PER_PAGE} />;
    }
    if (!suppliers.length) {
      return (
        <tr className="h-[40vh]">
          <td colSpan={supplierColumns.length} className="py-10 text-center">
            <div className="flex flex-col justify-center items-center text-muted-foreground">
              <Label>No suppliers in this collective yet.</Label>
            </div>
          </td>
        </tr>
      );
    }
    return <RecordTable.RowList />;
  };

  return (
    <RecordTable.Provider
      columns={supplierColumns}
      data={suppliers}
      stickyColumns={['checkbox', 'name']}
      className="m-3"
    >
      <RecordTable>
        <RecordTable.Header />
        <RecordTable.Body>
          <RecordMain />
        </RecordTable.Body>
      </RecordTable>
    </RecordTable.Provider>
  );
};
