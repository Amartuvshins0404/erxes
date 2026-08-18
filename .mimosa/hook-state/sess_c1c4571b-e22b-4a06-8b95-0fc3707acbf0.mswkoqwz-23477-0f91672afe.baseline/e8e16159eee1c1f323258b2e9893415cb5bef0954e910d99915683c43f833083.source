import { GET_OPPTYS } from '@/oppty/graphql/queries/getOpptys';
import { OPPTY_LIST_CHANGED } from '@/oppty/graphql/subscriptions/opptyListChanged';
import { IOppty } from '@/oppty/types/opptyTypes';
import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  ICursorListResponse,
  isUndefinedOrNull,
  mergeCursorData,
  parseDateRangeFromString,
  useNonNullMultiQueryState,
  useToast,
  validateFetchMore,
} from 'erxes-ui';
import { useEffect } from 'react';

const OPPTYS_PER_PAGE = 30;

interface IOpptyChanged {
  blockOpptyListChanged: {
    type: string;
    oppty: IOppty;
  };
}

export const useOpptysVariables = (
  variables?: QueryHookOptions<ICursorListResponse<IOppty>>['variables'],
) => {
  const { searchValue, assignedUserId, priority, customerSource, unitType, tenureType, startDate, targetDate } =
    useNonNullMultiQueryState<{
      searchValue: string;
      assignedUserId: string;
      priority: string;
      customerSource: string;
      unitType: string;
      tenureType: string;
      startDate: string;
      targetDate: string;
    }>(['searchValue', 'assignedUserId', 'priority', 'customerSource', 'unitType', 'tenureType', 'startDate', 'targetDate']);

  const dateFilters: Record<string, any> = {};

  if (startDate) {
    dateFilters.startDate = {
      gte: parseDateRangeFromString(startDate)?.from,
      lte: parseDateRangeFromString(startDate)?.to,
    };
  }

  if (targetDate) {
    dateFilters.targetDate = {
      gte: parseDateRangeFromString(targetDate)?.from,
      lte: parseDateRangeFromString(targetDate)?.to,
    };
  }

  return {
    cursor: '',
    limit: OPPTYS_PER_PAGE,
    direction: 'forward',
    searchValue,
    assignedUserId,
    priority,
    customerSource,
    unitType,
    tenureType,
    dateFilters: JSON.stringify(dateFilters),
    ...variables,
  };
};

export const useOpptys = (
  projectId: string,
  options?: QueryHookOptions<ICursorListResponse<IOppty>>,
) => {
  const variables = useOpptysVariables(options?.variables);
  const { toast } = useToast();
  const { data, loading, fetchMore, subscribeToMore } = useQuery<
    ICursorListResponse<IOppty>
  >(GET_OPPTYS, {
    ...options,
    variables: { projectId, filter: variables },
    skip: options?.skip || isUndefinedOrNull(variables.cursor),
    fetchPolicy: 'cache-and-network',
    onError: (e) => {
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive',
      });
    },
  });

  const { list: opptys, pageInfo, totalCount } = data?.blockGetOpptys || {};

  useEffect(() => {
    const unsubscribe = subscribeToMore<IOpptyChanged>({
      document: OPPTY_LIST_CHANGED,
      variables: { projectId, filter: variables },
      updateQuery: (prev, { subscriptionData }) => {
        if (!prev || !subscriptionData.data) return prev;

        const { type, oppty } = subscriptionData.data.blockOpptyListChanged;
        const currentList = prev.blockGetOpptys.list;

        let updatedList = currentList;

        if (type === 'create') {
          const exists = currentList.some(
            (item: IOppty) => item._id === oppty._id,
          );
          if (!exists) {
            updatedList = [oppty, ...currentList];
          }
        }

        if (type === 'update') {
          updatedList = currentList.map((item: IOppty) =>
            item._id === oppty._id ? { ...item, ...oppty } : item,
          );
        }

        if (type === 'remove') {
          updatedList = currentList.filter(
            (item: IOppty) => item._id !== oppty._id,
          );
        }

        return {
          ...prev,
          blockGetOpptys: {
            ...prev.blockGetOpptys,
            list: updatedList,
            pageInfo: prev.blockGetOpptys.pageInfo,
            totalCount:
              type === 'create'
                ? prev.blockGetOpptys.totalCount + 1
                : type === 'remove'
                  ? prev.blockGetOpptys.totalCount - 1
                  : prev.blockGetOpptys.totalCount,
          },
        };
      },
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variables]);

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (!validateFetchMore({ direction, pageInfo })) {
      return;
    }

    fetchMore({
      variables: {
        projectId,
        filter: {
          ...variables,
          cursor:
            direction === EnumCursorDirection.FORWARD
              ? pageInfo?.endCursor
              : pageInfo?.startCursor,
          limit: OPPTYS_PER_PAGE,
          direction:
            direction === EnumCursorDirection.FORWARD ? 'forward' : 'backward',
        },
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return Object.assign({}, prev, {
          blockGetOpptys: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.blockGetOpptys,
            prevResult: prev.blockGetOpptys,
          }),
        });
      },
    });
  };

  return {
    loading,
    opptys,
    handleFetchMore,
    pageInfo,
    totalCount,
  };
};
