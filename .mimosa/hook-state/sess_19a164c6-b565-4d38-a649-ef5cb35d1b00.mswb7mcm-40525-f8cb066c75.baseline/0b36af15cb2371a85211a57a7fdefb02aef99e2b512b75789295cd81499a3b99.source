import { Label, RecordTable } from 'erxes-ui';
import { unitColumns } from './unitColumns';
import { useGetUnits } from '../hooks/useGetUnits';
import { BlockUnitStatus } from '../types/unit';

type Props = { status?: BlockUnitStatus };

export const UnitRecordTable = ({ status }: Props) => {
  const { units, loading, totalCount } = useGetUnits({ status } as any);

  const RecordMain = () => {
    if (loading) {
      return <RecordTable.RowSkeleton rows={20} />;
    }
    if (!totalCount) {
      return (
        <tr className="h-[40vh]">
          <td colSpan={5} className="py-10 text-center">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Label>No assigned units</Label>
            </div>
          </td>
        </tr>
      );
    }
    return <RecordTable.RowList />;
  };

  return (
    <RecordTable.Provider
      columns={unitColumns}
      data={units}
      stickyColumns={['blockUnitId']}
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
