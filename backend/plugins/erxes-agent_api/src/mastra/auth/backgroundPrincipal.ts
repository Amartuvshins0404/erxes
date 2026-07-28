// ---------------------------------------------------------------------------
// Background principal resolution — the single fail-closed entry point every
// unattended run (frontline bot or scheduled/automation-triggered workflow)
// MUST go through before touching the gateway.
//
// Background runs have no chatting user, so historically they fell back to the
// admin app token — a privileged, identity-less principal. Combined with the
// default tool policy (mode:'all'), that let a saved workflow — or any untrusted
// text it ingests (prompt injection) — drive any mutation on a cron, as admin.
//
// Since step 22 each agent is its own principal: this resolver ensures the
// agent's dedicated SERVICE USER exists, keeps its permission grant in sync, and
// mints a short-lived token bound to THAT service user (not the human owner, not
// the app token). It FAILS CLOSED when it cannot — it NEVER returns the app
// token; the caller must refuse the run on ok:false. Fail-closed here is the
// security boundary — do not soften it.
// ---------------------------------------------------------------------------

import { ExpectedError, sendTRPCMessage } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import type { WorkflowDefinition } from '../workflows/dsl';
import { mintRunToken } from './runToken';
import {
  ensureServiceUser,
  syncServiceUserGroup,
  type ServiceUserAgentConfig,
} from './servicePrincipal';

/** The exact user-facing sentence explaining the one required precondition. */
const CONFIGURE_APP_TOKEN =
  "Background runs execute as the agent's service user; configure the erxes app token in Agent settings.";

/**
 * The auth context a resolved background principal runs under. Shaped for
 * runWithAuth: the agent's service-user gateway token, the tenant, and the
 * `background` flag the destructive-op defense-in-depth reads. `token` is always
 * the minted service-user token — never the app token, never a human owner's.
 */
export interface BackgroundAuthCtx {
  token: string;
  subdomain: string;
  background: true;
  /** The owning agent's business agentId, so a background turn can self-own the
   *  workflows it builds (currentAgentId() resolves to it) — mirrors how chat
   *  turns stamp agentId in prepare.ts. */
  agentId?: string;
}

export type BackgroundPrincipalResult =
  | { ok: true; authCtx: BackgroundAuthCtx }
  | { ok: false; error: string };

/**
 * Background workflows and frontline bots resolve from an OWNING AGENT's
 * config via the workflow's required `agentId`. The resolver reads/persists the
 * service-user lifecycle fields, so it needs the full ServiceUserAgentConfig
 * slice.
 */
export type OwnerSource = ServiceUserAgentConfig | null | undefined;

/**
 * Resolve the agent's SERVICE-USER principal for a background run, or fail closed.
 *
 * On success returns ok:true with a service-user-token auth context. The steps:
 *   1. require the erxes app token (the only precondition — a human owner is no
 *      longer needed);
 *   2. ensure the agent's dedicated service user exists (create/reconcile +
 *      persist serviceUserId);
 *   3. sync its permission group to the agent's current grantGroupId, skipping
 *      the write when already in lock-step (a grant-less service user is allowed
 *      — the run proceeds and permission-gated ops are simply refused by the
 *      gateway until a grant is assigned; logged once per run);
 *   4. mint a short-lived token for the service user.
 *
 * Any step failing (core unreachable, app token missing/revoked, service user
 * deactivated) returns ok:false with an actionable error. The caller MUST NOT
 * proceed on ok:false: falling back to the app token would silently escalate the
 * run to admin, which is exactly the escalation this resolver exists to close.
 *
 * `appToken` is the erxes App token (from Agent settings' erxesApiToken). Here
 * it is ONLY the client credential presented to core's minting endpoint — never
 * the acting principal. The returned authCtx.token is always the minted
 * service-user token.
 */
export async function resolveBackgroundPrincipal(opts: {
  agentConfig: OwnerSource;
  subdomain: string;
  appToken: string | undefined;
  models: IModels;
}): Promise<BackgroundPrincipalResult> {
  const { agentConfig, subdomain, appToken, models } = opts;

  const token = appToken?.trim();
  if (!token) {
    return {
      ok: false,
      error: `Background run refused: ${CONFIGURE_APP_TOKEN}`,
    };
  }

  const agentId = agentConfig?.agentId?.trim();
  if (!agentConfig?._id || !agentId) {
    return {
      ok: false,
      error:
        'Background run refused: no owning agent to resolve a service-user ' +
        'principal from.',
    };
  }

  // (2) Ensure the agent's dedicated service user (create/reconcile + persist
  // serviceUserId). Fail closed if core is unreachable — never fall back to the
  // app token.
  let serviceUserId: string;
  let currentGroupIds: string[];
  try {
    const ensured = await ensureServiceUser({ agentConfig, subdomain, models });
    serviceUserId = ensured.serviceUserId;
    currentGroupIds = ensured.permissionGroupIds;
  } catch {
    return {
      ok: false,
      error:
        "Background run refused: could not provision the agent's service user " +
        '(core unreachable). Not falling back to the app token.',
    };
  }

  // (3) Keep the service user's permission group in lock-step with the agent's
  // current grantGroupId, so a grant change takes effect on the very next run.
  // Skip the write (and its cache bust) when the user is already in sync — the
  // agent update mutation syncs eagerly on change, so the steady state is a
  // no-op here.
  const desired = agentConfig.grantGroupId?.trim()
    ? [agentConfig.grantGroupId.trim()]
    : [];
  if (desired.length > 0) {
    const groups = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'permissionGroups',
      action: 'find',
      method: 'query',
      input: { query: { _id: desired[0] } },
      defaultValue: [],
    });
    if (
      !Array.isArray(groups) ||
      groups.length !== 1 ||
      groups[0]?.principalType !== 'agent'
    ) {
      return {
        ok: false,
        error:
          "Background run refused: the agent's permission profile is missing " +
          'or is not an agent profile.',
      };
    }
  }
  const inSync =
    desired.length === currentGroupIds.length &&
    desired.every((g, i) => g === currentGroupIds[i]);
  if (!inSync) {
    try {
      await syncServiceUserGroup({
        serviceUserId,
        groupId: desired[0] ?? null,
        subdomain,
      });
    } catch {
      return {
        ok: false,
        error:
          "Background run refused: could not sync the agent's permission grant " +
          '(core unreachable). Not falling back to the app token.',
      };
    }
  }

  // A grant-less service user is ALLOWED to run — permission-gated gateway ops
  // are simply refused until a grant group is assigned. Surface it once per run
  // so the misconfiguration is visible without blocking the run.
  if (desired.length === 0) {
    console.info(
      `[agent] background run for agent "${agentId}" is minting for a grant-less ` +
        `service user (${serviceUserId}); permission-gated operations will be ` +
        'refused by the gateway until a grant group is assigned in Agent settings.',
    );
  }

  // (4) Mint the run token for the SERVICE USER. Fail closed on any mint failure
  // (service user deactivated, app token revoked, core unreachable).
  const minted = await mintRunToken({
    userId: serviceUserId,
    subdomain,
    appToken: token,
  });
  if (!minted) {
    return {
      ok: false,
      error:
        "Background run refused: could not mint a run token for the agent's " +
        'service user (service user deactivated, app token revoked, or core ' +
        'unreachable). Not falling back to the app token.',
    };
  }

  return {
    ok: true,
    authCtx: {
      token: minted,
      subdomain,
      background: true,
      // Stamp the owning agent's identity so a background turn can self-own the
      // workflows it builds (workflowSave defaults ownership to it).
      agentId,
    },
  };
}

/**
 * Enable-time precondition for anything that starts unattended background runs
 * (an agent schedule, or a schedule-triggered workflow). Rejects enabling when
 * the secure path isn't configured, so the misconfiguration surfaces at setup
 * instead of silently failing closed at 3am — and refuses `destructiveOps:
 * 'allow'` outright, because unattended deletes/merges must never be a
 * one-checkbox decision. Since step 22 a human owner is NOT required: background
 * runs execute as the agent's service user, so the only precondition is the
 * erxes app token. Returns an error message, or null when the subject may be
 * enabled.
 */
export function backgroundRunEnableError(opts: {
  /** True when the config requests destructiveOps: 'allow'. */
  destructiveAllow: boolean;
  /** Human-readable subject used verbatim in the error message. */
  subject: string;
  /** The erxes App token from Agent settings (settings.erxesApiToken). */
  appToken: string | undefined;
}): string | null {
  const { destructiveAllow, subject, appToken } = opts;
  if (!appToken?.trim()) {
    return `Cannot enable this ${subject}: ${CONFIGURE_APP_TOKEN}`;
  }
  if (destructiveAllow) {
    return `Cannot enable this ${subject}: destructiveOps is "allow", which is refused for unattended background runs — deletes/merges must never run on a cron. Set destructiveOps to "ask".`;
  }
  return null;
}

/**
 * Schedule-triggered workflows run unattended. Enabling therefore requires an
 * enabled owning agent, the app token used to mint its service-user token, and
 * a non-destructive unattended policy. Other triggers are validated by their
 * own entry points and still fail closed in runBackgroundWorkflow.
 */
export const assertWorkflowSchedulable = async (opts: {
  models: IModels;
  agentId: string | undefined;
  definition: WorkflowDefinition;
}) => {
  if (opts.definition?.trigger?.type !== 'schedule') return;
  const agentId = opts.agentId?.trim();
  if (!agentId) {
    throw new ExpectedError(
      'Cannot enable this workflow: it has no owning agent — assign one before enabling.',
    );
  }
  // A disabled owning agent is the background-execution kill switch.
  const agent = await opts.models.MastraAgent.findOne({
    agentId,
    isEnabled: true,
  });
  if (!agent) {
    throw new ExpectedError(
      `Cannot enable this workflow: its owning agent "${agentId}" was not found or is disabled — enable it or reassign the workflow before enabling.`,
    );
  }
  const settings = await opts.models.MastraSettings.getSettings();
  const error = backgroundRunEnableError({
    destructiveAllow: agent.destructiveOps === 'allow',
    subject: 'workflow',
    appToken: settings?.erxesApiToken,
  });
  if (error) throw new ExpectedError(error);
};
