import { getRuntimeReadyUpdate } from './runtimeReady';

describe('getRuntimeReadyUpdate', () => {
  const base = {
    isApproved: true,
    healthGated: true,
    runtimeHealthy: null as boolean | null,
    probeFailed: false,
  };

  it('fails OPEN when the health probe errors (backend without the resolver)', () => {
    // The 2026-08-25 incident: branch UI on prod, backend missing
    // agentRuntimeHealth — the query errors and healthy never arrives.
    expect(
      getRuntimeReadyUpdate({ ...base, runtimeHealthy: null, probeFailed: true }),
    ).toBe(true);
  });

  it('keeps waiting (no verdict) while the first probe is in flight', () => {
    expect(getRuntimeReadyUpdate({ ...base })).toBeUndefined();
  });

  it('shows the runtime when the probe reports healthy', () => {
    expect(getRuntimeReadyUpdate({ ...base, runtimeHealthy: true })).toBe(true);
  });

  it('holds the overlay when the probe positively reports unhealthy', () => {
    expect(getRuntimeReadyUpdate({ ...base, runtimeHealthy: false })).toBe(
      false,
    );
    // Even if a stale error flag lingers, an explicit "down" wins.
    expect(
      getRuntimeReadyUpdate({ ...base, runtimeHealthy: false, probeFailed: true }),
    ).toBe(false);
  });

  it('shows legacy (ungated) agents without probing', () => {
    expect(getRuntimeReadyUpdate({ ...base, healthGated: false })).toBe(true);
  });

  it('never shows the runtime for unapproved servers', () => {
    expect(
      getRuntimeReadyUpdate({
        ...base,
        isApproved: false,
        runtimeHealthy: true,
      }),
    ).toBe(false);
  });
});
