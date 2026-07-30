import { sendTRPCMessage } from 'erxes-api-shared/utils';
import type { AgentAccount } from './servicePrincipal';
import { isAgentAccount } from './servicePrincipal';

interface RunTokenResponse {
  token?: unknown;
}

/**
 * Ask core to mint the short-lived token for this validated AI team member.
 * Core already owns the gateway signing secret and token-registration contract;
 * the plugin authenticates this request with its existing erxes App token.
 */
export async function mintRunToken(opts: {
  account: AgentAccount;
  subdomain: string;
  appToken?: string;
}): Promise<string | undefined> {
  const { account, subdomain, appToken } = opts;
  if (
    !account._id?.trim() ||
    !isAgentAccount(account) ||
    account.isActive === false ||
    !appToken?.trim()
  ) {
    return undefined;
  }

  try {
    const result: RunTokenResponse | null = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'users',
      action: 'issueRunToken',
      method: 'mutation',
      input: {
        userId: account._id,
        appToken: appToken.trim(),
      },
      defaultValue: null,
    });
    return typeof result?.token === 'string' && result.token.trim()
      ? result.token
      : undefined;
  } catch {
    return undefined;
  }
}
