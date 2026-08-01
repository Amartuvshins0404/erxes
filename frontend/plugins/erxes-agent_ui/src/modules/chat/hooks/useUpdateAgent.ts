import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'erxes-ui';
import { MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import { AgentFormValues } from '~/pages/agents/validations';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { updateAgentRailCache } from '~/modules/chat/components/AgentRail.cache';

/**
 * Inline agent update for the in-chat "Edit agent" modal. Unlike useSaveAgent
 * (which navigates back to the settings list on success), this stays put and
 * writes the mutation result into the chat rail cache immediately.
 */
interface AgentUpdateResponse {
  mastraAgentUpdate?: IChatAgent;
}

export const useUpdateAgent = (agentId: string, onCompleted?: () => void) => {
  const { t } = useTranslation('erxes-agent');
  const [updateAgent, { loading: updating }] = useMutation<AgentUpdateResponse>(
    MASTRA_AGENT_UPDATE,
    {
      update: (cache, { data }) => {
        const updatedAgent = data?.mastraAgentUpdate;
        if (updatedAgent) updateAgentRailCache(cache, updatedAgent);
      },
      onError: (error) =>
        toast({
          title: t('agent-update-error'),
          description: error.message,
          variant: 'destructive',
        }),
    },
  );

  const saveAgent = async (doc: AgentFormValues) => {
    try {
      await updateAgent({ variables: { _id: agentId, doc } });
      toast({ title: t('agent-update-success') });
      onCompleted?.();
    } catch {
      // Mutation handlers surface the server error.
    }
  };

  return { saveAgent, saving: updating };
};
