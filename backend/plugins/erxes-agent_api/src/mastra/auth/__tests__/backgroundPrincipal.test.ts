// The single fail-closed entry point for unattended background runs. Since step
// 22 it resolves the agent's SERVICE USER (ensure + grant-sync) and mints a token
// bound to THAT user — never the human owner, never the app token. These tests
// pin the fail-closed guarantee, the grant-sync skip/log behavior, and the
// enable-time precondition (app token only — no human owner required).
const mintRunToken = jest.fn();
const ensureServiceUser = jest.fn();
const syncServiceUserGroup = jest.fn();
jest.mock('../runToken', () => ({
  mintRunToken: (...args: unknown[]) => mintRunToken(...args),
}));
jest.mock('../servicePrincipal', () => ({
  ensureServiceUser: (...args: unknown[]) => ensureServiceUser(...args),
  syncServiceUserGroup: (...args: unknown[]) => syncServiceUserGroup(...args),
}));

import {
  resolveBackgroundPrincipal,
  backgroundRunEnableError,
} from '../backgroundPrincipal';

const APP_TOKEN = 'sk_app-token';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODELS = {} as any;

const agent = (overrides: Record<string, unknown> = {}) => ({
  _id: 'agent-doc-1',
  agentId: 'agent-A',
  name: 'Sales Bot',
  ...overrides,
});

describe('resolveBackgroundPrincipal (service-user swap)', () => {
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    mintRunToken.mockReset();
    ensureServiceUser.mockReset();
    syncServiceUserGroup.mockReset();
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => infoSpy.mockRestore());

  it('mints for the SERVICE USER (not the human owner) and stamps the agentId', async () => {
    // Service user already in lock-step with the grant → no redundant sync write.
    ensureServiceUser.mockResolvedValue({
      serviceUserId: 'svc-1',
      permissionGroupIds: ['grp-9'],
    });
    mintRunToken.mockResolvedValue('MINTED');

    const result = await resolveBackgroundPrincipal({
      agentConfig: agent({ grantGroupId: 'grp-9', ownerUserId: 'owner-9' }),
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
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
    // Minted for the SERVICE USER id — the human owner is never the principal.
    expect(mintRunToken).toHaveBeenCalledWith({
      userId: 'svc-1',
      subdomain: 'os',
      appToken: APP_TOKEN,
    });
    // Already in sync → the group write (and its cache bust) is skipped.
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
  });

  it('syncs the grant with the agent CURRENT grantGroupId when the service user is out of sync', async () => {
    ensureServiceUser.mockResolvedValue({
      serviceUserId: 'svc-1',
      permissionGroupIds: ['grp-OLD'],
    });
    mintRunToken.mockResolvedValue('MINTED');

    const result = await resolveBackgroundPrincipal({
      agentConfig: agent({ grantGroupId: 'grp-NEW' }),
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
    });

    expect(result.ok).toBe(true);
    expect(syncServiceUserGroup).toHaveBeenCalledWith({
      serviceUserId: 'svc-1',
      groupId: 'grp-NEW',
      subdomain: 'os',
    });
  });

  it('proceeds for a GRANT-LESS service user, logging once, without a group write', async () => {
    ensureServiceUser.mockResolvedValue({
      serviceUserId: 'svc-1',
      permissionGroupIds: [],
    });
    mintRunToken.mockResolvedValue('MINTED');

    const result = await resolveBackgroundPrincipal({
      agentConfig: agent({ grantGroupId: undefined }),
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
    });

    expect(result.ok).toBe(true);
    // Grant-less is ALLOWED: no group to sync (empty == empty), but a single
    // log line surfaces the misconfiguration.
    expect(syncServiceUserGroup).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0][0]).toMatch(/grant-less service user/i);
  });

  it('fails closed (app-token text) when the erxes app token is unset', async () => {
    const result = await resolveBackgroundPrincipal({
      agentConfig: agent(),
      subdomain: 'os',
      appToken: undefined,
      models: MODELS,
    });

    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('authCtx');
    if (!result.ok) {
      expect(result.error).toMatch(/service user/i);
      expect(result.error).toMatch(/erxes app token/i);
      expect(result.error).toMatch(/Agent settings/i);
    }
    // Never even reached the service-user lifecycle.
    expect(ensureServiceUser).not.toHaveBeenCalled();
  });

  it('fails closed when there is no owning agent to resolve a principal from', async () => {
    const result = await resolveBackgroundPrincipal({
      agentConfig: null,
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/no owning agent/i);
    expect(ensureServiceUser).not.toHaveBeenCalled();
  });

  it('fails closed (no fallback) when the service user cannot be provisioned', async () => {
    ensureServiceUser.mockRejectedValue(new Error('core unreachable'));

    const result = await resolveBackgroundPrincipal({
      agentConfig: agent(),
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
    });

    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('authCtx');
    if (!result.ok) {
      expect(result.error).toMatch(/could not provision/i);
      expect(result.error).toMatch(/not falling back to the app token/i);
    }
    expect(mintRunToken).not.toHaveBeenCalled();
  });

  it('fails closed when the grant sync fails', async () => {
    ensureServiceUser.mockResolvedValue({
      serviceUserId: 'svc-1',
      permissionGroupIds: [],
    });
    syncServiceUserGroup.mockRejectedValue(new Error('core unreachable'));

    const result = await resolveBackgroundPrincipal({
      agentConfig: agent({ grantGroupId: 'grp-NEW' }),
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/could not sync/i);
    expect(mintRunToken).not.toHaveBeenCalled();
  });

  it('fails closed (no fallback) when minting for a DEACTIVATED service user returns no token', async () => {
    ensureServiceUser.mockResolvedValue({
      serviceUserId: 'svc-1',
      permissionGroupIds: ['grp-9'],
    });
    mintRunToken.mockResolvedValue(undefined); // core refuses inactive user

    const result = await resolveBackgroundPrincipal({
      agentConfig: agent({ grantGroupId: 'grp-9' }),
      subdomain: 'os',
      appToken: APP_TOKEN,
      models: MODELS,
    });

    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('authCtx');
    if (!result.ok) {
      expect(result.error).toMatch(/could not mint/i);
      expect(result.error).toMatch(/service user deactivated/i);
      expect(result.error).toMatch(/not falling back to the app token/i);
    }
  });
});

describe('backgroundRunEnableError', () => {
  it('rejects when the erxes app token is unset (service-user text, no owner mention)', () => {
    const error = backgroundRunEnableError({
      destructiveAllow: false,
      subject: 'workflow',
      appToken: undefined,
    });
    expect(error).toMatch(/service user/i);
    expect(error).toMatch(/erxes app token/i);
    expect(error).toMatch(/Agent settings/i);
    expect(error).toMatch(/workflow/);
  });

  it("rejects destructiveOps: 'allow' outright", () => {
    const error = backgroundRunEnableError({
      destructiveAllow: true,
      subject: 'workflow',
      appToken: APP_TOKEN,
    });
    expect(error).toMatch(/destructiveOps/);
  });

  it('allows enabling with ONLY the app token present — no human owner required', () => {
    const error = backgroundRunEnableError({
      destructiveAllow: false,
      subject: 'workflow',
      appToken: APP_TOKEN,
    });
    expect(error).toBeNull();
  });
});
