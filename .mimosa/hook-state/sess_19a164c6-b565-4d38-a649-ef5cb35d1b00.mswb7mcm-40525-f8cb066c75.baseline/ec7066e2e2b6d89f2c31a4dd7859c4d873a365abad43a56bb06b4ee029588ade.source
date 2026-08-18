import { AddOpptyWidgetSheet } from '@/oppty/components/AddOpptyWidgetSheet';
import { OpptysViewControl } from '@/oppty/components/OpptysView';
import { opptysViewAtom } from '@/oppty/states/opptysViewState';
import { opptyWidgetSheetState } from '@/oppty/states/opptyWidgetSheetState';
import { useUnitContext } from '@/unit/context/unitContext';
import { IconPlus } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { lazy, Suspense } from 'react';

const OpptysRecordTable = lazy(() =>
  import('@/oppty/components/OpptysRecordTable').then((mod) => ({
    default: mod.OpptysRecordTable,
  })),
);

const OpptysBoard = lazy(() =>
  import('@/oppty/components/OpttysBoard').then((mod) => ({
    default: mod.OpptysBoard,
  })),
);

export const UnitOpportunity = () => {
  const { unit } = useUnitContext();
  const unitId = unit?._id;
  const projectId = unit?.projectData?._id || '';
  const view = useAtomValue(opptysViewAtom);
  const setOpen = useSetAtom(opptyWidgetSheetState);

  const hasSignedContract = unit?.activeContract?.statusType === 'signed';
  const canAdd = !hasSignedContract && !unit?.locked;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <OpptysViewControl />
        {canAdd && (
          <>
            <Button onClick={() => setOpen(true)}>
              <IconPlus />
              Add opportunity
            </Button>
            <AddOpptyWidgetSheet
              defaultValues={{
                projectId,
                unitRows: [
                  {
                    buildingId: unit?.building || '',
                    zoningId: unit?.zoning || '',
                    unitId: unit?._id || '',
                    isMain: true,
                  },
                ],
              }}
            />
          </>
        )}
      </div>
      <Suspense>
        {view === 'list' ? (
          <OpptysRecordTable projectId={projectId} unitId={unitId} />
        ) : (
          <OpptysBoard projectId={projectId} unitId={unitId} />
        )}
      </Suspense>
    </div>
  );
};
