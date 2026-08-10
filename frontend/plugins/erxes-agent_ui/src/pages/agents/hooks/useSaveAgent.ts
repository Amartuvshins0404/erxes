import type { ApolloCache } from '@apollo/client';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { MASTRA_AGENT_CREATE, MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import { MASTRA_AGENTS } from '~/graphql/queries';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { AgentFormValues } from '../validations';
import { agentMutationError } from './useAgentAccess';
import { useAgentsBasePath } from './useAgentsBasePath';

interface AgentMutationResponse {
  mastraAgentCreate?: IChatAgent | null;
  mastraAgentUpdate?: IChatAgent | null;
}

const invalidateAgentLists = (cache: ApolloCache<unknown>) => {
  cache.evict({ fieldName: 'mastraAgents' });
  cache.evict({ fieldName: 'mastraAgentsMain' });
  cache.gc();
};

/** Create/update mutations for the agent form; navigates back on success. */
export const useSaveAgent = (id?: string) => {
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();

  const [createAgent, { loading: creating }] =
    useMutation<AgentMutationResponse>(MASTRA_AGENT_CREATE, {
      update: (cache) => invalidateAgentLists(cache),
      refetchQueries: [{ query: MASTRA_AGENTS }],
      onCompleted: () => navigate(basePath),
      onError: agentMutationError(),
    });

  const [updateAgent, { loading: updating }] =
    useMutation<AgentMutationResponse>(MASTRA_AGENT_UPDATE, {
      update: (cache) => invalidateAgentLists(cache),
      refetchQueries: [{ query: MASTRA_AGENTS }],
      onError: agentMutationError(),
    });

  const saveAgent = async (doc: AgentFormValues) => {
    if (!id) {
      await createAgent({ variables: { doc } });
      return;
    }

    try {
      await updateAgent({ variables: { _id: id, doc } });
      navigate(basePath);
    } catch {
      // Mutation handlers surface the server error.
    }
  };

  return {
    saveAgent,
    saving: creating || updating,
  };
};
