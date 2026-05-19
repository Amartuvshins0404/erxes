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
}

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

export const approveServer = async (
  agent: IAgentServerDocument,
  code: string,
) => {
  const DEPLOYER = getDeployerUrl();

  console.log(agent.name);

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

  console.log('data', data);
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
