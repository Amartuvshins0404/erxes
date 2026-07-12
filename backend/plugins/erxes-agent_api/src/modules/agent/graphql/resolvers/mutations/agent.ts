import { ExpectedError, sendTRPCMessage } from 'erxes-api-shared/utils';
import { canGroup } from 'erxes-api-shared/core-modules';
import type { IUserDocument } from 'erxes-api-shared/core-types';
import { IContext } from '~/connectionResolvers';
import { IMastraAgent } from '@/agent/@types/agent';
import { isAgentAdmin, getAgentQuotaStatus } from '@/agent/utils';
import {
  deactivateServiceUser,
  syncServiceUserGroup,
} from '~/mastra/auth/servicePrincipal';
import type { GroupPermission } from '~/mastra/tools/actionsToAllowedTools';
import { deriveGrantAllowedTools } from './grantTools';
import { toUserFacingAgentError } from './agentErrors';

/** A permission group as returned by core `permissionGroups.find`. */
interface CoreGroup {
  _id: string;
  name?: string;
  permissions?: GroupPermission[];
}

/**
 * Fetch a requested grant group (core `permissionGroups.find`), asserting it
 * exists before it is bound to the agent. The group is the agent's server-side
 * permission grant: a background run mints a service-user token carrying this
 * group's actions, so a dangling id would silently leave the agent with no
 * grant. Read-only core trpc — group CREATION/EDIT stays in core (gated by
 * permissionsManage). Returns the group so the caller can DERIVE the tool
 * filter from its permissions without a second round-trip. Throws ExpectedError
 * when it does not exist.
 */
const fetchGrantGroup = async (
  subdomain: string,
  groupId: string,
): Promise<CoreGroup> => {
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
  return groups[0] as CoreGroup;
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

/**
 * Authorize BINDING/CHANGING an agent's `grantGroupId` to a non-empty value.
 * The grant group carries the agent's server-side permissions: a background run
 * mints a service-user token whose actions ARE this group's. Binding the agent
 * to a group whose actions exceed the caller's own is a privilege escalation — a
 * prompt-injectable background run could then drive ops the caller can't perform
 * (e.g. a group carrying core `permissionsManage`), which is exactly the risk
 * `ownerUserId` guards against above.
 *
 * The bar is: the caller must hold `permissionsManage` OR be an org owner
 * (`canGroup` short-circuits true for `isOwner`). This mirrors (a) who can
 * AUTHOR the group in core — `permissionGroupAdd`/`Edit` are permissionsManage-
 * gated — and (b) the UI's own `permissionsManage || isOwner` Access gate, so it
 * closes the escalation regardless of which group id is pointed at. `isAgentAdmin`
 * is deliberately NOT enough: an agent-admin is not necessarily a permission
 * manager and could otherwise gain cross-plugin actions by binding a privileged
 * group. Clearing a grant (null) is de-escalation — allowed for anyone who can
 * edit and never reaches here.
 *
 * This REPLACES the earlier org-owner-only gate and its spoofable, name-based
 * `agent-grant:<agentId>` "self-owned" exemption. That exemption trusted a
 * caller-settable, reusable `agentId` and ungated core group enumeration, so an
 * attacker with only `agentsCreate`/`agentsEdit` could rename their agent onto
 * an orphaned privileged group's name and bind it — see PR #273 Finding #1.
 */
const assertGrantAssignable = async (
  subdomain: string,
  user: IUserDocument,
): Promise<void> => {
  if (await canGroup(subdomain, 'permissionsManage', user)) return;
  throw new ExpectedError(
    'Binding an agent permission grant requires the Manage Permissions permission.',
  );
};

export const agentMutations = {
  mastraAgentCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraAgent },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsCreate');
    if (!user?._id) throw new ExpectedError('Login required');

    const admin = isAgentAdmin(user);

    if (!admin && doc.visibility && doc.visibility !== 'private') {
      throw new ExpectedError('Users may only create private agents');
    }

    // The owner is the principal unattended workflow/bot runs mint a gateway
    // token for. Assigning it to another user means acting as that user,
    // and an isOwner target bypasses every permission check, so only an org
    // owner may name an owner other than themselves; otherwise an agent-admin
    // (or any user) could bind the agent to an org owner and escalate to
    // isOwner. Everyone else gets the createdBy default below.
    assertOwnerAssignable(doc.ownerUserId, user._id, Boolean(user.isOwner));

    // Same escalation surface as update: seeding grantGroupId at create time
    // would bind a privileged group onto the new agent's service user, so the
    // grant gate applies here too. The UI never sets grantGroupId on create
    // (it's an update-only Access surface), so this only bites raw-API callers —
    // exactly the attacker path. Clearing/omitting it is a no-op.
    if (doc.grantGroupId?.trim()) {
      await assertGrantAssignable(subdomain, user);
    }

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
    // (an empty/blank value clears the grant → empty permissions). Step 23's
    // Access surface drives this: one action-picker writes the group AND, here,
    // DERIVES the tool filter from it so the two never drift.
    const grantChanged = doc.grantGroupId !== undefined;
    // A cleared grant persists as null (NOT undefined) so `$set` actually clears
    // the stored field — mongoose strips undefined from $set, which would leave a
    // stale grantGroupId the mint path would then re-sync back onto the user.
    const grantGroupId: string | null = doc.grantGroupId?.trim() || null;

    // Fetch the current config once when we need it to compare against: to
    // enforce agentId immutability and/or to tell whether the grant is actually
    // CHANGING (re-persisting the same grant is not an escalation).
    const needsConfig = doc.agentId !== undefined || (grantChanged && !!grantGroupId);
    const agentConfig = needsConfig
      ? await models.MastraAgent.findOne({ _id })
      : null;

    // agentId is the stable workflow/learning ownership key; mutating it would
    // strand resources and permit identity spoofing.
    if (
      doc.agentId !== undefined &&
      agentConfig &&
      doc.agentId !== agentConfig.agentId
    ) {
      throw new ExpectedError(
        "An agent's agentId is immutable once created and cannot be changed.",
      );
    }

    // The tool-registry filter (toolPolicy/allowedTools) is DERIVED from the
    // grant and persisted ATOMICALLY with it (same updateAgent write) so grant
    // and filter can't diverge. Empty until we know a grant changed.
    let toolFields: Partial<IMastraAgent> = {};

    if (grantChanged && grantGroupId) {
      // Binding/changing the grant to a NEW non-empty group is a privilege
      // escalation surface, so require permissionsManage (or org ownership) —
      // authorize BEFORE any core round-trip so an unauthorized caller can't even
      // probe group existence. Skipped when the same grant is re-persisted (no
      // change → nothing to escalate).
      if (grantGroupId !== (agentConfig?.grantGroupId ?? null)) {
        await assertGrantAssignable(subdomain, user);
      }

      // Resolve the group (existence + permissions), then derive the tool filter.
      const group = await fetchGrantGroup(subdomain, grantGroupId);
      const allowedTools = await deriveGrantAllowedTools(
        models,
        group.permissions || [],
      );
      toolFields = { toolPolicy: 'custom', allowedTools };
    } else if (grantChanged) {
      // Clearing a grant is de-escalation: drop the derived custom filter back to
      // the 'all' default rather than leaving a stale, now-unbounded allowlist.
      toolFields = { toolPolicy: 'all', allowedTools: [] };
    }

    try {
      const updated = await models.MastraAgent.updateAgent(
        _id,
        grantChanged
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ({ ...doc, grantGroupId, ...toolFields } as any)
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
