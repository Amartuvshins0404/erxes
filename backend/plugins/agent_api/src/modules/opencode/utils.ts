import { getEnv } from 'erxes-api-shared/utils';
import { IOpencodeServerDocument } from './@types/opencode';

const LOCAL_DEPLOYER_URL = 'http://localhost:4200';
const PROD_DEPLOYER_URL = 'https://deployer.erxes.io';

interface DeployPayload {
  orgId: string;
  agentId: string;
  provider: string;
  apiKey: string;
}

interface DeployResponse {
  serverName: string;
  serverUrl: string;
  gatewayToken: string;
  serverPassword?: string;
  serverId: number;
}

interface ServerInfoResponse {
  serverName: string;
  serverId: number;
  status: string;
  serverUrl: string;
}

export const isOpencodeServerReady = async (serverUrl?: string) => {
  if (!serverUrl) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${serverUrl.replace(/\/$/, '')}/global/health`, {
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

export const normalizeOpencodeProvider = (provider: string) => {
  const normalized = provider.trim().toLowerCase();

  switch (normalized) {
    case 'kimi-for-coding':
    case 'kimi':
      return 'kimi-for-coding';
    case 'moonshot':
    case 'moonshot-ai':
      return 'moonshotai';
    case 'moonshot-cn':
      return 'moonshotai-cn';
    default:
      return normalized;
  }
};

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

const getErrorMessage = async (response: Response, fallback: string) => {
  const raw = await response.text();
  let message = raw || fallback;

  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed?.error) {
      message = parsed.error;
    }
  } catch {
    // keep raw body
  }

  return message;
};

export const deployOpencodeServer = async (
  payload: DeployPayload,
): Promise<DeployResponse> => {
  const deployer = getDeployerUrl();

  const response = await fetch(`${deployer}/opencode/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Deploy failed');
    throw new Error(`Deployment failed: ${message}`);
  }

  return response.json();
};

export const destroyOpencodeServer = async (
  server: IOpencodeServerDocument,
): Promise<void> => {
  const deployer = getDeployerUrl();
  const response = await fetch(`${deployer}/opencode/${server.name}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Destroy failed');
    throw new Error(`Destroy failed: ${message}`);
  }
};

export const fixAndRestartOpencodeServer = async (
  serverName: string,
): Promise<void> => {
  const deployer = getDeployerUrl();
  const response = await fetch(`${deployer}/opencode/${serverName}/fix-restart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Restart failed');
    throw new Error(`Failed to restart server: ${message}`);
  }
};

export const setOpencodeApiKey = async ({
  serverName,
  provider,
  apiKey,
}: {
  serverName: string;
  provider: string;
  apiKey: string;
}): Promise<void> => {
  const deployer = getDeployerUrl();
  const response = await fetch(`${deployer}/opencode/${serverName}/set-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey }),
  });

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Set API key failed');
    throw new Error(`Failed to set API key: ${message}`);
  }
};

export const getOpencodeServerInfo = async (
  serverName: string,
): Promise<ServerInfoResponse> => {
  const deployer = getDeployerUrl();
  const response = await fetch(`${deployer}/opencode/${serverName}/status`);

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Status check failed');
    throw new Error(`Failed to get server status: ${message}`);
  }

  return response.json();
};

export const getOpencodeGatewayToken = async (
  serverName: string,
): Promise<string> => {
  const deployer = getDeployerUrl();
  const response = await fetch(`${deployer}/opencode/${serverName}/gateway-token`);

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Gateway token fetch failed');
    throw new Error(`Failed to get gateway token: ${message}`);
  }

  const data = (await response.json()) as { token: string };
  return data.token;
};

export const getOpencodeServerPassword = async (
  serverName: string,
): Promise<{ username: string; password: string }> => {
  const deployer = getDeployerUrl();
  const response = await fetch(
    `${deployer}/opencode/${serverName}/server-password`,
  );

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Password fetch failed');
    throw new Error(`Failed to get server password: ${message}`);
  }

  return response.json();
};
