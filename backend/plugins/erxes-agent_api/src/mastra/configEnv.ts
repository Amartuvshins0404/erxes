// ---------------------------------------------------------------------------
// Shared env-config helpers for the memory / learning / scoring subsystems.
// Pure and injectable: every helper takes an `env` map so the logic is
// unit-testable without touching the real environment. Nothing here performs
// I/O.
// ---------------------------------------------------------------------------

export type Env = Record<string, string | undefined>;

/** Read one env var as trimmed text (absent → empty string). */
export function val(env: Env, key: string): string {
  return (env[key] ?? '').trim();
}

/** Parse a positive integer from env text, falling back to the default. */
export function parsePositiveInt(raw: string, def: number): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

/** Parse a 0..1 score from env text, falling back to the default. */
export function parseScore(raw: string, def: number): number {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : def;
}

/** A master switch that is on ONLY when `key` is exactly "enable" (trimmed). */
export function enabledBy(env: Env, key: string): boolean {
  return val(env, key) === 'enable';
}

/**
 * Canonical tenant tag. In saas mode the request subdomain IS the org
 * subdomain; in non-saas there is exactly one tenant pinned to 'os'.
 */
export function canonicalTenant(
  env: Env,
  requestSubdomain: string | undefined,
): string | undefined {
  if (val(env, 'VERSION') === 'saas') return requestSubdomain || undefined;
  return 'os';
}
