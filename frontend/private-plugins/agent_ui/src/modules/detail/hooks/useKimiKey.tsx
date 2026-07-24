import { useQuery } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { CHECK_KIMI_KEY_SET } from '../graphql/queries';

export const useKimiKeyStatus = (skip?: boolean) => {
  const identifierId = useCurrentIdentifierId();
  const { data, loading, refetch } = useQuery<{ checkKimiKeySet: boolean }>(
    CHECK_KIMI_KEY_SET,
    { variables: { identifierId }, skip, fetchPolicy: 'network-only' },
  );

  return {
    hasKey: data?.checkKimiKeySet ?? null,
    loading,
    refetch,
  };
};
