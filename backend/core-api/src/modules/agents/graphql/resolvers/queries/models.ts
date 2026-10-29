import { ExpectedError } from 'erxes-api-shared/utils';
import type { IResolvedConnection } from 'erxes-api-shared/core-modules';
import type { IContext } from '~/connectionResolvers';
import { toResolvedConnection } from '@/connections/access';
import {
  getDefaultConnectionId,
  listUsableConnections,
  pickUsableConnection,
} from '@/agents/connectionAccess';
import {
  buildProviderModelCatalog,
  getDocumentedProviderModels,
  type IProviderModelEntry,
} from '@/agents/modelCatalog';
import { getModelDisplayName, getModelThinking } from '@/agents/modelThinking';
import {
  describeUnreadableKey,
  fetchProviderModels,
  MODEL_LIST_UNSUPPORTED,
} from '@/agents/providerModels';
import { PROVIDER_DEFAULTS } from '@/agents/providers';

interface IListedConnection {
  resolved: IResolvedConnection;
  unreadable: string[];
  scope: string;
  isDefault: boolean;
}

const listProviderModels = async ({
  resolved,
  unreadable,
  scope,
  isDefault,
}: IListedConnection) => {
  const provider = resolved.type;
  const apiKey = resolved.secrets.apiKey ?? '';
  const documented = getDocumentedProviderModels(provider);
  const toResult = (entries: IProviderModelEntry[], error: string | null) => {
    const catalog = buildProviderModelCatalog({
      provider,
      entries,
      preferred: [PROVIDER_DEFAULTS[provider]?.model ?? ''],
    });

    return {
      connectionId: resolved._id,
      connectionName: resolved.name,
      provider,
      scope,
      isDefault,
      models: catalog.map((model) => model.id),
      catalog: catalog.map((model) => ({
        ...model,
        name: getModelDisplayName(provider, model.id),
        thinking: getModelThinking(provider, model.id),
      })),
      error,
    };
  };

  if (!apiKey && provider !== 'cloudflare-ai-gateway') {
    return toResult(
      [],
      describeUnreadableKey(
        provider,
        unreadable.includes('apiKey') ? 'unreadable' : 'missing',
      ),
    );
  }

  try {
    const listed = await fetchProviderModels({ provider, apiKey });

    return toResult([...listed, ...documented], null);
  } catch (error: unknown) {
    const message =
      error instanceof ExpectedError
        ? error.message
        : `Could not list models for "${provider}".`;
    const unsupported =
      error instanceof ExpectedError && error.code === MODEL_LIST_UNSUPPORTED;

    return toResult(
      documented,
      unsupported && documented.length > 0 ? null : message,
    );
  }
};

export const agentsModelsQueries = {
  agentsModels: async (_p: undefined, _a: undefined, ctx: IContext) => {
    await ctx.checkPermission('agentsChat');

    const usable = await listUsableConnections(ctx.models, ctx.user._id);
    const defaultId = pickUsableConnection(usable, {
      defaultId: await getDefaultConnectionId(ctx.models, ctx.user._id),
    })?._id;

    return Promise.all(
      usable.map((connection) =>
        listProviderModels({
          ...toResolvedConnection(connection),
          scope: connection.scope,
          isDefault: connection._id === defaultId,
        }),
      ),
    );
  },
};
