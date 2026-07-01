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

  it('matches exactly — does not block legitimate per-feature config ops', () => {
    for (const name of [
      'config', // singular product config detail
      'configsCheckActivateInstallation', // pings an endpoint, no secrets
      'pluginConfigs',
      'getConfig',
      'dealsAdd',
      'customers',
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
