import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { GET_AGENT } from '../graphql/queries';
import { SERVER_STATUSES } from '../../deploy/constants';

export const useAgent = (
  identifierId?: string,
  options?: { pollWhilePending?: boolean; pollIntervalMs?: number },
) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const { data, loading, refetch, startPolling, stopPolling } = useQuery(
    GET_AGENT,
    {
      skip: !currentIdentifierId,
      variables: { identifierId: currentIdentifierId },
    },
  );

  const agent = data?.getAgent;
  const shouldPoll =
    !!options?.pollWhilePending &&
    (agent?.status === SERVER_STATUSES.PENDING ||
      agent?.status === SERVER_STATUSES.DEPLOYING);

  useEffect(() => {
    if (!shouldPoll) {
      stopPolling();
      return;
    }

    startPolling(options?.pollIntervalMs || 4000);

    return () => stopPolling();
  }, [options?.pollIntervalMs, shouldPoll, startPolling, stopPolling]);

  return {
    agent,
    loading,
    refetch,
  };
};
