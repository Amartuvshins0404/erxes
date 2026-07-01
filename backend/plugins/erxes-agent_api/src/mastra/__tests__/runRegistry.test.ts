import {
  registerActiveRun,
  cancelActiveRun,
} from '../runRegistry';

describe('runRegistry', () => {
  it('aborts a tracked run when cancelled', () => {
    const controller = new AbortController();
    registerActiveRun('acme', 'user-1', 'thread-1', controller);

    expect(controller.signal.aborted).toBe(false);
    expect(cancelActiveRun('acme', 'user-1', 'thread-1')).toBe(true);
    expect(controller.signal.aborted).toBe(true);
  });

  it('returns false when no run is tracked for the key', () => {
    const controller = new AbortController();
    registerActiveRun('acme', 'user-1', 'thread-a', controller);

    // Different thread — nothing to abort.
    expect(cancelActiveRun('acme', 'user-1', 'thread-b')).toBe(false);
    expect(controller.signal.aborted).toBe(false);
  });

  it('scopes runs per tenant + user + thread', () => {
    const a = new AbortController();
    const b = new AbortController();
    registerActiveRun('acme', 'user-1', 'thread-1', a);
    registerActiveRun('acme', 'user-2', 'thread-1', b);

    // Same thread id, different user — cancelling one leaves the other running.
    expect(cancelActiveRun('acme', 'user-1', 'thread-1')).toBe(true);
    expect(a.signal.aborted).toBe(true);
    expect(b.signal.aborted).toBe(false);
  });

  it('is idempotent — a second cancel finds nothing to abort', () => {
    const controller = new AbortController();
    registerActiveRun('acme', 'user-1', 'thread-1', controller);

    expect(cancelActiveRun('acme', 'user-1', 'thread-1')).toBe(true);
    expect(cancelActiveRun('acme', 'user-1', 'thread-1')).toBe(false);
  });

  it('unregister removes only the current controller, never a newer run', () => {
    const first = new AbortController();
    const unregisterFirst = registerActiveRun(
      'acme',
      'user-1',
      'thread-1',
      first,
    );

    // A newer run reclaims the slot before the first one tears down.
    const second = new AbortController();
    registerActiveRun('acme', 'user-1', 'thread-1', second);

    // First run's teardown must not clobber the second run's registration.
    unregisterFirst();
    expect(cancelActiveRun('acme', 'user-1', 'thread-1')).toBe(true);
    expect(second.signal.aborted).toBe(true);
  });
});
