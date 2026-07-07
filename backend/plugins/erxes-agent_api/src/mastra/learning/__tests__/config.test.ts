import {
  isLearningEnabled,
  resolveLearningTuning,
  learningTenant,
  hashSource,
} from '../config';

describe('isLearningEnabled', () => {
  it('is on ONLY for the exact value "enable"', () => {
    expect(isLearningEnabled({ ERXES_AGENT_LEARNING: 'enable' })).toBe(true);
    expect(isLearningEnabled({ ERXES_AGENT_LEARNING: ' enable ' })).toBe(true);
    expect(isLearningEnabled({ ERXES_AGENT_LEARNING: 'true' })).toBe(false);
    expect(isLearningEnabled({ ERXES_AGENT_LEARNING: 'ENABLE' })).toBe(false);
    expect(isLearningEnabled({})).toBe(false);
  });
});

describe('resolveLearningTuning', () => {
  it('has safe defaults', () => {
    const tuning = resolveLearningTuning({});
    expect(tuning.autoPromoteMinSources).toBe(3);
    expect(tuning.autoPromoteMinConfidence).toBe(0.75);
    expect(tuning.idleMinutes).toBe(30);
    expect(tuning.feedbackDownDelta).toBeLessThan(0);
  });

  it('reads overrides and ignores invalid values', () => {
    const tuning = resolveLearningTuning({
      ERXES_AGENT_LEARNING_K: '5',
      ERXES_AGENT_LEARNING_MIN_CONF: '0.9',
      ERXES_AGENT_LEARNING_IDLE_MINUTES: '-3',
    });
    expect(tuning.autoPromoteMinSources).toBe(5);
    expect(tuning.autoPromoteMinConfidence).toBe(0.9);
    expect(tuning.idleMinutes).toBe(30);
  });
});

describe('learningTenant', () => {
  it("pins 'os' for non-saas regardless of request subdomain", () => {
    expect(learningTenant('localhost', {})).toBe('os');
    expect(learningTenant(undefined, {})).toBe('os');
  });

  it('uses the org subdomain in saas mode (fail-closed without one)', () => {
    expect(learningTenant('acme', { VERSION: 'saas' })).toBe('acme');
    expect(learningTenant(undefined, { VERSION: 'saas' })).toBeUndefined();
  });
});

describe('hashSource', () => {
  it('is deterministic and not reversible to the input', () => {
    const digest = hashSource('user-123', {});
    expect(hashSource('user-123', {})).toBe(digest);
    expect(digest).not.toContain('user-123');
    expect(digest).toHaveLength(32);
  });

  it('distinguishes users and secrets', () => {
    expect(hashSource('user-123', {})).not.toBe(hashSource('user-456', {}));
    expect(hashSource('user-123', {})).not.toBe(
      hashSource('user-123', { ERXES_AGENT_LEARNING_HASH_SECRET: 'other' }),
    );
  });
});
