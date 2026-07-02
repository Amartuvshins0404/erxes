import { GET_OFFERS_LIST } from '../graphql/offerQueries';
import { IOffer } from '../types/offerTypes';
import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  ICursorListResponse,
  mergeCursorData,
  useNonNullMultiQueryState,
  validateFetchMore,
} from 'erxes-ui';
import { useParams } from 'react-router-dom';

const OFFERS_PER_PAGE = 30;
export const OFFERS_CURSOR_SESSION_KEY = 'offers_cursor_session_key';

interface IOffersListResponse {
  blockGetOffersList: {
    list: IOffer[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}

export const useOffersFilterVariables = (variables?: {
  unit?: string;
  [key: string]: any;
}) => {
  const { projectId: projectIdParam, id } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || id || '';

  const { searchValue, status, partyType, currency, user } =
    useNonNullMultiQueryState<{
      searchValue: string;
      status: string;
      partyType: string;
      currency: string;
      user: string;
    }>(['searchValue', 'status', 'partyType', 'currency', 'user']);

  return {
    filter: {
      projectId: projectId || undefined,
      search: searchValue || undefined,
      status: status || undefined,
      partyType: partyType || undefined,
      currency: currency || undefined,
      user: user || undefined,
      ...variables,
    },
    cursor: '',
    limit: OFFERS_PER_PAGE,
    direction: 'forward',
  };
};

export const useOffersList = (
  options?: QueryHookOptions<IOffersListResponse>,
) => {
  const variables = useOffersFilterVariables(options?.variables);

  const { data, loading, fetchMore } =
    useQuery<IOffersListResponse>(GET_OFFERS_LIST, {
      ...options,
      variables,
      fetchPolicy: 'cache-and-network',
    });

  const { list: offers, pageInfo, totalCount } =
    data?.blockGetOffersList || {};

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
        ...variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: OFFERS_PER_PAGE,
        direction:
          direction === EnumCursorDirection.FORWARD ? 'forward' : 'backward',
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return Object.assign({}, prev, {
          blockGetOffersList: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.blockGetOffersList,
            prevResult: prev.blockGetOffersList,
          }),
        });
      },
    });
  };

  return {
    loading,
    offers,
    handleFetchMore,
    pageInfo,
    totalCount,
  };
};
