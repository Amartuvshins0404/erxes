import { sendTRPCMessage } from 'erxes-api-shared/utils';

// ---------------------------------------------------------------------------
// Run-token minting for an AI team-member account.
//
// The app token is only the client credential presented to core's
// `users.issueRunToken`. The returned short-lived token identifies the
// passwordless, non-owner AI team member and is the sole acting principal.
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
