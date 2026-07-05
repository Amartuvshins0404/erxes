import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IMastraAgent } from '@/agent/@types/agent';
import { isAgentAdmin, getAgentQuotaStatus } from '@/agent/utils';
import { deactivateServiceUser } from '~/mastra/auth/servicePrincipal';
import { toUserFacingAgentError } from './agentErrors';

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
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsEdit');
    if (!user?._id) throw new ExpectedError('Login required');
    const admin = isAgentAdmin(user);
    // Same owner-assignment guard as create: reassigning the owner = acting as
    // that user when background runs mint its token, so only an org owner may
    // name someone other than themselves (the createdBy filter scopes non-owners
    // to their own agents, but the owner VALUE is otherwise unconstrained).
    assertOwnerAssignable(doc.ownerUserId, user._id, Boolean(user.isOwner));
    try {
      return await models.MastraAgent.updateAgent(_id, doc, admin ? undefined : user._id);
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
