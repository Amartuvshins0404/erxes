import { QueryHookOptions, useQuery } from '@apollo/client';
import { IListingInline } from '../types/listing';
import { GET_LISTINGS } from '../graphql';
import {
  EnumCursorDirection,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';

type GetListingsQueryResponse = {
  blockGetListings: {
    list: IListingInline[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
};

export const useGetListings = (options?: QueryHookOptions) => {
  const { data, loading, error, fetchMore } =
    useQuery<GetListingsQueryResponse>(GET_LISTINGS, options);
  const { pageInfo, list, totalCount } = data?.blockGetListings || {};
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
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: 20,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          blockGetListings: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.blockGetListings,
            prevResult: prev.blockGetListings,
          }),
        };
      },
    });
  };

  return {
    list: data?.blockGetListings.list || [],
    totalCount,
    pageInfo,
    loading,
    error,
    handleFetchMore,
  };
};
