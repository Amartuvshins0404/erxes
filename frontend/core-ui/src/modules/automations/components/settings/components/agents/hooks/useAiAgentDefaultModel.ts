import { AI_AGENT_PROVIDER_DEFAULT_MODELS } from '@/automations/components/settings/components/agents/constants/providers';
import { AUTOMATIONS_AI_AGENT_MODELS } from '@/automations/components/settings/components/agents/graphql/automationsAiAgents';
import {
  getConnectionProvider,
  useAiAgentConnections,
} from '@/automations/components/settings/components/agents/hooks/useAiAgentConnections';
import { TAiAgentModelsResponse } from '@/automations/components/settings/components/agents/hooks/useAiAgentModelOptions';
import { TAiAgentForm } from '@/automations/components/settings/components/agents/states/AiAgentFormSchema';
import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

export const useAiAgentDefaultModel = (isNew: boolean) => {
  const { watch, setValue } = useFormContext<TAiAgentForm>();
  const connectionId = watch('connection.connectionId');
  const value = watch('connection.model');
  const { byId } = useAiAgentConnections();
  const provider = getConnectionProvider(byId.get(connectionId));

  const { data } = useQuery<TAiAgentModelsResponse>(
    AUTOMATIONS_AI_AGENT_MODELS,
    {
      variables: { connectionId },
      skip: !isNew || !connectionId,
      fetchPolicy: 'cache-and-network',
    },
  );

  const defaultModel = data?.automationsAiAgentModels?.find(
    ({ isDefault }) => isDefault,
  )?.id;

  useEffect(() => {
    if (
      isNew &&
      provider &&
      defaultModel &&
      value === AI_AGENT_PROVIDER_DEFAULT_MODELS[provider] &&
      defaultModel !== value
    ) {
      setValue('connection.model', defaultModel, { shouldDirty: true });
    }
  }, [defaultModel, isNew, provider, setValue, value]);
};
