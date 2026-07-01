import { ContractAddSheet } from '@/contract/components/ContractAdd';
import { ContractsViewControl } from '@/contract/components/ContractsView';
import { contractsViewAtom } from '@/contract/states/contractsViewState';
import { useUnitContext } from '@/unit/context/unitContext';
import { useAtomValue } from 'jotai';
import { lazy, Suspense } from 'react';

const ContractsRecordTable = lazy(() =>
  import('@/contract/components/ContractsRecordTable').then((mod) => ({
    default: mod.ContractsRecordTable,
  })),
);

const ContractsBoard = lazy(() =>
  import('@/contract/components/ContractsBoard').then((mod) => ({
    default: mod.ContractsBoard,
  })),
);

export const UnitContract = () => {
  const { unit } = useUnitContext();
  const unitId = unit?._id;
  const view = useAtomValue(contractsViewAtom);

  const hasSignedContract = unit?.activeContract?.statusType === 'signed';
  const canAdd = !hasSignedContract && !unit?.locked;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <ContractsViewControl />
        {canAdd && <ContractAddSheet />}
      </div>
      <Suspense>
        {view === 'list' ? (
          <ContractsRecordTable unitId={unitId} />
        ) : (
          <ContractsBoard unitId={unitId} />
        )}
      </Suspense>
    </div>
  );
};
