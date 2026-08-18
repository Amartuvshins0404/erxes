import { useApolloClient, useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { GET_AGENT } from '../../main/graphql/queries';
import { SET_AGENT_LLM_CONNECTION } from '../graphql/mutations';
import { START_AGENT_LLM_SUBSCRIPTION_AUTH } from '../graphql/mutations';
import { AGENT_LLM_SUBSCRIPTION_AUTH_STATUS } from '../../main/graphql/queries';

interface SetLlmConnectionInput {
  provider: string;
  model: string;
  credentialMode: 'api_key' | 'subscription';
  apiKey?: string;
  subscriptionToken?: string;
}

export interface SubscriptionAuthState {
  status: string;
  verificationUrl?: string | null;
  userCode?: string | null;
  expiresAt?: number | null;
  message?: string | null;
  error?: string | null;
}

interface SetLlmConnectionCallbacks {
  onCompleted?: () => void;
  onError?: (error: Error) => void;
}

export const useSetLlmConnection = () => {
  const identifierId = useCurrentIdentifierId();
  const [setAgentLlmConnection, { loading }] = useMutation(
    SET_AGENT_LLM_CONNECTION,
    {
      refetchQueries: [
        {
          query: GET_AGENT,
          variables: { identifierId },
        },
      ],
      awaitRefetchQueries: true,
    },
  );

  const setConnection = async (
    input: SetLlmConnectionInput,
    callbacks?: SetLlmConnectionCallbacks,
  ) => {
    await setAgentLlmConnection({
      variables: { identifierId, input },
      // Applying a key re-provisions the assistant and waits for the pod to come
      // back (~60-90s). Bound the wait so a dropped proxy connection can never
      // hang the dialog forever (previously timeout:0 => frozen UI, refresh only).
      context: { timeout: 180000 },
      onCompleted: callbacks?.onCompleted,
      onError: callbacks?.onError,
    });
  };

  return { setConnection, loading };
};

interface SubscriptionAuthResult {
  startAgentLlmSubscriptionAuth?: { records?: SubscriptionAuthState };
  agentLlmSubscriptionAuthStatus?: { records?: SubscriptionAuthState };
}

const readSubscriptionState = (result?: { data?: SubscriptionAuthResult }) =>
  result?.data?.startAgentLlmSubscriptionAuth?.records ||
  result?.data?.agentLlmSubscriptionAuthStatus?.records ||
  null;

export const useLlmSubscriptionAuth = () => {
  const identifierId = useCurrentIdentifierId();
  const client = useApolloClient();
  const [startMutation, { loading: starting }] = useMutation<
    SubscriptionAuthResult,
    { identifierId?: string }
  >(
    START_AGENT_LLM_SUBSCRIPTION_AUTH,
  );

  const start = useCallback(
    async () =>
      readSubscriptionState(
        await startMutation({ variables: { identifierId } }),
      ),
    [identifierId, startMutation],
  );

  const getStatus = useCallback(async () => {
    const result = await client.query<SubscriptionAuthResult>({
      query: AGENT_LLM_SUBSCRIPTION_AUTH_STATUS,
      variables: { identifierId },
      fetchPolicy: 'no-cache',
    });

    const state = readSubscriptionState(result);

    if (state?.status === 'connected') {
      await client.refetchQueries({
        include: [GET_AGENT],
      });
    }

    return state;
  }, [client, identifierId]);

  return { start, getStatus, starting };
};
