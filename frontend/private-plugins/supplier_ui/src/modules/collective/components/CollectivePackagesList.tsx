import { Label, RecordTable } from 'erxes-ui';
import { useCollectivePackages } from '../hooks/useCollectivePackages';
import { packageColumns } from './packageColumns';

const PER_PAGE = 20;

export const CollectivePackagesList = () => {
  const { packages, loading, error } = useCollectivePackages();

  if (error) {
    return <div className="p-6 text-destructive">{error.message}</div>;
  }

  const RecordMain = () => {
    if (loading) {
      return <RecordTable.RowSkeleton rows={PER_PAGE} />;
    }
    if (!packages.length) {
      return (
        <tr className="h-[40vh]">
          <td colSpan={packageColumns.length} className="py-10 text-center">
            <div className="flex flex-col justify-center items-center text-muted-foreground">
              <Label>No packages yet. Create your first one.</Label>
            </div>
          </td>
        </tr>
      );
    }
    return <RecordTable.RowList />;
  };

  return (
    <RecordTable.Provider
      columns={packageColumns}
      data={packages}
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
