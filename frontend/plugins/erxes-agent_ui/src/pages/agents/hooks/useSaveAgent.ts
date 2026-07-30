import { ApolloCache, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  MASTRA_AGENT_CREATE,
  MASTRA_AGENT_SET_AUDIENCE,
  MASTRA_AGENT_UPDATE,
} from '~/graphql/mutations';
import { AgentFormValues } from '../validations';
import type { IMastraAgent } from '../types';
import { agentMutationError } from './useAgentAccess';
import { useAgentsBasePath } from './useAgentsBasePath';

const cacheUpdate = (cache: ApolloCache<unknown>) => {
  cache.evict({ fieldName: 'mastraAgentsMain' });
  cache.evict({ fieldName: 'mastraAgents' });
  cache.gc();
};

/** Create/update mutations for the agent form; navigates back on success. */
export const useSaveAgent = (id?: string, current?: IMastraAgent | null) => {
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
  const [setAudience, { loading: settingAudience }] = useMutation(
    MASTRA_AGENT_SET_AUDIENCE,
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

    const { visibility, teamId, departmentId, unitId } = doc;
    const config: Partial<AgentFormValues> = { ...doc };
    delete config.agentId;
    delete config.visibility;
    delete config.teamId;
    delete config.departmentId;
    delete config.unitId;

    try {
      await updateAgent({ variables: { _id: id, doc: config } });

      const audienceChanged =
        current &&
        (visibility !== (current.visibility ?? 'private') ||
          (teamId ?? null) !== (current.teamId ?? null) ||
          (departmentId ?? null) !== (current.departmentId ?? null) ||
          (unitId ?? null) !== (current.unitId ?? null));

      if (audienceChanged) {
        await setAudience({
          variables: {
            _id: id,
            visibility,
            teamId,
            departmentId,
            unitId,
          },
        });
      }
      navigate(basePath);
    } catch {
      // Mutation handlers surface the server error.
    }
  };

  return {
    saveAgent,
    saving: creating || updating || settingAudience,
  };
};
