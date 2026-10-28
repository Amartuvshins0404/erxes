import { useEffect, useRef } from 'react';
import { useStructureEntities } from 'ui-modules';
import { RECEIPTS_STRUCTURE_PAGE_SIZE } from '@/transactions/types/constants';

export const useReceiptsStructureEntities = (capability?: string) => {
  const requestedCursor = useRef<string>();
  const { structureEntities, pageInfo, loading, error, handleFetchMore } =
    useStructureEntities({
      variables: { capability, limit: RECEIPTS_STRUCTURE_PAGE_SIZE },
    });
  const { hasNextPage, endCursor } = pageInfo || {};

  useEffect(() => {
    if (!hasNextPage || !endCursor || requestedCursor.current === endCursor) {
      return;
    }
    requestedCursor.current = endCursor;
    handleFetchMore();
  }, [hasNextPage, endCursor, handleFetchMore]);

  return { structureEntities, loading, error };
};
