import { sendTRPCMessage } from 'erxes-api-shared/utils';
import type { IMastraAgent } from '@/agent/@types/agent';

// ---------------------------------------------------------------------------
// Background owner-token resolution (Phase 3 — "agent runs as a bound owner").
//
// Background runs (frontline bot, scheduled runs) have no chatting user, so
// they historically fell back to the admin app token — a privileged principal
// with no identity. This mints a short-lived token for the agent's OWNER
// (ownerUserId, defaulting to the creator) via core's `users.issueRunToken`
// mutation. That endpoint authenticates the CLIENT with the erxes App token
// (already stored in Agent settings as `erxesApiToken`), so no extra secret has
// to be provisioned. The agent then forwards the minted token as
// `Authorization: Bearer` (the Phase-1 path already does the forwarding) and
// the gateway resolves the request as that bounded user.
//
// The app token here is ONLY the client credential presented to the minting
// endpoint — never the acting principal. The minted owner token is the
// principal every background operation runs as.
//
// Falls back (caller-side) to the app token AS THE ACTING PRINCIPAL only when
// this returns undefined:
//   - the app token is not configured in Agent settings (secure path not yet
//     activated), or
//   - the agent has no owner, or
//   - the mint failed for any reason.
// ---------------------------------------------------------------------------

/**
 * The agent's resolved owner principal (explicit ownerUserId, else the
 * creator). Background runs mint a gateway token for this identity.
 */
export const resolveOwner = (
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
 * True when the secure owner-bound path is ACTIVE for this run: the erxes app
 * token is configured in Agent settings AND the agent has an owner. In that
 * state a missing owner token means the mint genuinely failed (owner
 * deactivated, app token revoked, core unreachable) and the caller MUST fail
 * closed — falling back to the privileged app token would silently escalate the
 * run instead of stopping it, defeating the "owner deactivated -> bot stops"
 * guarantee. When this is false the secure path isn't active yet (no app token
 * or no owner) and the caller may fall back to the app token (today's
 * degraded-but-working behavior).
 */
export function isSecureBackgroundRunRequired(
  agentConfig: Pick<IMastraAgent, 'ownerUserId' | 'createdBy'> | null | undefined,
  appToken: string | undefined,
): boolean {
  return Boolean(resolveOwner(agentConfig) && appToken?.trim());
}

/**
 * Mint a short-lived token for the agent's owner, or undefined when the owner
 * or the app token is missing / the mint fails. Never logs the token. The app
 * token is sent only as the client credential authenticating to core; the
 * returned owner token is the principal the caller runs as.
 */
export async function resolveBackgroundToken(
  agentConfig: Pick<IMastraAgent, 'ownerUserId' | 'createdBy'> | null | undefined,
  subdomain: string,
  appToken: string | undefined,
): Promise<string | undefined> {
  const owner = resolveOwner(agentConfig);
  const token = appToken?.trim();
  if (!owner || !token) return undefined;

  try {
    const res = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'users',
      action: 'issueRunToken',
      method: 'mutation',
      input: { userId: owner, appToken: token },
      defaultValue: null,
    });
    return res?.token || undefined;
  } catch {
    // Mint failed (core unreachable, revoked/invalid app token, deactivated
    // owner, …) — the caller falls back to the app token. Never surface the
    // token here.
    return undefined;
  }
}
