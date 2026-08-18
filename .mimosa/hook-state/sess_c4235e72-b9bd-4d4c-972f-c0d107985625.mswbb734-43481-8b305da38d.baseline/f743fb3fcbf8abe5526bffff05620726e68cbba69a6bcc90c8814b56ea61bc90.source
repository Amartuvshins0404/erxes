import { useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../../assistant-orgs/hooks/useAssistantOrg';
import { FIX_AND_RESTART_OPENCODE } from '../graphql/mutations';

export const useOpencodeRestart = () => {
  const identifierId = useCurrentIdentifierId();
  const [restartMutation, { loading }] = useMutation(FIX_AND_RESTART_OPENCODE);

  const restart = async (callbacks?: {
    onCompleted?: () => void;
    onError?: (error: Error) => void;
  }) => {
    await restartMutation({
      variables: { identifierId },
      context: { timeout: 0 },
      onCompleted: callbacks?.onCompleted,
      onError: callbacks?.onError,
    });
  };

  return { restart, loading };
};
