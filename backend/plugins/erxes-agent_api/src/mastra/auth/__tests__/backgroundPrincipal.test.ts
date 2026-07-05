// The single fail-closed entry point for unattended background runs. It mints an
// owner-bound token and NEVER falls back to the app token — these tests pin that
// guarantee and the enable-time precondition that keeps misconfig out of cron.
const resolveBackgroundToken = jest.fn();
const isSecureBackgroundRunRequired = jest.fn();
jest.mock('../runToken', () => ({
  resolveBackgroundToken: (...args: unknown[]) => resolveBackgroundToken(...args),
  isSecureBackgroundRunRequired: (...args: unknown[]) =>
    isSecureBackgroundRunRequired(...args),
}));

import {
  resolveBackgroundPrincipal,
  backgroundRunEnableError,
} from '../backgroundPrincipal';

const APP_TOKEN = 'sk_app-token';

describe('resolveBackgroundPrincipal', () => {
  beforeEach(() => {
    resolveBackgroundToken.mockReset();
    isSecureBackgroundRunRequired.mockReset();
  });

  it('returns an owner-bound background auth ctx when the token mints', async () => {
    resolveBackgroundToken.mockResolvedValue('MINTED');

    const result = await resolveBackgroundPrincipal({
      agentConfig: { ownerUserId: 'owner-9', createdBy: 'creator-1' },
      subdomain: 'os',
      appToken: APP_TOKEN,
    });

    expect(result).toEqual({
      ok: true,
      authCtx: { token: 'MINTED', subdomain: 'os', background: true },
    });
    // The owner identity, not the app token, is what forwards to the gateway.
    // The app token is passed to the mint only as the client credential.
    expect(resolveBackgroundToken).toHaveBeenCalledWith(
      { ownerUserId: 'owner-9', createdBy: 'creator-1' },
      'os',
      APP_TOKEN,
    );
  });

  it('stamps the owning agentId on the background ctx so a background turn can self-own workflows', async () => {
    // The owning agent's identity must ride along so a scheduled/bot turn calling
    // workflowSave defaults ownership to it (currentAgentId() → agentId), instead
    // of refusing for want of a caller.
    resolveBackgroundToken.mockResolvedValue('MINTED');

    const result = await resolveBackgroundPrincipal({
      agentConfig: {
        agentId: 'agent-A',
        ownerUserId: 'owner-9',
        createdBy: 'creator-1',
      },
      subdomain: 'os',
      appToken: APP_TOKEN,
    });

    expect(result).toEqual({
      ok: true,
      authCtx: {
        token: 'MINTED',
        subdomain: 'os',
        background: true,
        agentId: 'agent-A',
      },
    });
  });

  it('fails closed with an actionable message when the secure path is not configured', async () => {
    resolveBackgroundToken.mockResolvedValue(undefined);
    isSecureBackgroundRunRequired.mockReturnValue(false);

    const result = await resolveBackgroundPrincipal({
      agentConfig: {},
      subdomain: 'os',
      appToken: undefined,
    });

    expect(result.ok).toBe(false);
    // No token / auth ctx is ever produced — the app-token fallback is gone.
    expect(result).not.toHaveProperty('authCtx');
    if (!result.ok) {
      expect(result.error).toMatch(/erxes app token/i);
      expect(result.error).toMatch(/Agent settings/i);
      expect(result.error).toMatch(/owner/i);
    }
  });

  it('fails closed (no fallback) when the mint fails despite the secure path being active', async () => {
    // App token set + owner present, but core returns no token (deactivated
    // owner, revoked app token, unreachable) — must refuse, not downgrade to the
    // app token.
    resolveBackgroundToken.mockResolvedValue(undefined);
    isSecureBackgroundRunRequired.mockReturnValue(true);

    const result = await resolveBackgroundPrincipal({
      agentConfig: { createdBy: 'creator-1' },
      subdomain: 'os',
      appToken: APP_TOKEN,
    });

    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('authCtx');
    if (!result.ok) {
      expect(result.error).toMatch(/mint failed/i);
      expect(result.error).toMatch(/not falling back to the app token/i);
    }
  });
});

describe('backgroundRunEnableError', () => {
  it('rejects when the erxes app token is unset', () => {
    const error = backgroundRunEnableError({
      owner: 'owner-1',
      destructiveAllow: false,
      subject: 'schedule',
      appToken: undefined,
    });
    expect(error).toMatch(/erxes app token/i);
    expect(error).toMatch(/Agent settings/i);
    expect(error).toMatch(/schedule/);
  });

  it('rejects when the background owner is unset', () => {
    const error = backgroundRunEnableError({
      owner: undefined,
      destructiveAllow: false,
      subject: 'workflow',
      appToken: APP_TOKEN,
    });
    expect(error).toMatch(/owner is unset/i);
    expect(error).toMatch(/workflow/);
  });

  it("rejects destructiveOps: 'allow' outright", () => {
    const error = backgroundRunEnableError({
      owner: 'owner-1',
      destructiveAllow: true,
      subject: 'schedule',
      appToken: APP_TOKEN,
    });
    expect(error).toMatch(/destructiveOps/);
  });

  it('allows enabling when app token + owner are present and destructive is gated', () => {
    const error = backgroundRunEnableError({
      owner: 'owner-1',
      destructiveAllow: false,
      subject: 'schedule',
      appToken: APP_TOKEN,
    });
    expect(error).toBeNull();
  });
});
