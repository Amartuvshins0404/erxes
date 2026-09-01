import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import { IAdminListing } from '../types/listingTypes';
import { GET_ADMIN_LISTINGS } from '../graphql';

type GetAdminListingsResponse = {
  getBlockAdminAgencyListings: {
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

  const { list, pageInfo, totalCount } = data?.getBlockAdminAgencyListings || {};

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
          getBlockAdminAgencyListings: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.getBlockAdminAgencyListings,
            prevResult: prev.getBlockAdminAgencyListings,
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
