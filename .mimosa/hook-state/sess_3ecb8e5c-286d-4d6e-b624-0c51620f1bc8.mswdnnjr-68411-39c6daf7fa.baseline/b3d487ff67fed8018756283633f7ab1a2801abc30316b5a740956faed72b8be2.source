import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  useMultiQueryState,
  validateFetchMore,
} from 'erxes-ui';
import { MUSHOP_COLLECTIVES } from '../graphql/queries';
import { ICollectiveList } from '../types';

export const useCollectiveVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, status, targetSubdomain }] = useMultiQueryState<{
    searchValue: string;
    status: string;
    targetSubdomain: string;
  }>(['searchValue', 'status', 'targetSubdomain']);

  return {
    ...(variables || {}),
    searchValue: searchValue || undefined,
    status: status || undefined,
    targetSubdomain: targetSubdomain || undefined,
  };
};

export const useCollectives = (options?: QueryHookOptions) => {
  const variables = useCollectiveVariables(options?.variables);

  const { data, loading, fetchMore } = useQuery<{
    mushopCollectives: ICollectiveList;
  }>(MUSHOP_COLLECTIVES, { ...options, variables });

  const {
    list: collectives,
    pageInfo,
    totalCount,
  } = data?.mushopCollectives || {};

  const handleFetchMore = (
    direction: EnumCursorDirection = EnumCursorDirection.FORWARD,
  ) => {
    if (!validateFetchMore({ direction, pageInfo })) return;

    fetchMore({
      variables: {
        ...variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: 20,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          mushopCollectives: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mushopCollectives,
            prevResult: prev.mushopCollectives,
          }),
        });
      },
    });
  };

  return { collectives, loading, pageInfo, totalCount, handleFetchMore };
};
