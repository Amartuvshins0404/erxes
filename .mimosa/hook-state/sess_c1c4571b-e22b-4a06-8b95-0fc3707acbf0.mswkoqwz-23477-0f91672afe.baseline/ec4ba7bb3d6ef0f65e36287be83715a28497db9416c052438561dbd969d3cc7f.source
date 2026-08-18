import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { CREDIT_TRANSACTIONS_CURSOR_SESSION_KEY } from '../constants/creditTransactionCursorSessionKey';
import { ONE_FIT_CREDIT_TRANSACTIONS } from '../graphql/creditQueries';
import { CreditTransactionFilters } from '../types/credit';

const CREDIT_TRANSACTIONS_PER_PAGE = 20;

export const useCreditTransactions = (filters?: CreditTransactionFilters) => {
  const { cursor } = useRecordTableCursor({
    sessionKey: CREDIT_TRANSACTIONS_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_CREDIT_TRANSACTIONS,
    {
      variables: {
        ...filters,
        cursor,
      },
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_CREDIT_TRANSACTIONS, {
    variables: { limit: 1 },
  });

  const {
    list: creditTransactions,
    totalCount,
    pageInfo,
  } = data?.oneFitCreditTransactions || {};
  const overallTotalCount = overallData?.oneFitCreditTransactions?.totalCount;

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (
      !validateFetchMore({
        direction,
        pageInfo,
      })
    ) {
      return;
    }

    fetchMore({
      variables: {
        ...filters,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: CREDIT_TRANSACTIONS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitCreditTransactions: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitCreditTransactions,
            prevResult: prev.oneFitCreditTransactions,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
      cursor,
    });
  }, [refetch, filters, cursor]);

  return {
    creditTransactions,
    loading,
    error,
    totalCount,
    filteredTotalCount: totalCount,
    overallTotalCount,
    pageInfo,
    handleFetchMore,
    refetch: handleRefetch,
  };
};
