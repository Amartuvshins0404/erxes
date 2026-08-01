// ---------------------------------------------------------------------------
// Agent Learning — persisted runtime tuning plus deployment-only identity,
// scheduling, and hashing configuration.

import { createHmac } from 'crypto';
import { Env, val, canonicalTenant } from '~/mastra/configEnv';
import type { IMastraSettings } from '@/settings/@types/settings';

export type { Env };

export interface LearningTuning {
  // Auto-promotion floors: a candidate becomes approved only when BOTH hold.
  // minSources is the k-anonymity floor — a lesson must be independently
  // derived from at least k distinct people before it can auto-promote.
  autoPromoteMinSources: number;
  autoPromoteMinConfidence: number;
  // Prompt digest budget (characters) and entry cap.
  digestMaxChars: number;
  digestMaxEntries: number;
  // A thread is distilled once idle this long with undistilled messages.
  idleMinutes: number;
  // Hygiene: confidence decay after this many days without reinforcement,
  // and the floor below which an unpinned learning is archived.
  decayDays: number;
  decayFactor: number;
  archiveBelowConfidence: number;
  // Feedback reinforcement deltas (down votes weigh more than up votes).
  feedbackUpDelta: number;
  feedbackDownDelta: number;
}

/** Learning is tenant-controlled and changes take effect without a restart. */
export function isLearningEnabled(
  settings?: Pick<IMastraSettings, 'learningEnabled'>,
): boolean {
  return settings?.learningEnabled === true;
}

const positiveInteger = (value: number | undefined, fallback: number): number =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;

const score = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : fallback;

/** All learning knobs with safe defaults; malformed persisted values fall back. */
export function resolveLearningTuning(
  settings?: Pick<
    IMastraSettings,
    | 'learningAutoPromoteMinSources'
    | 'learningAutoPromoteMinConfidence'
    | 'learningDigestMaxChars'
    | 'learningDigestMaxEntries'
    | 'learningIdleMinutes'
    | 'learningDecayDays'
    | 'learningDecayFactor'
    | 'learningArchiveBelowConfidence'
  >,
): LearningTuning {
  return {
    autoPromoteMinSources: positiveInteger(
      settings?.learningAutoPromoteMinSources,
      3,
    ),
    autoPromoteMinConfidence: score(
      settings?.learningAutoPromoteMinConfidence,
      0.75,
    ),
    digestMaxChars: positiveInteger(settings?.learningDigestMaxChars, 2400),
    digestMaxEntries: positiveInteger(settings?.learningDigestMaxEntries, 12),
    idleMinutes: positiveInteger(settings?.learningIdleMinutes, 30),
    decayDays: positiveInteger(settings?.learningDecayDays, 30),
    decayFactor: score(settings?.learningDecayFactor, 0.9),
    archiveBelowConfidence: score(
      settings?.learningArchiveBelowConfidence,
      0.2,
    ),
    feedbackUpDelta: 0.05,
    feedbackDownDelta: -0.1,
  };
}

/** Cron pattern for the distillation + hygiene sweep (BullMQ job scheduler). */
export function learningSweepCron(env: Env = process.env): string {
  return val(env, 'ERXES_AGENT_LEARNING_SWEEP_CRON') || '*/10 * * * *';
}

/**
 * Canonical tenant tag for learning scoping — saas → org subdomain, non-saas →
 * fixed 'os'.
 */
export function learningTenant(
  requestSubdomain: string | undefined,
  env: Env = process.env,
): string | undefined {
  return canonicalTenant(env, requestSubdomain);
}

/**
 * Pseudonymize a contributor's resourceId for sourceHashes. HMAC so the
 * stored value can count distinct people and propagate erasure, but can't be
 * reversed to an identity. The secret is deployment-local; the default keeps
 * the feature usable out of the box (pseudonymization, not secrecy, is the
 * goal — raw ids never leave the personal tier either way).
 */
export function hashSource(resourceId: string, env: Env = process.env): string {
  const secret =
    val(env, 'ERXES_AGENT_LEARNING_HASH_SECRET') || 'erxes-agent-learning';
  return createHmac('sha256', secret)
    .update(resourceId)
    .digest('hex')
    .slice(0, 32);
}
