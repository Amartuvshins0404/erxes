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
