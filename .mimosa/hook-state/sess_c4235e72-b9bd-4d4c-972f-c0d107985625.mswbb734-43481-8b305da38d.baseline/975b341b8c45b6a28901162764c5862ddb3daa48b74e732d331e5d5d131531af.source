import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import { IAdminListing } from '../types/listingTypes';
import { GET_ADMIN_LISTINGS } from '../graphql';

type GetAdminListingsResponse = {
  getBlockAdminListings: {
    list: IAdminListing[];
    totalCount?: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null | undefined;
      endCursor: string | null | undefined;
    };
  };
};

const PER_PAGE = 30;

export const useAdminListings = (options?: QueryHookOptions) => {
  const { data, loading, error, fetchMore } =
    useQuery<GetAdminListingsResponse>(GET_ADMIN_LISTINGS, {
      ...options,
      variables: {
        limit: PER_PAGE,
        ...options?.variables,
      },
    });

  const { list, pageInfo, totalCount } = data?.getBlockAdminListings || {};

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (!validateFetchMore({ direction, pageInfo })) return;
    fetchMore({
      variables: {
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          getBlockAdminListings: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.getBlockAdminListings,
            prevResult: prev.getBlockAdminListings,
          }),
        };
      },
    });
  };

  return {
    list: list ?? [],
    totalCount,
    pageInfo,
    loading,
    error,
    handleFetchMore,
  };
};
