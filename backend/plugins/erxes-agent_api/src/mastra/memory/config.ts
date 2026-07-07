// ---------------------------------------------------------------------------
// Advanced Memory — configuration (pure, env-driven).
//
// Every function here takes an injectable `env` map (defaulting to process.env)
// so the logic is unit-testable without touching the real environment. Nothing
// in this file performs I/O — it only reads/normalizes configuration.
// ---------------------------------------------------------------------------

import { Env, val, parsePositiveInt } from '~/mastra/configEnv';

export type { Env };

// Re-exported so surviving importers keep a stable path even though the parse
// helpers now live in configEnv.
export { val, parsePositiveInt };

/**
 * The master switch. Advanced memory is ON by default — chat persistence and the
 * session sidebar ride on it, so it must not depend on an env opt-in. Set
 * ERXES_AGENT_MEMORY to exactly "disable" (whitespace-trimmed) to turn it off;
 * every other value (including absent) leaves it enabled.
 */
export function isAdvancedMemoryEnabled(env: Env = process.env): boolean {
  return val(env, 'ERXES_AGENT_MEMORY') !== 'disable';
}
