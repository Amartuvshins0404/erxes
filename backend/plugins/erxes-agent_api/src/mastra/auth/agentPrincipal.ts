import type { IMastraAgentDocument } from '@/agent/@types/agent';
import { getAgentAccount } from './servicePrincipal';

/** Auth propagated to every agent tool under the canonical core user. */
export interface AgentPrincipalAuthCtx {
  userHeader: string;
  principalUserId: string;
  subdomain: string;
  agentId: string;
}

export type AgentPrincipalResult =
  | { ok: true; authCtx: AgentPrincipalAuthCtx }
  | { ok: false; error: string };

export type PrincipalSource =
  | Pick<IMastraAgentDocument, '_id'>
  | null
  | undefined;

/**
 * Resolve the canonical AI team-member account for internal service calls.
 * The plugin forwards this validated principal only to private subgraph
 * addresses; it never asks core to mint a user token.
 */
export async function resolveAgentPrincipal(opts: {
  agentConfig: PrincipalSource;
  subdomain: string;
}): Promise<AgentPrincipalResult> {
  const { agentConfig, subdomain } = opts;

  const userId = agentConfig?._id;
  if (!userId) {
    return {
      ok: false,
      error: 'Agent run refused: no AI team-member identity could be resolved.',
    };
  }

  let account;
  try {
    account = await getAgentAccount({ userId, subdomain });
  } catch {
    return {
      ok: false,
      error:
        'Agent run refused: the AI team-member account is missing or inactive.',
    };
  }
  if (
    !account.permissionGroupIds?.length &&
    !account.customPermissions?.length
  ) {
    return {
      ok: false,
      error:
        'Agent run refused: the AI team member has no permissions. Assign its permissions in Team Members.',
    };
  }

  return {
    ok: true,
    authCtx: {
      userHeader: Buffer.from(
        JSON.stringify({
          _id: account._id,
          email: account.email,
          details: account.details,
          isOwner: false,
          groupIds: account.groupIds,
          brandIds: account.brandIds,
          username: account.username,
          code: account.code,
          branchIds: account.branchIds,
          departmentIds: account.departmentIds,
          permissionGroupIds: account.permissionGroupIds ?? [],
          customPermissions: account.customPermissions ?? [],
          sessionCode: '',
        }),
      ).toString('base64'),
      principalUserId: account._id,
      subdomain,
      agentId: userId,
    },
  };
}
