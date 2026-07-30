import { randomUUID } from 'node:crypto';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { clearGroupActionsCache } from 'erxes-api-shared/core-modules';
import type { GroupPermission } from '~/mastra/tools/actionsToAllowedTools';

// Core owns the AI team member's identity, status, and permissions. The plugin
// keeps only runtime configuration and links it to the account through the
// account's deterministic appId marker; no core schema or API change is needed.

export interface AgentAccount {
  _id: string;
  role?: string;
  isOwner?: boolean;
  isActive?: boolean;
  email?: string;
  username?: string;
  code?: string;
  groupIds?: string[];
  brandIds?: string[];
  branchIds?: string[];
  departmentIds?: string[];
  appId?: string;
  details?: { fullName?: string; description?: string; avatar?: string };
  permissionGroupIds?: string[];
  customPermissions?: GroupPermission[];
  createdAt?: Date | string;
}

export interface AgentAccountInput {
  name: string;
  description?: string;
  permissionGroupIds: string[];
  isActive?: boolean;
}

const CORE_USERS = { pluginName: 'core', module: 'users' } as const;
const AGENT_APP_PREFIX = 'erxes-agent:';

export const agentAccountAppId = (userId: string): string =>
  `${AGENT_APP_PREFIX}${userId}`;

export const isAgentAccount = (user: AgentAccount): boolean =>
  user.role === 'user' &&
  user.isOwner !== true &&
  Boolean(user.appId?.startsWith(AGENT_APP_PREFIX));

export const agentIdForAccount = (user: AgentAccount): string | null => {
  if (!isAgentAccount(user)) return null;
  const agentId = user.appId?.slice(AGENT_APP_PREFIX.length).trim();
  return agentId || null;
};

export const isAdoptableAgentAccount = (
  user: AgentAccount | null | undefined,
): user is AgentAccount =>
  Boolean(
    user?._id &&
      (user.appId?.startsWith(AGENT_APP_PREFIX) ||
        (user.role === 'system' && user.email?.endsWith('@agents.local'))),
  );

export const agentAccountName = (user: AgentAccount): string =>
  user.details?.fullName || user.username || user.email || 'AI team member';

const normalizePermissionGroupIds = (ids: string[]): string[] => [
  ...new Set(ids.map((id) => id.trim()).filter(Boolean)),
];

const accountHandle = (name: string): string => {
  const stem =
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'agent';
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  return `agent-${stem}-${suffix}`;
};

const findCoreUser = (
  subdomain: string,
  query: Record<string, unknown>,
): Promise<AgentAccount | null> =>
  sendTRPCMessage({
    subdomain,
    ...CORE_USERS,
    action: 'findOne',
    method: 'query',
    input: { query },
    defaultValue: null,
  });

export const findCoreUsers = (
  subdomain: string,
  query: Record<string, unknown>,
  fields?: Record<string, number>,
): Promise<AgentAccount[]> =>
  sendTRPCMessage({
    subdomain,
    ...CORE_USERS,
    action: 'find',
    method: 'query',
    input: { query, ...(fields ? { fields } : {}) },
    defaultValue: [],
  });

const createCoreUser = (
  subdomain: string,
  data: Record<string, unknown>,
): Promise<AgentAccount | null> =>
  sendTRPCMessage({
    subdomain,
    ...CORE_USERS,
    action: 'create',
    method: 'mutation',
    input: { data },
    defaultValue: null,
  });

const updateCoreUser = (
  subdomain: string,
  selector: Record<string, unknown>,
  modifier: Record<string, unknown>,
): Promise<unknown> =>
  sendTRPCMessage({
    subdomain,
    ...CORE_USERS,
    action: 'updateOne',
    method: 'mutation',
    input: { selector, modifier },
    defaultValue: null,
  });

export async function getAgentAccount(opts: {
  userId: string;
  subdomain: string;
  requireActive?: boolean;
}): Promise<AgentAccount> {
  const { userId, subdomain, requireActive = true } = opts;
  const agentId = userId.trim();
  const user = agentId
    ? await findCoreUser(subdomain, { appId: agentAccountAppId(agentId) })
    : null;
  if (!user?._id || !isAgentAccount(user)) {
    throw new Error(`AI team-member account for agent ${userId} was not found`);
  }
  if (requireActive && user.isActive === false) {
    throw new Error(`AI team-member account for agent ${userId} is inactive`);
  }
  return user;
}

export async function getAgentAccountByUserId(opts: {
  userId: string;
  subdomain: string;
  requireActive?: boolean;
}): Promise<AgentAccount> {
  const { userId, subdomain, requireActive = true } = opts;
  const user = await findCoreUser(subdomain, { _id: userId });
  if (!user?._id || !isAgentAccount(user)) {
    throw new Error(`AI team-member account ${userId} was not found`);
  }
  if (requireActive && user.isActive === false) {
    throw new Error(`AI team-member account ${userId} is inactive`);
  }
  return user;
}

export async function createAgentAccount(opts: {
  subdomain: string;
  input: AgentAccountInput;
  userId?: string;
}): Promise<AgentAccount> {
  const { subdomain, input } = opts;
  const requestedAgentId = opts.userId?.trim();
  const handle = accountHandle(input.name);
  const permissionGroupIds = normalizePermissionGroupIds(
    input.permissionGroupIds,
  );
  const created = await createCoreUser(subdomain, {
    notUsePassword: true,
    isActive: input.isActive !== false,
    isOwner: false,
    email: `${handle}@agents.local`,
    username: handle,
    details: {
      fullName: input.name.trim(),
      description: input.description?.trim() || '',
    },
  });

  if (!created?._id) {
    throw new Error('Failed to create AI team-member account');
  }

  const agentId = requestedAgentId || created._id;
  try {
    await updateCoreUser(
      subdomain,
      { _id: created._id },
      {
        $set: {
          role: 'user',
          isOwner: false,
          isActive: input.isActive !== false,
          appId: agentAccountAppId(agentId),
          permissionGroupIds,
          'details.fullName': input.name.trim(),
          'details.description': input.description?.trim() || '',
        },
      },
    );
    await clearGroupActionsCache({ subdomain, userId: created._id });
    return getAgentAccount({
      userId: agentId,
      subdomain,
      requireActive: false,
    });
  } catch (error) {
    await updateCoreUser(
      subdomain,
      { _id: created._id },
      { $set: { isActive: false } },
    ).catch(() => undefined);
    throw error;
  }
}

export async function updateAgentAccount(opts: {
  userId: string;
  subdomain: string;
  input: Partial<AgentAccountInput>;
}): Promise<AgentAccount> {
  const { userId, subdomain, input } = opts;
  const account = await getAgentAccount({
    userId,
    subdomain,
    requireActive: false,
  });

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set['details.fullName'] = input.name.trim();
  if (input.description !== undefined) {
    set['details.description'] = input.description.trim();
  }
  if (input.permissionGroupIds !== undefined) {
    set.permissionGroupIds = normalizePermissionGroupIds(
      input.permissionGroupIds,
    );
  }
  if (input.isActive !== undefined) set.isActive = input.isActive;

  if (Object.keys(set).length) {
    await updateCoreUser(subdomain, { _id: account._id }, { $set: set });
    if (input.permissionGroupIds !== undefined) {
      await clearGroupActionsCache({ subdomain, userId: account._id });
    }
  }

  return getAgentAccount({ userId, subdomain, requireActive: false });
}

export async function deactivateAgentAccount(opts: {
  userId: string;
  subdomain: string;
}): Promise<void> {
  const { userId, subdomain } = opts;
  const account = await getAgentAccount({
    userId,
    subdomain,
    requireActive: false,
  });
  await updateCoreUser(
    subdomain,
    { _id: account._id },
    { $set: { isActive: false } },
  );
  await clearGroupActionsCache({ subdomain, userId: account._id });
}

// Migration-only reconciliation for accounts created by the former linked-user
// model. It never claims an ordinary human account.
export async function adoptLegacyAgentAccount(opts: {
  agentId: string;
  accountId: string;
  subdomain: string;
  name: string;
  description?: string;
  permissionGroupIds: string[];
  isActive: boolean;
}): Promise<AgentAccount> {
  const {
    agentId,
    accountId,
    subdomain,
    name,
    description,
    permissionGroupIds,
    isActive,
  } = opts;
  const existing = await findCoreUser(subdomain, { _id: accountId });
  if (!isAdoptableAgentAccount(existing)) {
    throw new Error(`Refusing to claim non-agent account ${accountId}`);
  }

  await updateCoreUser(
    subdomain,
    { _id: accountId },
    {
      $set: {
        role: 'user',
        isOwner: false,
        isActive,
        appId: agentAccountAppId(agentId),
        permissionGroupIds: normalizePermissionGroupIds(permissionGroupIds),
        'details.fullName': name.trim(),
        'details.description': description?.trim() || '',
      },
    },
  );
  await clearGroupActionsCache({ subdomain, userId: accountId });
  return getAgentAccount({ userId: agentId, subdomain, requireActive: false });
}
