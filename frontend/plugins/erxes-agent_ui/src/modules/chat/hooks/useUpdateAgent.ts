import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { MASTRA_AGENTS } from '~/graphql/queries';
import {
  MASTRA_AGENT_SET_AUDIENCE,
  MASTRA_AGENT_UPDATE,
} from '~/graphql/mutations';
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
  const [setAudience, { loading: settingAudience }] = useMutation(
    MASTRA_AGENT_SET_AUDIENCE,
    options,
  );

  const saveAgent = async (agent: IMastraAgent, doc: AgentFormValues) => {
    const { visibility, teamId, departmentId, unitId } = doc;
    const config: Partial<AgentFormValues> = { ...doc };
    delete config.agentId;
    delete config.visibility;
    delete config.teamId;
    delete config.departmentId;
    delete config.unitId;

    try {
      await updateAgent({ variables: { _id: agent._id, doc: config } });
      const audienceChanged =
        visibility !== (agent.visibility ?? 'private') ||
        (teamId ?? null) !== (agent.teamId ?? null) ||
        (departmentId ?? null) !== (agent.departmentId ?? null) ||
        (unitId ?? null) !== (agent.unitId ?? null);
      if (audienceChanged) {
        await setAudience({
          variables: {
            _id: agent._id,
            visibility,
            teamId,
            departmentId,
            unitId,
          },
        });
      }
      toast({ title: 'Agent updated' });
      onCompleted?.();
    } catch {
      // Mutation handlers surface the server error.
    }
  };

  return { saveAgent, saving: updating || settingAudience };
};
