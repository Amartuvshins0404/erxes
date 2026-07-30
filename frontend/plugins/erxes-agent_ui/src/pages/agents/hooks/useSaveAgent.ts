import { ApolloCache, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { MASTRA_AGENT_CREATE, MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import { AgentFormValues } from '../validations';
import { agentMutationError } from './useAgentAccess';
import { useAgentsBasePath } from './useAgentsBasePath';

const cacheUpdate = (cache: ApolloCache<unknown>) => {
  cache.evict({ fieldName: 'mastraAgentsMain' });
  cache.evict({ fieldName: 'mastraAgents' });
  cache.gc();
};

/** Create/update mutations for the agent form; navigates back on success. */
export const useSaveAgent = (id?: string) => {
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();

  const [createAgent, { loading: creating }] = useMutation(
    MASTRA_AGENT_CREATE,
    {
      update: cacheUpdate,
      onCompleted: () => navigate(basePath),
      onError: agentMutationError(),
    },
  );

  const [updateAgent, { loading: updating }] = useMutation(
    MASTRA_AGENT_UPDATE,
    {
      update: cacheUpdate,
      onError: agentMutationError(),
    },
  );

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
