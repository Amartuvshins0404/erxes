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
    });

    expect(result).toEqual({
      ok: true,
      authCtx: { token: 'MINTED', subdomain: 'os', background: true },
    });
    // The owner identity, not the app token, is what forwards to the gateway.
    expect(resolveBackgroundToken).toHaveBeenCalledWith(
      { ownerUserId: 'owner-9', createdBy: 'creator-1' },
      'os',
    );
  });

  it('fails closed with an actionable message when the secure path is not configured', async () => {
    resolveBackgroundToken.mockResolvedValue(undefined);
    isSecureBackgroundRunRequired.mockReturnValue(false);

    const result = await resolveBackgroundPrincipal({
      agentConfig: {},
      subdomain: 'os',
    });

    expect(result.ok).toBe(false);
    // No token / auth ctx is ever produced — the app-token fallback is gone.
    expect(result).not.toHaveProperty('authCtx');
    if (!result.ok) {
      expect(result.error).toMatch(/ERXES_AGENT_RUN_TOKEN_SECRET/);
      expect(result.error).toMatch(/owner/i);
    }
  });

  it('fails closed (no fallback) when the mint fails despite the secure path being active', async () => {
    // Secret set + owner present, but core returns no token (deactivated owner,
    // secret skew, unreachable) — must refuse, not downgrade to the app token.
    resolveBackgroundToken.mockResolvedValue(undefined);
    isSecureBackgroundRunRequired.mockReturnValue(true);

    const result = await resolveBackgroundPrincipal({
      agentConfig: { createdBy: 'creator-1' },
      subdomain: 'os',
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
  const SECRET = 'shared-run-secret';
  afterEach(() => {
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
  });

  it('rejects when the run-token secret is unset', () => {
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
    const error = backgroundRunEnableError({
      owner: 'owner-1',
      destructiveAllow: false,
      subject: 'schedule',
    });
    expect(error).toMatch(/ERXES_AGENT_RUN_TOKEN_SECRET/);
    expect(error).toMatch(/schedule/);
  });

  it('rejects when the background owner is unset', () => {
    process.env.ERXES_AGENT_RUN_TOKEN_SECRET = SECRET;
    const error = backgroundRunEnableError({
      owner: undefined,
      destructiveAllow: false,
      subject: 'workflow',
    });
    expect(error).toMatch(/owner is unset/i);
    expect(error).toMatch(/workflow/);
  });

  it("rejects destructiveOps: 'allow' outright", () => {
    process.env.ERXES_AGENT_RUN_TOKEN_SECRET = SECRET;
    const error = backgroundRunEnableError({
      owner: 'owner-1',
      destructiveAllow: true,
      subject: 'schedule',
    });
    expect(error).toMatch(/destructiveOps/);
  });

  it('allows enabling when secret + owner are present and destructive is gated', () => {
    process.env.ERXES_AGENT_RUN_TOKEN_SECRET = SECRET;
    const error = backgroundRunEnableError({
      owner: 'owner-1',
      destructiveAllow: false,
      subject: 'schedule',
    });
    expect(error).toBeNull();
  });
});
