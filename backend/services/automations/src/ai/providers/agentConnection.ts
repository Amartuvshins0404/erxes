import { resolveConnection } from 'erxes-api-shared/core-modules';
import type {
  TAiAgentConnection,
  TAiProviderConnection,
} from '../aiAgent/connection';
import { aiProviderConnectionSchema } from '../aiAgent/connection';
import {
  AI_AGENT_PROVIDER_DEFAULT_MODELS,
  AI_AGENT_SUPPORTED_PROVIDERS,
} from '../aiAgent/constants';
import { resolveAiProviderConnection } from './resolve';

const NOT_RESOLVABLE_PATTERN = /not found/i;
const SERVICE_AUTH_PATTERN = /service authentication/i;

const dropEmptyValues = (
  values: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );

const isSupportedProvider = (
  type: string,
): type is (typeof AI_AGENT_SUPPORTED_PROVIDERS)[number] =>
  AI_AGENT_SUPPORTED_PROVIDERS.some((provider) => provider === type);

const toResolveError = (error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error);

  if (SERVICE_AUTH_PATTERN.test(message)) {
    return new Error(
      'Automations could not authenticate with core to load the AI connection. Set ERXES_SERVICE_TOKEN or ERXES_MASTER_KEY for the automations service.',
    );
  }

  if (NOT_RESOLVABLE_PATTERN.test(message)) {
    return new Error(
      'The AI connection this agent uses was removed or is not shared with automations. Pick another connection, or allow automations on it in Settings > Connections.',
    );
  }

  return new Error(`Failed to load the AI connection: ${message}`);
};

export type TAiAgentConnectionSource = {
  name: string;
  connection: TAiProviderConnection;
};

export const loadAiAgentConnectionSource = async ({
  subdomain,
  connection,
}: {
  subdomain: string;
  connection: Pick<TAiAgentConnection, 'connectionId'> &
    Partial<Pick<TAiAgentConnection, 'model'>>;
}): Promise<TAiAgentConnectionSource> => {
  const connectionId = connection?.connectionId?.trim();

  if (!connectionId) {
    throw new Error(
      'This AI agent has no AI connection selected. Choose one in the agent settings.',
    );
  }

  const resolved = await resolveConnection({ subdomain, connectionId }).catch(
    (error: unknown) => {
      throw toResolveError(error);
    },
  );

  if (!isSupportedProvider(resolved.type)) {
    throw new Error(
      `AI connection "${resolved.name}" is of type "${resolved.type}", which automations cannot use.`,
    );
  }

  const parsed = aiProviderConnectionSchema.safeParse({
    provider: resolved.type,
    model:
      connection.model?.trim() ||
      AI_AGENT_PROVIDER_DEFAULT_MODELS[resolved.type],
    config: dropEmptyValues({ ...resolved.config, ...resolved.secrets }),
  });

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(({ path, message }) => `${path.join('.') || 'config'}: ${message}`)
      .join('; ');

    throw new Error(
      `AI connection "${resolved.name}" has an invalid configuration (${detail}).`,
    );
  }

  return { name: resolved.name, connection: parsed.data };
};

export const resolveAiAgentConnection = async ({
  subdomain,
  connection,
}: {
  subdomain: string;
  connection: TAiAgentConnection;
}): Promise<TAiProviderConnection> => {
  const source = await loadAiAgentConnectionSource({ subdomain, connection });

  return resolveAiProviderConnection({
    connection: source.connection,
    connectionName: source.name,
  });
};
