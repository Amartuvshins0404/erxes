import { getEnv } from 'erxes-api-shared/utils';
import { IAgentServerDocument } from './@types/agent';

const LOCAL_DEPLOYER_URL = 'http://localhost:4200';
const PROD_DEPLOYER_URL = 'https://deployer.erxes.io';

const getDeployerUrl = () => {
  const deployer = getEnv({ name: 'DEPLOYER_URL' }).trim();

  if (deployer) {
    return deployer.replace(/\/$/, '');
  }

  if (getEnv({ name: 'NODE_ENV' }).trim() !== 'production') {
    return LOCAL_DEPLOYER_URL;
  }

  return PROD_DEPLOYER_URL;
};

const readDeployerError = async (response: Response) => {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed?.error) {
      return parsed.error;
    }
  } catch {
    // use raw text as message
  }

  return raw;
};

interface DeployPaylaod {
  orgId: string;
  agentId: string;
  discordBotToken: string;
  kimiApiKey: string;
}

interface DeployResponse {
  serverName: string;
  serverUrl: string;
  gatewayToken: string;
  serverId: number;
  status?: string;
}

interface ManagedDeployPayload {
  orgId: string;
  assistantId: string;
  serverName: string;
  provider: string;
  kimiApiKey: string;
  description?: string;
  systemPrompt?: string;
}

export interface ManagedDeployResponse {
  success: boolean;
  status: 'approved';
  url: string;
  serverName: string;
  gatewayToken: string;
  serverId: number;
  stages?: Array<{
    stage: string;
    message: string;
    startedAt: string;
    completedAt?: string;
    durationMs?: number;
  }>;
}

const getRequiredEnv = (name: string) => {
  const value = getEnv({ name }).trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
};

const getManagedDeployerUrl = () =>
  (getEnv({ name: 'MANAGED_OPENCLAW_DEPLOYER_URL' }).trim() || getDeployerUrl())
    .replace(/\/$/, '');

const getManagedDeployerSecret = () =>
  getRequiredEnv('MANAGED_OPENCLAW_DEPLOYER_SECRET');

const getRuntimeSharedSecret = () =>
  getRequiredEnv('ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET');

const normalizeRuntimeUrl = (url: string) => url.trim().replace(/\/+$/, '');

const managedRuntimeRequest = async (
  url: string,
  options: RequestInit = {},
) =>
  fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30_000),
  });

export const deployServer = async (
  payload: DeployPaylaod,
): Promise<DeployResponse> => {
  const DEPLOYER = getDeployerUrl();
  const BOT_NAME = getEnv({ name: 'BOT_NAME' });

  if (!payload.discordBotToken?.trim()) {
    throw new Error('discordBotToken is required');
  }

  const DEPLOYER_URL = `${DEPLOYER}/agents/deploy`;
  const botName = BOT_NAME?.trim() || payload.agentId || 'OpenClaw';

  const body = {
    ...payload,
    botName,
  };

  const response = await fetch(DEPLOYER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed?.error === 'Not found') {
        message =
          'Deployer could not create the agent. Check DEPLOYER_URL and try again.';
      } else if (parsed?.error) {
        message = parsed.error;
      }
    } catch {
      // use raw text as message
    }
    throw new Error(`Deployment failed: ${message}`);
  }

  return response.json();
};

export const verifyManagedRuntime = async (runtimeUrl: string) => {
  const baseUrl = normalizeRuntimeUrl(runtimeUrl);
  const healthUrl = `${baseUrl}/api/erxes-ai-assistant/health`;
  const runtimeSecret = getRuntimeSharedSecret();

  const unauthenticated = await managedRuntimeRequest(healthUrl);

  if (unauthenticated.status !== 401) {
    throw new Error('Managed runtime health endpoint did not reject unauthenticated requests');
  }

  const authenticated = await managedRuntimeRequest(healthUrl, {
    headers: {
      'x-erxes-ai-assistant-secret': runtimeSecret,
    },
  });

  if (!authenticated.ok) {
    const message = await readDeployerError(authenticated);
    throw new Error(`Managed runtime health check failed: ${message}`);
  }
};

export const deployManagedServer = async (
  payload: ManagedDeployPayload,
): Promise<ManagedDeployResponse> => {
  const DEPLOYER = getManagedDeployerUrl();
  const response = await fetch(`${DEPLOYER}/agents/managed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-erxes-managed-deployer-secret': getManagedDeployerSecret(),
    },
    body: JSON.stringify({
      ...payload,
      erxesAssistantSecret: getRuntimeSharedSecret(),
    }),
  });

  if (!response.ok) {
    const message = await readDeployerError(response);
    throw new Error(`Managed deployment failed: ${message}`);
  }

  const result = (await response.json()) as ManagedDeployResponse;

  if (result.status !== 'approved' || !result.url?.trim()) {
    throw new Error('Managed deployer did not return an approved runtime URL');
  }

  // The deployer already verifies the runtime health before returning
  // "approved" — a second verification from the platform would hit the same
  // Cloudflare proxy that blocks same-DC requests, causing a false failure.
  return {
    ...result,
    url: normalizeRuntimeUrl(result.url),
  };
};

export const approveServer = async (
  agent: IAgentServerDocument,
  code: string,
) => {
  const DEPLOYER = getDeployerUrl();

  const DEPLOYER_URL = `${DEPLOYER}/tools/${agent.name}/discordapprove`;

  const body = { approveToken: code };

  const response = await fetch(DEPLOYER_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed?.error === 'Not found') {
        message =
          'Agent was not found by the deployer. It may still be deploying—try again in a few minutes, or redeploy.';
      } else if (parsed?.error) {
        message = parsed.error;
      }
    } catch {
      // use raw text as message
    }
    throw new Error(`Approve failed: ${message}`);
  }

  return response.json();
};

export const destroyServer = async (agent: IAgentServerDocument) => {
  const DEPLOYER = getDeployerUrl();

  const DEPLOYER_URL = `${DEPLOYER}/agents/${agent.name}`;

  const response = await fetch(DEPLOYER_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed?.error) {
        message = parsed.error;
      }
    } catch {
      // use raw text as message
    }
    throw new Error(`Destroy failed: ${message}`);
  }

  return response.json();
};

export interface AgentItem {
  agentId: string;
  botName: string;
  emoji?: string;
  theme?: string;
  soulMd?: string;
  mentionPatterns?: string[];
}

export interface AgentFile {
  fileName: string;
  content: string;
}

export const listAgents = async (serverName: string): Promise<AgentItem[]> => {
  const DEPLOYER = getDeployerUrl();

  const response = await fetch(`${DEPLOYER}/agents/${serverName}/list`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to list agents: ${message}`);
  }

  const data = (await response.json()) as { agents: AgentItem[] };

  return data.agents;
};

export const getAgentDetails = async (
  serverName: string,
  agentId?: string,
): Promise<AgentFile[]> => {
  const DEPLOYER = getDeployerUrl();
  const url = new URL(`${DEPLOYER}/agents/${serverName}/get-agent-details`);
  if (agentId) url.searchParams.set('agentId', agentId);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to get agent details: ${message}`);
  }

  const data = (await response.json()) as { files: AgentFile[] };
  return data.files;
};

export const addAgent = async (
  serverName: string,
  agent: AgentItem,
): Promise<void> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(`${DEPLOYER}/agents/${serverName}/addagent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to add agent: ${message}`);
  }
};

export const updateDiscordSettings = async (
  serverName: string,
  botToken: string,
  dmPolicy?: 'pairing' | 'open',
): Promise<void> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(`${DEPLOYER}/tools/${serverName}/discord`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken, dmPolicy }),
  });

  if (!response.ok) {
    const message = await readDeployerError(response);
    throw new Error(`Failed to update Discord settings: ${message}`);
  }
};

export const addDiscordGuild = async (
  serverName: string,
  guildId: string,
): Promise<void> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(
    `${DEPLOYER}/tools/${serverName}/adddiscordguild`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to add Discord guild: ${message}`);
  }
};

export const listDiscordGuilds = async (
  serverName: string,
): Promise<{ guildId: string; requireMention: boolean }[]> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(`${DEPLOYER}/tools/${serverName}/discordguilds`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to list Discord guilds: ${message}`);
  }

  const data = (await response.json()) as {
    guilds: Record<string, { requireMention: boolean }>;
  };

  return Object.entries(data.guilds).map(([guildId, opts]) => ({
    guildId,
    requireMention: opts.requireMention,
  }));
};

export const getGatewayToken = async (serverName: string): Promise<string> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(
    `${DEPLOYER}/agents/${serverName}/gateway-token`,
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to get gateway token: ${message}`);
  }

  const data = (await response.json()) as { token: string };
  return data.token;
};

export const fixAndRestartServer = async (
  serverName: string,
): Promise<void> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(`${DEPLOYER}/agents/${serverName}/fix-restart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to fix and restart server: ${message}`);
  }
};

export const checkKimiKeySet = async (
  serverName: string,
): Promise<boolean> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(
    `${DEPLOYER}/agents/${serverName}/check-kimi-key`,
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to check kimi key: ${message}`);
  }

  const data = (await response.json()) as { hasKey: boolean };
  return data.hasKey;
};

export const setKimiApiKey = async (
  serverName: string,
  kimiApiKey: string,
): Promise<void> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(
    `${DEPLOYER}/agents/${serverName}/set-kimi-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kimiApiKey }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to set kimi key: ${message}`);
  }
};

export const updateAgentFile = async (
  serverName: string,
  filename: string,
  content: string,
  agentId?: string,
): Promise<void> => {
  const DEPLOYER = getDeployerUrl();
  const response = await fetch(
    `${DEPLOYER}/agents/${serverName}/update-agent-file`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content, agentId }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to update agent file: ${message}`);
  }
};
