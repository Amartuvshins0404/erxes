import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { MASTRA_AGENTS } from '~/graphql/queries';
import { MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import { AgentFormValues } from '~/pages/agents/validations';
import type { IMastraAgent } from '~/pages/agents/types';

/**
 * Inline agent update for the in-chat "Edit agent" modal. Unlike useSaveAgent
 * (which navigates back to the settings list on success), this stays put and
 * refetches the chat rail's agent list so the change shows immediately.
 */
export const useUpdateAgent = (onCompleted?: () => void) => {
  const options = {
    refetchQueries: [{ query: MASTRA_AGENTS }],
    awaitRefetchQueries: true,
    onError: (error: Error) =>
      toast({
        title: 'Could not update agent',
        description: error.message,
        variant: 'destructive' as const,
      }),
  };
  const [updateAgent, { loading: updating }] = useMutation(
    MASTRA_AGENT_UPDATE,
    options,
  );

  const saveAgent = async (agent: IMastraAgent, doc: AgentFormValues) => {
    try {
      await updateAgent({ variables: { _id: agent._id, doc } });
      toast({ title: 'Agent updated' });
      onCompleted?.();
    } catch {
      // Mutation handlers surface the server error.
    }
  };

  return { saveAgent, saving: updating };
};
