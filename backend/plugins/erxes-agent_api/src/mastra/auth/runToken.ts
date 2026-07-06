import { sendTRPCMessage } from 'erxes-api-shared/utils';

// ---------------------------------------------------------------------------
// Run-token minting (agent-principal identity swap — step 22).
//
// Background runs (frontline bot, scheduled agent runs, scheduled/automation
// workflows) have no chatting user. They mint a short-lived gateway token for
// the AGENT'S SERVICE USER — a passwordless, non-owner, role:'system' core user
// (see servicePrincipal.ts) — via core's `users.issueRunToken` mutation. That
// endpoint authenticates the CLIENT with the erxes App token (already stored in
// Agent settings as `erxesApiToken`), so no extra secret is provisioned. The
// agent forwards the minted token as `Authorization: Bearer`; the gateway then
// resolves the request as that bounded service user.
//
// The app token here is ONLY the client credential presented to the minting
// endpoint — never the acting principal. The minted service-user token is the
// principal every background operation runs as.
//
// Prior to step 22 background runs minted for the AGENT'S HUMAN OWNER
// (resolveOwner / resolveBackgroundToken / isSecureBackgroundRunRequired). That
// path is retired: the human owner is no longer the background identity — each
// agent runs as its own service user, resolved in resolveBackgroundPrincipal.
// ---------------------------------------------------------------------------

/**
 * Mint a short-lived gateway token for `userId` via core's `users.issueRunToken`,
 * or `undefined` when the userId or app token is missing / the mint fails (core
 * unreachable, revoked/invalid app token, deactivated or isOwner user). Never
 * logs the token. The app token is sent only as the client credential
 * authenticating to core; the returned token is the principal the caller runs as.
 */
export async function mintRunToken(opts: {
  userId: string;
  subdomain: string;
  appToken: string | undefined;
}): Promise<string | undefined> {
  const uid = opts.userId?.trim();
  const token = opts.appToken?.trim();
  if (!uid || !token) return undefined;

  try {
    const res = await sendTRPCMessage({
      subdomain: opts.subdomain,
      pluginName: 'core',
      module: 'users',
      action: 'issueRunToken',
      method: 'mutation',
      input: { userId: uid, appToken: token },
      defaultValue: null,
    });
    return res?.token || undefined;
  } catch {
    // Mint failed (core unreachable, revoked/invalid app token, deactivated
    // service user, …). Never surface the token here — the caller fails closed.
    return undefined;
  }
}
