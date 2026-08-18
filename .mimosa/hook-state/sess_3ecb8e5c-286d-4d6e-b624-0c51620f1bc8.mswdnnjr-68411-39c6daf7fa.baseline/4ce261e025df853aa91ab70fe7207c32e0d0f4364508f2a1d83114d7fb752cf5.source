import { useMutation, useQuery } from '@apollo/client';
import { useCurrentIdentifierId } from '../../../assistant-orgs/hooks/useAssistantOrg';
import { GET_OPENCODE_CREDENTIALS } from '../graphql/queries';
import { SET_OPENCODE_API_KEY } from '../graphql/mutations';

export const useOpencodeCredentials = (skip?: boolean) => {
  const identifierId = useCurrentIdentifierId();
  const { data, loading, refetch } = useQuery(GET_OPENCODE_CREDENTIALS, {
    variables: { identifierId },
    skip,
    fetchPolicy: 'network-only',
  });

  return {
    credentials: data?.getOpencodeCredentials ?? null,
    loading,
    refetch,
  };
};

export const useSetOpencodeApiKey = () => {
  const identifierId = useCurrentIdentifierId();
  const [setOpencodeApiKey, { loading }] = useMutation(SET_OPENCODE_API_KEY);

  const setKey = async (
    provider: string,
    apiKey: string,
    callbacks?: {
      onCompleted?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    await setOpencodeApiKey({
      variables: { identifierId, input: { provider, apiKey: apiKey.trim() } },
      context: { timeout: 0 },
      onCompleted: callbacks?.onCompleted,
      onError: callbacks?.onError,
    });
  };

  return { setKey, loading };
};
