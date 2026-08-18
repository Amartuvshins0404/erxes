import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  useMultiQueryState,
  validateFetchMore,
} from 'erxes-ui';
import { MUSHOP_MEMBERSHIPS } from '../graphql/queries';
import { IMemberList } from '../types';

export const useMemberVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, status }] = useMultiQueryState<{
    searchValue: string;
    status: string;
  }>(['searchValue', 'status']);

  return {
    ...(variables || {}),
    searchValue: searchValue || undefined,
    status: status || undefined,
  };
};

export const useMembers = (options?: QueryHookOptions) => {
  const variables = useMemberVariables(options?.variables);

  const { data, loading, fetchMore } = useQuery<{
    mushopMemberships: IMemberList;
  }>(MUSHOP_MEMBERSHIPS, { ...options, variables });

  const {
    list: members,
    pageInfo,
    totalCount,
  } = data?.mushopMemberships || {};

  const handleFetchMore = ({
    direction = EnumCursorDirection.FORWARD,
  }: { direction?: EnumCursorDirection } = {}) => {
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
          mushopMemberships: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mushopMemberships,
            prevResult: prev.mushopMemberships,
          }),
        });
      },
    });
  };

  return { members, loading, pageInfo, totalCount, handleFetchMore };
};
