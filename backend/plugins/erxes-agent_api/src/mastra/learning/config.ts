// ---------------------------------------------------------------------------
// Agent Learning — configuration (pure, env-driven).
//
// Injectable `env` map, no I/O. Learning is Mongo-backed (the MastraLearning
// collection is the source of truth); it has its own master switch and tuning
// knobs. No vector store is involved.
// ---------------------------------------------------------------------------

import { createHmac } from 'crypto';
import {
  Env,
  val,
  parsePositiveInt,
  parseScore,
  enabledBy,
  canonicalTenant,
} from '~/mastra/configEnv';

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

/**
 * The master switch. Learning is enabled ONLY when ERXES_AGENT_LEARNING is
 * exactly "enable"; it remains an instance-level background-worker control.
 */
export function isLearningEnabled(env: Env = process.env): boolean {
  return enabledBy(env, 'ERXES_AGENT_LEARNING');
}

/** All learning knobs with safe defaults; invalid env values are ignored. */
export function resolveLearningTuning(env: Env = process.env): LearningTuning {
  return {
    autoPromoteMinSources: parsePositiveInt(
      val(env, 'ERXES_AGENT_LEARNING_K'),
      3,
    ),
    autoPromoteMinConfidence: parseScore(
      val(env, 'ERXES_AGENT_LEARNING_MIN_CONF'),
      0.75,
    ),
    digestMaxChars: parsePositiveInt(
      val(env, 'ERXES_AGENT_LEARNING_DIGEST_CHARS'),
      2400,
    ),
    digestMaxEntries: parsePositiveInt(
      val(env, 'ERXES_AGENT_LEARNING_DIGEST_ENTRIES'),
      12,
    ),
    idleMinutes: parsePositiveInt(
      val(env, 'ERXES_AGENT_LEARNING_IDLE_MINUTES'),
      30,
    ),
    decayDays: parsePositiveInt(
      val(env, 'ERXES_AGENT_LEARNING_DECAY_DAYS'),
      30,
    ),
    decayFactor: parseScore(val(env, 'ERXES_AGENT_LEARNING_DECAY_FACTOR'), 0.9),
    archiveBelowConfidence: parseScore(
      val(env, 'ERXES_AGENT_LEARNING_ARCHIVE_BELOW'),
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
