// ---------------------------------------------------------------------------
// Background principal resolution — the single fail-closed entry point every
// unattended run (scheduled agent, frontline bot, scheduled/automation-triggered
// workflow) MUST go through before touching the gateway.
//
// Background runs have no chatting user, so historically they fell back to the
// admin app token — a privileged, identity-less principal. Combined with the
// default tool policy (mode:'all'), that let a saved schedule/workflow — or any
// untrusted text it ingests (prompt injection) — drive any mutation in any
// plugin on a cron, as admin. This resolver removes that fallback: it mints a
// short-lived token bound to the agent's/workflow's OWNER and FAILS CLOSED when
// it cannot. It NEVER returns the app token; the caller must refuse the run on
// ok:false. Fail-closed here is the security boundary — do not soften it.
// ---------------------------------------------------------------------------

import { ExpectedError } from 'erxes-api-shared/utils';
import type { IMastraAgent } from '@/agent/@types/agent';
import type { WorkflowDefinition } from '../workflows/dsl';
import {
  resolveBackgroundToken,
  isSecureBackgroundRunRequired,
} from './runToken';

/**
 * The auth context a resolved background principal runs under. Shaped for
 * runWithAuth: an owner-bound gateway token, the tenant, and the `background`
 * flag the destructive-op defense-in-depth reads. `token` is always the minted
 * owner token — never the app token.
 */
export interface BackgroundAuthCtx {
  token: string;
  subdomain: string;
  background: true;
}

export type BackgroundPrincipalResult =
  | { ok: true; authCtx: BackgroundAuthCtx }
  | { ok: false; error: string };

/**
 * The owner source: any object exposing the same ownerUserId/createdBy fields an
 * agent config does. Agent-backed runs pass the agent config; workflow runs pass
 * a `{ createdBy: workflow.createdByUserId }` shim — a workflow has no single
 * owning agent (it may bind zero or many), so its creator is the bound owner.
 */
export type OwnerSource =
  | Pick<IMastraAgent, 'ownerUserId' | 'createdBy'>
  | null
  | undefined;

/**
 * Resolve the owner-bound principal for a background run, or fail closed.
 *
 * Returns ok:true with an owner-token auth context when the secure path is
 * active (ERXES_AGENT_RUN_TOKEN_SECRET set + owner present) AND the mint
 * succeeds. Otherwise returns ok:false with an actionable error — for a missing
 * precondition (no secret / no owner) vs a genuine mint failure (owner
 * deactivated, secret skew, core unreachable). The caller MUST NOT proceed on
 * ok:false: falling back to the app token would silently escalate the run to
 * admin, which is exactly the escalation this resolver exists to close.
 */
export async function resolveBackgroundPrincipal(opts: {
  agentConfig: OwnerSource;
  subdomain: string;
}): Promise<BackgroundPrincipalResult> {
  const { agentConfig, subdomain } = opts;

  const token = await resolveBackgroundToken(agentConfig, subdomain);
  if (token) {
    return { ok: true, authCtx: { token, subdomain, background: true } };
  }

  const error = isSecureBackgroundRunRequired(agentConfig)
    ? 'Background run refused: owner token mint failed (owner deactivated, ' +
      'secret skew, or core unreachable). Not falling back to the app token.'
    : 'Background runs require a secure owner token. Set ' +
      'ERXES_AGENT_RUN_TOKEN_SECRET and assign an agent owner.';
  return { ok: false, error };
}

/**
 * Enable-time precondition for anything that starts unattended background runs
 * (an agent schedule, or a schedule-triggered workflow). Rejects enabling when
 * the secure owner-token path isn't fully configured, so the misconfiguration
 * surfaces at setup instead of silently failing closed at 3am — and refuses
 * `destructiveOps: 'allow'` outright, because unattended deletes/merges must
 * never be a one-checkbox decision. Returns an error message, or null when the
 * subject may be enabled.
 */
export function backgroundRunEnableError(opts: {
  /** The resolved background owner id (already trimmed), or undefined/empty. */
  owner: string | undefined;
  /** True when the config requests destructiveOps: 'allow'. */
  destructiveAllow: boolean;
  /** 'schedule' | 'workflow' — used verbatim in the error message. */
  subject: string;
}): string | null {
  const { owner, destructiveAllow, subject } = opts;
  if (!process.env.ERXES_AGENT_RUN_TOKEN_SECRET) {
    return `Cannot enable this ${subject}: background runs require ERXES_AGENT_RUN_TOKEN_SECRET to be configured on the agent service.`;
  }
  if (!owner) {
    return `Cannot enable this ${subject}: its background owner is unset. Assign an owner (the agent's ownerUserId, or the workflow's creator) before enabling.`;
  }
  if (destructiveAllow) {
    return `Cannot enable this ${subject}: destructiveOps is "allow", which is refused for unattended background runs — deletes/merges must never run on a cron. Set destructiveOps to "ask".`;
  }
  return null;
}

/**
 * A schedule-triggered workflow runs unattended on a cron, so — like an agent
 * schedule — it may only be ENABLED when the secure owner-token path is
 * configured (secret + a workflow creator to bind as owner) and it does not run
 * destructive ops without asking. Only 'schedule' triggers are gated here; other
 * triggers (manual/automation/webhook) either run as a user or fail closed at
 * runtime via runBackgroundWorkflow. Throws ExpectedError on refusal so both the
 * GraphQL mutations and the agent-facing builder tools share one enable-time
 * check (the tools convert the throw into their structured failure result).
 */
export const assertWorkflowSchedulable = (opts: {
  owner: string | undefined;
  definition: WorkflowDefinition;
}) => {
  if (opts.definition?.trigger?.type !== 'schedule') return;
  const error = backgroundRunEnableError({
    owner: opts.owner?.trim() || undefined,
    destructiveAllow: opts.definition.destructiveOps === 'allow',
    subject: 'workflow',
  });
  if (error) throw new ExpectedError(error);
};
