import { useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { FIX_AND_RESTART_AGENT } from '../graphql/mutations';

export const useFixAndRestart = () => {
  const identifierId = useCurrentIdentifierId();
  const [fixAndRestart, { loading }] = useMutation(FIX_AND_RESTART_AGENT);

  const restart = async (callbacks?: {
    onCompleted?: () => void;
    onError?: (error: Error) => void;
  }) => {
    await fixAndRestart({
      variables: { identifierId },
      context: { timeout: 0 },
      onCompleted: callbacks?.onCompleted,
      onError: callbacks?.onError,
    });
  };

  return { restart, loading };
};
