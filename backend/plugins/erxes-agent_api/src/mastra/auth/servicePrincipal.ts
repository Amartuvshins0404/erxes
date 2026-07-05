import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { clearGroupActionsCache } from 'erxes-api-shared/core-modules';
import type { IModels } from '~/connectionResolvers';
import type { IMastraAgentDocument } from '@/agent/@types/agent';

// ---------------------------------------------------------------------------
// Agent service-user lifecycle (step 21 — "agent as principal").
//
// Each AI agent gets a dedicated core "service user": a passwordless,
// non-owner, `role:'system'` user that can NEVER log in interactively
// (login paths require a non-empty password) but CAN receive short-lived run
// tokens for background runs (wired in step 22). `role:'system'` hides the
// user from team-member lists / seat counts.
//
// This module is the LIFECYCLE ONLY — create / reconcile / assign group /
// deactivate. It does not change how any run mints tokens and it builds no
// grant-selection UI. It is dormant until callers arrive (step 22+); the only
// live wiring today is best-effort deactivation on agent delete.
//
// All core mutations go through the unauthenticated inter-service trpc router
// `core/users/*`. NOTE: `sendTRPCMessage` SWALLOWS errors and returns
// `defaultValue` (it never throws) — so a create that hits the duplicate-email
// guard and a create that fails because core is unreachable are BOTH observed
// here as a null result. We disambiguate by re-reading the user by email.
// ---------------------------------------------------------------------------

/** Minimal shape of an agent config this module reads / persists onto. */
export type ServiceUserAgentConfig = Pick<
  IMastraAgentDocument,
  '_id' | 'agentId' | 'name' | 'serviceUserId' | 'grantGroupId'
>;

/** Subset of a core user document this module inspects. */
interface CoreUser {
  _id: string;
  role?: string;
  isActive?: boolean;
  email?: string;
}

const CORE_USERS = { pluginName: 'core', module: 'users' } as const;

/**
 * Deterministic, email-valid local part / username for an agent. Core's user
 * schema enforces an RFC-5322 regex on `email`, so we down-map any character
 * that is not safe in a local part to `-`. `agentId` is unique, so the result
 * is stable and (barring a pathological collision on stripped punctuation)
 * unique per agent. `.local` is accepted by core's domain regex.
 */
const sanitizeToken = (agentId: string): string =>
  agentId.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') ||
  'agent';

const syntheticEmail = (agentId: string): string =>
  `agent-${sanitizeToken(agentId)}@agents.local`;

const syntheticUsername = (agentId: string): string =>
  `agent-${sanitizeToken(agentId)}`;

// --- thin trpc wrappers (same call shape as runToken.ts / storage.ts) --------

/** `users.findOne` — returns the matching core user, or null. */
const findCoreUser = (
  subdomain: string,
  query: Record<string, unknown>,
): Promise<CoreUser | null> =>
  sendTRPCMessage({
    subdomain,
    ...CORE_USERS,
    action: 'findOne',
    method: 'query',
    input: { query },
    defaultValue: null,
  });

/**
 * `users.create` — returns the created user, or null when the call errored
 * (duplicate email/username OR core unreachable — indistinguishable here).
 * `createUser` IGNORES `role`/`permissionGroupIds`, so `role:'system'` is set
 * by a follow-up `users.updateOne`.
 */
const createCoreUser = (
  subdomain: string,
  data: Record<string, unknown>,
): Promise<CoreUser | null> =>
  sendTRPCMessage({
    subdomain,
    ...CORE_USERS,
    action: 'create',
    method: 'mutation',
    input: { data },
    defaultValue: null,
  });

/** `users.updateOne` — `{selector, modifier}` passthrough. */
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

/** Force `role:'system'` when it has drifted (create ignores role). */
const ensureSystemRole = async (
  subdomain: string,
  user: CoreUser,
): Promise<void> => {
  if (user.role !== 'system') {
    await updateCoreUser(subdomain, { _id: user._id }, { $set: { role: 'system' } });
  }
};

/** Reactivate a user that was previously deactivated (it was ours). */
const ensureActive = async (
  subdomain: string,
  user: CoreUser,
): Promise<void> => {
  if (user.isActive === false) {
    await updateCoreUser(subdomain, { _id: user._id }, { $set: { isActive: true } });
  }
};

/** Persist the resolved serviceUserId onto the agent config document. */
const persistServiceUserId = async (
  models: IModels,
  agentConfig: ServiceUserAgentConfig,
  serviceUserId: string,
): Promise<void> => {
  if (agentConfig.serviceUserId === serviceUserId) return;
  await models.MastraAgent.updateOne(
    { _id: agentConfig._id },
    { $set: { serviceUserId } },
  );
  // Reflect the new id on the in-memory config so the caller sees it.
  agentConfig.serviceUserId = serviceUserId;
};

/**
 * Idempotently ensure the agent has a dedicated core service user, returning
 * its id. Safe to call repeatedly and concurrently across replicas.
 *
 *  a. If a serviceUserId is already stored, verify the user still exists; if
 *     so, reactivate it (if it had been deactivated) / repair its role and
 *     return it. If it was deleted out-of-band, fall through and re-create.
 *  b. Otherwise create a passwordless, non-owner, active user with a synthetic
 *     unique email, then set `role:'system'`.
 *  c. Duplicate-email race (two replicas ensure at once): the create returns
 *     null, so re-read the user by email and adopt it.
 *  d. Persist the resolved id on the agent config document.
 */
export async function ensureServiceUser(opts: {
  agentConfig: ServiceUserAgentConfig;
  subdomain: string;
  models: IModels;
}): Promise<{ serviceUserId: string }> {
  const { agentConfig, subdomain, models } = opts;

  // (a) Reconcile an already-provisioned user.
  if (agentConfig.serviceUserId) {
    const existing = await findCoreUser(subdomain, {
      _id: agentConfig.serviceUserId,
    });
    if (existing?._id) {
      await ensureActive(subdomain, existing);
      await ensureSystemRole(subdomain, existing);
      return { serviceUserId: existing._id };
    }
    // Deleted out-of-band → fall through to re-create and re-point the config.
  }

  const email = syntheticEmail(agentConfig.agentId);
  const username = syntheticUsername(agentConfig.agentId);
  const fullName = `${agentConfig.name} (agent)`;

  // (b) Create.
  let user = await createCoreUser(subdomain, {
    notUsePassword: true,
    isActive: true,
    isOwner: false,
    email,
    username,
    details: { fullName },
  });

  // (c) Create failed → either a duplicate-email race (adopt the existing
  // user) or core is unreachable (nothing to adopt → fail closed).
  if (!user?._id) {
    const adopted = await findCoreUser(subdomain, { email });
    if (!adopted?._id) {
      throw new Error(
        `Failed to ensure service user for agent ${agentConfig.agentId}`,
      );
    }
    user = adopted;
  }

  await ensureSystemRole(subdomain, user);
  await ensureActive(subdomain, user);

  // (d) Persist.
  await persistServiceUserId(models, agentConfig, user._id);
  return { serviceUserId: user._id };
}

/**
 * Assign (or clear) the agent's permission group on its service user, then
 * invalidate the user's cached action map so the change takes effect on the
 * next gateway call. Permission-group ASSIGNMENT is plugin-only; group
 * CREATION is out of scope. Optionally persists `grantGroupId` on the agent
 * config (pass `models` + `agentConfig`).
 */
export async function syncServiceUserGroup(opts: {
  serviceUserId: string;
  groupId: string | null;
  subdomain: string;
  models?: IModels;
  agentConfig?: ServiceUserAgentConfig;
}): Promise<void> {
  const { serviceUserId, groupId, subdomain, models, agentConfig } = opts;

  await updateCoreUser(
    subdomain,
    { _id: serviceUserId },
    { $set: { permissionGroupIds: groupId ? [groupId] : [] } },
  );

  // Invalidate `user_actions_<serviceUserId>` so the new grant is picked up.
  await clearGroupActionsCache({ userId: serviceUserId });

  if (models && agentConfig) {
    await models.MastraAgent.updateOne(
      { _id: agentConfig._id },
      { $set: { grantGroupId: groupId || undefined } },
    );
    agentConfig.grantGroupId = groupId || undefined;
  }
}

/**
 * Deactivate the agent's service user (on agent delete). This stops new
 * run-token mints; any already-issued token expires within its ≤1h TTL.
 *
 * We use `users.updateOne` with an explicit `$set:{isActive:false}` — NOT
 * `users.setActiveStatus`, which TOGGLES the flag and would silently
 * re-activate an already-inactive user.
 */
export async function deactivateServiceUser(opts: {
  serviceUserId: string;
  subdomain: string;
}): Promise<void> {
  const { serviceUserId, subdomain } = opts;
  await updateCoreUser(
    subdomain,
    { _id: serviceUserId },
    { $set: { isActive: false } },
  );
}
