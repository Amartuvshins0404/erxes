import { ExpectedError, sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IMastraAgent } from '@/agent/@types/agent';
import { isAgentAdmin, getAgentQuotaStatus } from '@/agent/utils';
import {
  deactivateServiceUser,
  syncServiceUserGroup,
} from '~/mastra/auth/servicePrincipal';
import { toUserFacingAgentError } from './agentErrors';

/**
 * Validate that a requested grant group exists before it is bound to the agent.
 * The group is the agent's server-side permission grant: a background run mints
 * a service-user token carrying this group's actions, so a dangling id would
 * silently leave the agent with no grant. Read-only core trpc
 * (`permissionGroups.find`) — group CREATION/EDIT stays in core's Settings →
 * Permissions UI (gated by permissionsManage); here we only reference an
 * existing one. Throws ExpectedError when it does not exist.
 */
const assertGrantGroupExists = async (subdomain: string, groupId: string) => {
  const groups = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'permissionGroups',
    action: 'find',
    method: 'query',
    input: { query: { _id: groupId } },
    defaultValue: [],
  });
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new ExpectedError(
      `Permission group "${groupId}" was not found — pick an existing group from Settings → Permissions.`,
    );
  }
};

/**
 * Authorize a requested `ownerUserId` value. The owner is the identity
 * background runs mint a real gateway token for, so naming someone else as
 * owner is equivalent to acting as that user. Because an `isOwner` target
 * short-circuits every permission check, the bar is true ORGANIZATION
 * OWNERSHIP — not the agent-admin group, which would otherwise be a path to
 * isOwner. So only an org owner (already top privilege, can't be escalated by
 * assignment) may name an owner other than themselves; everyone else may omit
 * it (createdBy default) or name only their own _id. No-op when not supplied.
 */
const assertOwnerAssignable = (
  ownerUserId: string | undefined,
  callerId: string,
  callerIsOwner: boolean,
) => {
  if (!ownerUserId || callerIsOwner || ownerUserId === callerId) return;
  throw new ExpectedError(
    'Only an organization owner may assign another user as the agent owner',
  );
};

export const agentMutations = {
  mastraAgentCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraAgent },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsCreate');
    if (!user?._id) throw new ExpectedError('Login required');

    const admin = isAgentAdmin(user);

    if (!admin && doc.visibility && doc.visibility !== 'private') {
      throw new ExpectedError('Users may only create private agents');
    }

    // The owner is the principal background runs (bot/schedule) mint a gateway
    // token for (Phase 3). Assigning it to another user = acting as that user,
    // and an isOwner target bypasses every permission check, so only an org
    // owner may name an owner other than themselves; otherwise an agent-admin
    // (or any user) could bind the agent to an org owner and escalate to
    // isOwner. Everyone else gets the createdBy default below.
    assertOwnerAssignable(doc.ownerUserId, user._id, Boolean(user.isOwner));

    if (!admin) {
      const status = await getAgentQuotaStatus(models, user._id);
      if (status.atQuota) {
        throw new ExpectedError(`Agent quota reached (${status.quota})`);
      }
    }

    try {
      return await models.MastraAgent.createAgent({ ...doc, createdBy: user._id });
    } catch (error) {
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: Partial<IMastraAgent> },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsEdit');
    if (!user?._id) throw new ExpectedError('Login required');
    const admin = isAgentAdmin(user);
    // Same owner-assignment guard as create: reassigning the owner = acting as
    // that user when background runs mint its token, so only an org owner may
    // name someone other than themselves (the createdBy filter scopes non-owners
    // to their own agents, but the owner VALUE is otherwise unconstrained).
    assertOwnerAssignable(doc.ownerUserId, user._id, Boolean(user.isOwner));

    // Grant-group change: the group carries the agent's server-side permissions,
    // synced onto its service user. Validate a set group exists BEFORE persisting
    // (an empty/blank value clears the grant → empty permissions). Step 23 builds
    // the selection UI; wiring it through the update mutation makes grants usable
    // today via core's existing Settings → Permissions groups.
    const grantChanged = doc.grantGroupId !== undefined;
    // A cleared grant persists as null (NOT undefined) so `$set` actually clears
    // the stored field — mongoose strips undefined from $set, which would leave a
    // stale grantGroupId the mint path would then re-sync back onto the user.
    const grantGroupId: string | null = doc.grantGroupId?.trim() || null;
    if (grantChanged && grantGroupId) {
      await assertGrantGroupExists(subdomain, grantGroupId);
    }

    try {
      const updated = await models.MastraAgent.updateAgent(
        _id,
        grantChanged
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ({ ...doc, grantGroupId } as any)
          : doc,
        admin ? undefined : user._id,
      );

      // Push the new grant onto the service user immediately (if one is already
      // provisioned) + bust its action cache, so the change takes effect on the
      // next background run without waiting for the mint-time reconcile. The
      // agent config already persisted the id via updateAgent, so pass no models
      // here to avoid a redundant second write. Best-effort: never fail the
      // update if core is unreachable — the mint path re-syncs from grantGroupId.
      if (grantChanged && updated.serviceUserId) {
        try {
          await syncServiceUserGroup({
            serviceUserId: updated.serviceUserId,
            groupId: grantGroupId,
            subdomain,
          });
        } catch (error) {
          console.error(`Failed to sync grant group for agent ${_id}:`, error);
        }
      }

      return updated;
    } catch (error) {
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsRemove');
    if (!user?._id) throw new ExpectedError('Login required');
    const admin = isAgentAdmin(user);
    const ownerScope = admin ? {} : { createdBy: user._id };

    // Deactivate the agent's service user before removal (best-effort). This
    // stops new run-token mints; any already-issued token expires within its
    // ≤1h TTL. Never fail the delete if core is unreachable — the removal is
    // the user's intent and the service user can be reaped in bulk later
    // (role:'system' selector). Scoped to the caller's own agent for non-admins.
    const agent = await models.MastraAgent.findOne({ _id, ...ownerScope });
    if (agent?.serviceUserId) {
      try {
        await deactivateServiceUser({
          serviceUserId: agent.serviceUserId,
          subdomain,
        });
      } catch (error) {
        console.error(
          `Failed to deactivate service user for agent ${_id}:`,
          error,
        );
      }
    }

    return models.MastraAgent.removeAgent(_id, admin ? undefined : user._id);
  },
};
