import { useSegments } from '@/segments/hooks/useSegments';
import { RecordTable, toast } from 'erxes-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentCommandBar } from './SegmentCommandBar';
import { SegmentEmptyState, SegmentErrorState } from './SegmentStates';
import { segmentColumns } from './SegmentsColumns';

export function SegmentsRecordTable() {
  const { segments, loading, error, refetch } = useSegments();
  const { t } = useTranslation('segment');
  const columns = useMemo(() => segmentColumns(t), [t]);

  if (error) {
    return (
      <SegmentErrorState
        error={error}
        onRetry={() =>
          refetch().catch(() =>
            toast({ title: t('error-description'), variant: 'destructive' }),
          )
        }
      />
    );
  }

  if (!loading && segments.length === 0) {
    return <SegmentEmptyState />;
  }

  return (
    <div className="flex flex-col h-full p-2 pt-0">
      <RecordTable.Provider
        columns={columns}
        data={segments}
        stickyColumns={['more', 'checkbox', 'name']}
        className="mt-1.5"
      >
        <RecordTable.Scroll>
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              {loading && !segments.length && (
                <RecordTable.RowSkeleton rows={20} />
              )}
              <RecordTable.RowList />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.Scroll>
        <SegmentCommandBar />
      </RecordTable.Provider>
    </div>
  );
}
