import {
  EnumCursorDirection,
  ICursorListResponse,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import {
  GET_CV_CLIENT_DETAIL,
  GET_CV_CLIENTS,
} from '../graphql/cvClientsQueries';
import { QueryHookOptions, useQuery } from '@apollo/client';
import { ICVClient, ICVClientDetail } from '../clientsTypes';
import { useEffect } from 'react';
import { clientsTotalCountAtom } from '../states/clientsTotalCountAtom';
import { useSetAtom } from 'jotai';
import { useFilters } from '~/hooks/useFilters';
import { CLIENT_FILTERS } from '../components/ClientsFilter';

export const useClientDetail = ({ id }: { id: string }) => {
  const { data, loading, error } = useQuery<{ cvGetClient: ICVClientDetail }>(
    GET_CV_CLIENT_DETAIL,
    {
      variables: { id },
    },
  );
  return {
    clientDetail: data?.cvGetClient,
    loading,
    error,
  };
};

export const useClients = (
  options?: QueryHookOptions<ICursorListResponse<ICVClient>>,
) => {
  const setClientsTotalCount = useSetAtom(clientsTotalCountAtom);
  const { queries } = useFilters(CLIENT_FILTERS);

  const { data, loading, error, fetchMore } = useQuery<
    ICursorListResponse<ICVClient>
  >(GET_CV_CLIENTS, {
    variables: {
      ...options?.variables,
      filter: {
        ...queries,
        ...options?.variables?.filters,
      },
    },
  });
  const { list: clients, pageInfo, totalCount } = data?.cvGetClients || {};

  useEffect(() => {
    if (!totalCount) return;
    setClientsTotalCount(totalCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount]);

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
        limit: 30,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          cvGetClients: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.cvGetClients,
            prevResult: prev.cvGetClients,
          }),
        });
      },
    });
  };

  return {
    clients,
    pageInfo,
    totalCount,
    loading,
    error,
    handleFetchMore,
  };
};
