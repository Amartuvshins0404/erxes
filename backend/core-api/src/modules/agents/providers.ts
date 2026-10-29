import type { MastraModelConfig } from '@mastra/core/llm' with {
  'resolution-mode': 'import',
};
import type { IResolvedConnection } from 'erxes-api-shared/core-modules';
import { ExpectedError } from 'erxes-api-shared/utils';

interface IProviderDefaults {
  baseUrl: string;
  model: string;
}

export const PROVIDER_DEFAULTS: Record<string, IProviderDefaults> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5.6-luna',
  },
  grok: {
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.5',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.ai/v1',
    model: 'kimi-k3',
  },
  'kimi-code': {
    baseUrl: 'https://api.kimi.com/coding',
    model: 'kimi-for-coding',
  },
  'cloudflare-ai-gateway': {
    baseUrl: 'https://gateway.ai.cloudflare.com/v1',
    model: 'openai/gpt-5.6-luna',
  },
};

export const getProviderDefaultModel = (provider: string): string => {
  const defaults = PROVIDER_DEFAULTS[provider];

  if (!defaults) {
    throw new Error(`Unsupported AI provider "${provider}"`);
  }

  return defaults.model;
};

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const readText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const readHeaders = (value: unknown): Record<string, string> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
};

const buildAnthropicBaseUrl = (baseUrl: string): string => {
  const trimmed = trimSlashes(baseUrl);

  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
};

const buildCloudflareBaseUrl = (config: Record<string, unknown>): string => {
  const accountId = readText(config.accountId);
  const gatewayId = readText(config.gatewayId);
  const root =
    readText(config.baseUrl) || PROVIDER_DEFAULTS['cloudflare-ai-gateway'].baseUrl;

  if (!accountId || !gatewayId) {
    return '';
  }

  return [
    root.replace(/\/+$/g, ''),
    trimSlashes(accountId),
    trimSlashes(gatewayId),
    config.mode === 'openai-provider' ? 'openai' : 'compat',
  ].join('/');
};

export interface IResolvedModelConnection {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
}

export const resolveModelConnection = ({
  connection,
  model: requestedModel,
}: {
  connection: IResolvedConnection;
  model?: string;
}): IResolvedModelConnection => {
  const provider = connection.type;
  const defaults = PROVIDER_DEFAULTS[provider];

  if (!defaults) {
    throw new ExpectedError(
      `Unsupported AI provider "${provider}".`,
      'VALIDATION_ERROR',
    );
  }

  const config = connection.config || {};
  const apiKey = readText(connection.secrets?.apiKey);
  const gatewayToken = readText(connection.secrets?.gatewayToken);
  const isCloudflare = provider === 'cloudflare-ai-gateway';
  const baseUrl = isCloudflare
    ? buildCloudflareBaseUrl(config)
    : readText(config.baseUrl) || defaults.baseUrl;

  if (isCloudflare && !baseUrl) {
    throw new ExpectedError(
      `Connection "${connection.name}" needs an account ID and gateway ID. Edit it in Settings → Connections.`,
      'VALIDATION_ERROR',
    );
  }

  if (!isCloudflare && !apiKey) {
    throw new ExpectedError(
      `Connection "${connection.name}" has no API key. Add it in Settings → Connections.`,
      'VALIDATION_ERROR',
    );
  }

  return {
    provider,
    model: readText(requestedModel) || defaults.model,
    baseUrl,
    apiKey,
    headers: {
      ...readHeaders(config.headers),
      ...(isCloudflare && gatewayToken
        ? { 'cf-aig-authorization': `Bearer ${gatewayToken}` }
        : {}),
    },
  };
};

export const createModelConfig = async (
  resolved: IResolvedModelConnection,
): Promise<MastraModelConfig> => {
  if (resolved.provider === 'kimi-code') {
    const { createAnthropic } = await import('@ai-sdk/anthropic');

    return createAnthropic({
      apiKey: resolved.apiKey,
      baseURL: buildAnthropicBaseUrl(resolved.baseUrl),
      headers: {
        Authorization: `Bearer ${resolved.apiKey}`,
        ...resolved.headers,
      },
    })(resolved.model);
  }

  const id: `${string}/${string}` = `${resolved.provider}/${resolved.model}`;

  if (
    resolved.provider === 'openai' &&
    resolved.baseUrl === PROVIDER_DEFAULTS.openai.baseUrl
  ) {
    return {
      id,
      apiKey: resolved.apiKey,
      headers: resolved.headers,
    };
  }

  return {
    id,
    url: resolved.baseUrl,
    apiKey: resolved.apiKey,
    headers: resolved.headers,
  };
};
