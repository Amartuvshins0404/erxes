import {
  isSecurityBlockedOperation,
  securityBlockedResult,
} from '../securityGuard';

describe('isSecurityBlockedOperation', () => {
  it('blocks the config reads that expose the secret store', () => {
    for (const name of [
      'configs',
      'configsByCode',
      'configsGetValue',
      'configsGetEnv',
    ]) {
      expect(isSecurityBlockedOperation(name)).toBe(true);
    }
  });

  // CI-runnable regression guard for the full Phase-1 denylist: this is a pure
  // function, so unlike the registry-strip assertions (which need a live gateway)
  // it runs in CI and FAILS if any sensitive op is dropped from the block list.
  it('blocks the full sensitive-operation denylist (every Phase-1 category)', () => {
    for (const name of [
      // auth/session + password — account takeover / impersonation
      'login',
      'logout',
      'usersConfirmInvitation',
      'usersResendInvitation',
      'forgotPassword',
      'resetPassword',
      'usersResetMemberPassword',
      'usersChangePassword',
      // clientPortal auth — customer-account takeover
      'clientPortalUserLoginWithCredentials',
      'clientPortalUserResetPassword',
      'clientPortalUserRefreshToken',
      'clientPortalUserRegister',
      // permission escalation + recon
      'permissionGroupAdd',
      'permissionGroupEdit',
      'userAddCustomPermission',
      'usersUpdatePermissionGroups',
      'permissionGroups',
      'permissionModules',
      // credential surface — apps + oauth
      'apps',
      'appDetail',
      'appsAdd',
      'oauthClientApps',
      'oauthClientAppsAdd',
      // config-store clones (parity with configs*)
      'accountingsConfigsByCode',
      'mnConfigs',
      'callsGetConfigs',
      'facebookGetConfigs',
      'instagramGetConfigs',
    ]) {
      expect(isSecurityBlockedOperation(name)).toBe(true);
    }
  });

  it('matches exactly — does not block legitimate or arg-scoped ops', () => {
    for (const name of [
      'config', // singular product config detail
      'configsCheckActivateInstallation', // pings an endpoint, no secrets
      'pluginConfigs',
      'getConfig',
      'dealsAdd',
      'customers',
      // Arg-scoped (kept usable, dangerous fields stripped) — NOT blocked.
      'usersEdit',
      'usersInvite',
      // The caller's OWN effective permissions — allowed.
      'currentUserPermissions',
    ]) {
      expect(isSecurityBlockedOperation(name)).toBe(false);
    }
  });
});

describe('securityBlockedResult', () => {
  it('reports the block and its reason without leaking anything', () => {
    const result = securityBlockedResult();
    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.error).toMatch(/security reasons/i);
    // The refusal must not echo the operation name, data, or denylist details.
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('configs');
    expect(serialized).not.toContain('models');
    expect(serialized).not.toContain('secret store');
    // It instructs the model not to retry or to disclose config.
    expect(result.instruction).toMatch(/do not retry/i);
    expect(result.instruction).toMatch(/security reasons/i);
  });
});
