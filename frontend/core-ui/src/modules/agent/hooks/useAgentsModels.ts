import { useQuery } from '@apollo/client';
import { useMemo } from 'react';

import { AGENTS_MODELS } from '../graphql/connection';
import type {
  IAgentsModelInfo,
  IAgentsModelsData,
} from '../graphql/connection';
import { toModelThinking } from '../utils/thinkingLevels';
import type { IAgentsModelThinking } from '../utils/thinkingLevels';

export interface IAgentsModelOption {
  id: string;
  family: string;
  recommended: boolean;
  name?: string | null;
  thinking?: IAgentsModelThinking | null;
}

export interface IAgentsProviderCatalog {
  connectionId: string;
  connectionName: string;
  provider: string;
  scope: string;
  isDefault: boolean;
  models: IAgentsModelOption[];
  error?: string;
}

export interface IUseAgentsModelsResult {
  providerModels: IAgentsProviderCatalog[];
  loading: boolean;
  error: string | undefined;
}

export const useAgentsModels = (): IUseAgentsModelsResult => {
  const { data, loading, error } = useQuery<IAgentsModelsData>(AGENTS_MODELS, {
    fetchPolicy: 'network-only',
  });

  const providerModels = useMemo(
    () =>
      (data?.agentsModels ?? []).map((group) => ({
        connectionId: group.connectionId,
        connectionName: group.connectionName,
        provider: group.provider,
        scope: group.scope,
        isDefault: group.isDefault === true,
        models: (
          group.catalog ??
          (group.models ?? []).map(
            (id): IAgentsModelInfo => ({ id, family: '', recommended: false }),
          )
        ).map((model) => ({
          id: model.id,
          family: model.family ?? '',
          recommended: model.recommended === true,
          name: model.name || null,
          thinking: toModelThinking(model.thinking),
        })),
        ...(group.error ? { error: group.error } : {}),
      })),
    [data],
  );

  return {
    providerModels,
    loading,
    error: error?.message,
  };
};
