import { isUndefinedOrNull, Skeleton } from 'erxes-ui';
import { useAtomValue } from 'jotai';
import {
  contractTotalCountBoardAtom,
  contractTotalCountAtom,
} from '@/contract/states/contractsTotalCountState';
import { contractsViewAtom } from '@/contract/states/contractsViewState';

export const ContractsTotalCount = () => {
  const totalCount = useAtomValue(contractTotalCountAtom);
  const totalCountBoard = useAtomValue(contractTotalCountBoardAtom);
  const view = useAtomValue(contractsViewAtom);

  const totalCountToShow = view === 'list' ? totalCount : totalCountBoard;

  return (
    <div className="text-muted-foreground font-medium text-sm whitespace-nowrap h-7 leading-7">
      {isUndefinedOrNull(totalCountToShow) ? (
        <Skeleton className="w-20 h-4 inline-block mt-1.5" />
      ) : (
        `${totalCountToShow} records found`
      )}
    </div>
  );
};
