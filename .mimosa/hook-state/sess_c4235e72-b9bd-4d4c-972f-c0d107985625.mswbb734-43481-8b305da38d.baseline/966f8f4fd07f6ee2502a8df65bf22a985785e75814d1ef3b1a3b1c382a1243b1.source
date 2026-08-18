import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  parseDateRangeFromString,
  useMultiQueryState,
  validateFetchMore,
} from 'erxes-ui';
import {
  BLOCK_ADMIN_GET_DEVELOPERS,
  BLOCK_ADMIN_GET_DEVELOPERS_INLINE,
} from '../graphql/queries';
import { IDeveloperList } from '../types';

export const useDeveloperVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, created, foundedAt, city, district, status }] =
    useMultiQueryState<{
      searchValue: string;
      created: string;
      foundedAt: string;
      city: string;
      district: string;
      status: string;
    }>(['searchValue', 'created', 'foundedAt', 'city', 'district', 'status']);

  const dateFilters: Record<string, any> = {};

  if (created) {
    dateFilters.createdAt = {
      gte: parseDateRangeFromString(created)?.from,
      lte: parseDateRangeFromString(created)?.to,
    };
  }

  if (foundedAt) {
    dateFilters.dateFounded = {
      gte: parseDateRangeFromString(foundedAt)?.from,
      lte: parseDateRangeFromString(foundedAt)?.to,
    };
  }

  return {
    ...variables,
    searchValue,
    city,
    district,
    dateFilters: JSON.stringify(dateFilters),
    verificationStatus: status,
  };
};

export const useDevelopers = (options?: QueryHookOptions) => {
  const variables = useDeveloperVariables(options?.variables);

  const { data, loading } = useQuery<{
    getBlockAdminDevelopers: IDeveloperList;
  }>(BLOCK_ADMIN_GET_DEVELOPERS, { variables });

  return { developers: data?.getBlockAdminDevelopers?.list, loading };
};

export const useDevelopersInline = (options?: QueryHookOptions) => {
  const { data, loading, fetchMore } = useQuery<{
    getBlockAdminDevelopers: IDeveloperList;
  }>(BLOCK_ADMIN_GET_DEVELOPERS_INLINE, options);

  const variables = useDeveloperVariables(options?.variables);

  const handleFetchMore = (
    direction: EnumCursorDirection = EnumCursorDirection.FORWARD,
  ) => {
    if (!validateFetchMore({ direction, pageInfo })) {
      return;
    }
    fetchMore({
      ...(options || {}),
      variables: {
        ...variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: 10,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return Object.assign({}, prev, {
          getBlockAdminDevelopers: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.getBlockAdminDevelopers,
            prevResult: prev.getBlockAdminDevelopers,
          }),
        });
      },
    });
  };

  const {
    list: developers,
    pageInfo,
    totalCount,
  } = data?.getBlockAdminDevelopers || {};

  return {
    loading,
    developers,
    handleFetchMore,
    pageInfo,
    totalCount,
  };
};
