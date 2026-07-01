import { GET_CONTRACTS_LIST } from '../graphql/contractQueries';
import { IContract } from '../types/contractTypes';
import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  ICursorListResponse,
  mergeCursorData,
  useNonNullMultiQueryState,
  validateFetchMore,
} from 'erxes-ui';
import { useParams } from 'react-router-dom';

const CONTRACTS_PER_PAGE = 30;
export const CONTRACTS_CURSOR_SESSION_KEY = 'contracts_cursor_session_key';

interface IContractsListResponse {
  blockGetContractsList: {
    list: IContract[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}

export const useContractsFilterVariables = (variables?: {
  unit?: string;
  [key: string]: any;
}) => {
  const { projectId: projectIdParam, id } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || id || '';

  const { searchValue, status, partyType, currency, date, user } =
    useNonNullMultiQueryState<{
      searchValue: string;
      status: string;
      partyType: string;
      currency: string;
      date: string;
      user: string;
    }>(['searchValue', 'status', 'partyType', 'currency', 'date', 'user']);

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
    limit: CONTRACTS_PER_PAGE,
    direction: 'forward',
  };
};

export const useContractsList = (
  options?: QueryHookOptions<IContractsListResponse>,
) => {
  const variables = useContractsFilterVariables(options?.variables);

  const { data, loading, fetchMore } =
    useQuery<IContractsListResponse>(GET_CONTRACTS_LIST, {
      ...options,
      variables,
      fetchPolicy: 'cache-and-network',
    });

  const { list: contracts, pageInfo, totalCount } =
    data?.blockGetContractsList || {};

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
        limit: CONTRACTS_PER_PAGE,
        direction:
          direction === EnumCursorDirection.FORWARD ? 'forward' : 'backward',
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return Object.assign({}, prev, {
          blockGetContractsList: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.blockGetContractsList,
            prevResult: prev.blockGetContractsList,
          }),
        });
      },
    });
  };

  return {
    loading,
    contracts,
    handleFetchMore,
    pageInfo,
    totalCount,
  };
};
