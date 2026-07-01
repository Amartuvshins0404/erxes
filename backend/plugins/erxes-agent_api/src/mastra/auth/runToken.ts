import { sendTRPCMessage } from 'erxes-api-shared/utils';
import type { IMastraAgent } from '@/agent/@types/agent';

// ---------------------------------------------------------------------------
// Background owner-token resolution (Phase 3 — "agent runs as a bound owner").
//
// Background runs (frontline bot, scheduled runs) have no chatting user, so
// they historically fell back to the admin app token — a privileged principal
// with no identity. This mints a short-lived token for the agent's OWNER
// (ownerUserId, defaulting to the creator) via core's secret-gated
// `users.issueRunToken` mutation. The agent then forwards it as
// `Authorization: Bearer` (the Phase-1 path already does the forwarding) and
// the gateway resolves the request as that bounded user.
//
// Falls back (caller-side) to the app token when this returns undefined:
//   - ERXES_AGENT_RUN_TOKEN_SECRET is unset (secure path not yet activated), or
//   - the agent has no owner, or
//   - the mint failed for any reason.
// ---------------------------------------------------------------------------

/**
 * The agent's resolved owner principal (explicit ownerUserId, else the
 * creator). Background runs mint a gateway token for this identity.
 */
const resolveOwner = (
  agentConfig: Pick<IMastraAgent, 'ownerUserId' | 'createdBy'> | null | undefined,
): string | undefined => {
  // Normalize empty/whitespace to "not supplied" so a stored ownerUserId: "" (or
  // a blank createdBy) collapses to the next fallback — matching the
  // `!ownerUserId` semantics of assertOwnerAssignable. Without this the `??`/`!`
  // asymmetry lets "" pass the owner-assignment guard yet be returned as the
  // owner; being falsy it then defeats isSecureBackgroundRunRequired and silently
  // downgrades the run to the privileged app token instead of the bounded creator.
  const explicit = agentConfig?.ownerUserId?.trim();
  if (explicit) return explicit;
  const creator = agentConfig?.createdBy?.trim();
  return creator || undefined;
};

/**
 * True when the secure owner-bound path is ACTIVE for this run: the shared
 * secret is configured AND the agent has an owner. In that state a missing
 * owner token means the mint genuinely failed (owner deactivated, secret skew,
 * core unreachable) and the caller MUST fail closed — falling back to the
 * privileged app token would silently escalate the run instead of stopping it,
 * defeating the "owner deactivated -> bot stops" guarantee. When this is false
 * the secure path isn't active yet (secret unset or no owner) and the caller
 * may fall back to the app token (today's degraded-but-working behavior).
 */
export function isSecureBackgroundRunRequired(
  agentConfig: Pick<IMastraAgent, 'ownerUserId' | 'createdBy'> | null | undefined,
): boolean {
  return Boolean(resolveOwner(agentConfig) && process.env.ERXES_AGENT_RUN_TOKEN_SECRET);
}

/**
 * Mint a short-lived token for the agent's owner, or undefined when the owner
 * or the shared secret is missing / the mint fails. Never logs the token.
 */
export async function resolveBackgroundToken(
  agentConfig: Pick<IMastraAgent, 'ownerUserId' | 'createdBy'> | null | undefined,
  subdomain: string,
): Promise<string | undefined> {
  const owner = resolveOwner(agentConfig);
  const secret = process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
  if (!owner || !secret) return undefined;

  try {
    const res = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'users',
      action: 'issueRunToken',
      method: 'mutation',
      input: { userId: owner, secret },
      defaultValue: null,
    });
    return res?.token || undefined;
  } catch {
    // Mint failed (core unreachable, wrong secret, deactivated owner, …) —
    // the caller falls back to the app token. Never surface the token here.
    return undefined;
  }
}
