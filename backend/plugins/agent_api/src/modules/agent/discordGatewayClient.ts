import { GraphQLError } from 'graphql';

type QueryValue = string | undefined | null;

const DEFAULT_GATEWAY_URL = 'https://assistant.erxes.io';
const DISCORD_RATE_LIMIT_MESSAGE =
  'Discord is rate limiting requests. Please wait a moment and try again.';

export class DiscordGatewayError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'DiscordGatewayError';
  }
}

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const getGatewayBaseUrl = () =>
  normalizeBaseUrl(
    (process.env.ERXES_AI_ASSISTANT_GATEWAY_URL || DEFAULT_GATEWAY_URL).trim(),
  );

const getGatewaySecret = () => {
  const secret = process.env.ERXES_AI_ASSISTANT_GATEWAY_SECRET?.trim();

  if (!secret) {
    throw new Error('ERXES_AI_ASSISTANT_GATEWAY_SECRET is not configured');
  }

  return secret;
};

const appendQuery = (url: URL, values: Record<string, QueryValue>) => {
  for (const [key, value] of Object.entries(values)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
};

const parseJsonResponse = async (response: Response): Promise<any> => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gateway returned an invalid JSON response');
  }
};

const gatewayRequest = async <T>(
  path: string,
  options: {
    method?: string;
    query?: Record<string, QueryValue>;
    body?: unknown;
  } = {},
) => {
  const url = new URL(`${getGatewayBaseUrl()}${path}`);

  appendQuery(url, options.query ?? {});

  const response = await fetch(url, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      'x-erxes-gateway-admin-secret': getGatewaySecret(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await parseJsonResponse(response);

  if (!response.ok) {
    const retryAfter =
      typeof body?.details?.retryAfter === 'number'
        ? body.details.retryAfter
        : undefined;
    const code =
      typeof body?.details?.code === 'string' ? body.details.code : undefined;

    if (response.status === 429 || code === 'DISCORD_RATE_LIMITED') {
      throw new GraphQLError(
        DISCORD_RATE_LIMIT_MESSAGE,
        {
          extensions: {
            code: 'DISCORD_RATE_LIMITED',
            statusCode: 429,
            retryAfter,
          },
        },
      );
    }

    const message =
      typeof body?.error === 'string'
        ? body.error
        : `Gateway request failed with status ${response.status}`;

    throw new DiscordGatewayError(message, response.status, code, retryAfter);
  }

  return body as T;
};

const normalizeReturnUrl = (returnUrl?: string) => {
  if (!returnUrl?.trim()) {
    return undefined;
  }

  const url = new URL(returnUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('returnUrl must use http or https');
  }

  return url.toString();
};

export type TDiscordInstallation = {
  _id: string;
  tenantId: string;
  assistantId?: string;
  discordGuildId: string;
  discordGuildName?: string;
  status: 'connected' | 'disabled' | 'revoked';
};

export type TDiscordChannel = {
  id: string;
  name: string;
  type: number;
  position?: number;
  parentId?: string;
};

export type TDiscordAssistantBinding = {
  _id: string;
  tenantId: string;
  assistantId: string;
  assistantName?: string;
  discordGuildId: string;
  discordChannelId: string;
  openclawUrl: string;
  enabled: boolean;
  responseMode?: 'slash_only' | 'all_messages';
};

export const createDiscordConnectUrl = ({
  tenantId,
  assistantId,
  erxesUserId,
  returnUrl,
}: {
  tenantId: string;
  assistantId: string;
  erxesUserId?: string;
  returnUrl?: string;
}) => {
  const url = new URL(`${getGatewayBaseUrl()}/discord/oauth/start`);

  appendQuery(url, {
    tenantId,
    assistantId,
    erxesUserId,
    returnUrl: normalizeReturnUrl(returnUrl),
  });

  return url.toString();
};

export const listDiscordInstallations = (query: {
  tenantId: string;
  assistantId?: string;
  status?: string;
}) =>
  gatewayRequest<{ installations: TDiscordInstallation[] }>(
    '/api/installations',
    { query },
  );

export const getDiscordInstallation = (installationId: string) =>
  gatewayRequest<{ installation: TDiscordInstallation }>(
    `/api/installations/${installationId}`,
  );

export const listDiscordChannels = (installationId: string) =>
  gatewayRequest<{ channels: TDiscordChannel[] }>(
    `/api/installations/${installationId}/channels`,
  );

export const listDiscordBindings = (query: {
  tenantId: string;
  assistantId?: string;
  discordGuildId?: string;
  discordChannelId?: string;
}) =>
  gatewayRequest<{ bindings: TDiscordAssistantBinding[] }>('/api/bindings', {
    query,
  });

export const getDiscordBinding = (bindingId: string) =>
  gatewayRequest<{ binding: TDiscordAssistantBinding }>(
    `/api/bindings/${bindingId}`,
  );

export const createOrUpdateDiscordBinding = (body: {
  installationId: string;
  tenantId: string;
  assistantId: string;
  assistantName?: string;
  discordGuildId: string;
  discordChannelId: string;
  openclawUrl: string;
  responseMode?: 'slash_only' | 'all_messages';
}) =>
  gatewayRequest<{ binding: TDiscordAssistantBinding }>('/api/bindings', {
    method: 'POST',
    body,
  });

export const deleteDiscordBinding = (bindingId: string) =>
  gatewayRequest<{ ok: boolean }>(`/api/bindings/${bindingId}`, {
    method: 'DELETE',
  });

export const updateDiscordBinding = (
  bindingId: string,
  body: {
    responseMode?: 'slash_only' | 'all_messages';
    enabled?: boolean;
  },
) =>
  gatewayRequest<{ binding: TDiscordAssistantBinding }>(
    `/api/bindings/${bindingId}`,
    {
      method: 'PATCH',
      body,
    },
  );
