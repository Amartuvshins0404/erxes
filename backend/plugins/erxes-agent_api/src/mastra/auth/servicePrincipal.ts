import { randomUUID } from 'node:crypto';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { clearGroupActionsCache } from 'erxes-api-shared/core-modules';
import type { GroupPermission } from '~/mastra/tools/actionsToAllowedTools';

// A Mastra agent is a core team-member account. The plugin stores only the
// account's 1:1 AI profile under the same _id; core owns identity, status, and
// permissions. These helpers are the sole account lifecycle boundary.

export interface AgentAccount {
  _id: string;
  role?: string;
  isOwner?: boolean;
  isActive?: boolean;
  email?: string;
  username?: string;
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
  const { subdomain, input, userId } = opts;
  const handle = accountHandle(input.name);
  const permissionGroupIds = normalizePermissionGroupIds(
    input.permissionGroupIds,
  );
  const created = await createCoreUser(subdomain, {
    ...(userId ? { _id: userId } : {}),
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

  if (userId && created._id !== userId) {
    await updateCoreUser(
      subdomain,
      { _id: created._id },
      { $set: { isActive: false } },
    ).catch(() => undefined);
    throw new Error('Core did not preserve the requested AI team-member ID');
  }

  try {
    await updateCoreUser(
      subdomain,
      { _id: created._id },
      {
        $set: {
          role: 'user',
          isOwner: false,
          isActive: input.isActive !== false,
          appId: agentAccountAppId(created._id),
          permissionGroupIds,
          'details.fullName': input.name.trim(),
          'details.description': input.description?.trim() || '',
        },
      },
    );
    await clearGroupActionsCache({ subdomain, userId: created._id });
    return getAgentAccount({
      userId: created._id,
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
  await getAgentAccount({ userId, subdomain, requireActive: false });

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
    await updateCoreUser(subdomain, { _id: userId }, { $set: set });
    if (input.permissionGroupIds !== undefined) {
      await clearGroupActionsCache({ subdomain, userId });
    }
  }

  return getAgentAccount({ userId, subdomain, requireActive: false });
}

export async function deactivateAgentAccount(opts: {
  userId: string;
  subdomain: string;
}): Promise<void> {
  const { userId, subdomain } = opts;
  await getAgentAccount({ userId, subdomain, requireActive: false });
  await updateCoreUser(
    subdomain,
    { _id: userId },
    { $set: { isActive: false } },
  );
  await clearGroupActionsCache({ subdomain, userId });
}

// Migration-only reconciliation for accounts created by the former linked-user
// model. It never claims an ordinary human account.
export async function adoptLegacyAgentAccount(opts: {
  userId: string;
  subdomain: string;
  name: string;
  description?: string;
  permissionGroupIds: string[];
  isActive: boolean;
}): Promise<AgentAccount> {
  const { userId, subdomain, name, description, permissionGroupIds, isActive } =
    opts;
  const existing = await findCoreUser(subdomain, { _id: userId });
  const legacyMarked =
    existing?.appId?.startsWith(AGENT_APP_PREFIX) ||
    (existing?.role === 'system' && existing.email?.endsWith('@agents.local'));
  if (!existing?._id || !legacyMarked) {
    throw new Error(`Refusing to claim non-agent account ${userId}`);
  }

  await updateCoreUser(
    subdomain,
    { _id: userId },
    {
      $set: {
        role: 'user',
        isOwner: false,
        isActive,
        appId: agentAccountAppId(userId),
        permissionGroupIds: normalizePermissionGroupIds(permissionGroupIds),
        'details.fullName': name.trim(),
        'details.description': description?.trim() || '',
      },
    },
  );
  await clearGroupActionsCache({ subdomain, userId });
  return getAgentAccount({ userId, subdomain, requireActive: false });
}

/** Deactivate an obsolete service account after its profile ID becomes the
 * canonical AI team-member ID. Only accounts carrying an agent marker qualify. */
export async function retireLegacyAgentAccount(opts: {
  userId: string;
  subdomain: string;
}): Promise<void> {
  const { userId, subdomain } = opts;
  const existing = await findCoreUser(subdomain, { _id: userId });
  const legacyMarked =
    existing?.appId?.startsWith(AGENT_APP_PREFIX) ||
    (existing?.role === 'system' && existing.email?.endsWith('@agents.local'));
  if (!existing?._id) return;
  if (!legacyMarked) {
    throw new Error(`Refusing to retire non-agent account ${userId}`);
  }
  await updateCoreUser(
    subdomain,
    { _id: userId },
    { $set: { isActive: false } },
  );
  await clearGroupActionsCache({ subdomain, userId });
}
