import { useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { GET_AGENT } from '../../main/graphql/queries';
import { SET_AGENT_LLM_CONNECTION } from '../graphql/mutations';

interface SetLlmConnectionInput {
  provider: string;
  model: string;
  apiKey: string;
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
      context: { timeout: 0 },
      onCompleted: callbacks?.onCompleted,
      onError: callbacks?.onError,
    });
  };

  return { setConnection, loading };
};
