import { isUndefinedOrNull, Skeleton } from 'erxes-ui';
import { useAtomValue } from 'jotai';
import {
  opptyTotalCountBoardAtom,
  opptyTotalCountAtom,
} from '@/oppty/states/opptysTotalCountState';
import { opptysViewAtom } from '@/oppty/states/opptysViewState';

export const OpptysTotalCount = () => {
  const totalCount = useAtomValue(opptyTotalCountAtom);
  const totalCountBoard = useAtomValue(opptyTotalCountBoardAtom);
  const view = useAtomValue(opptysViewAtom);

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
