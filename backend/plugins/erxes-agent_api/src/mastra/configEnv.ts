// Shared environment helpers. Each helper takes an environment map and
// performs no I/O.

export type Env = Record<string, string | undefined>;

/** Read one env var as trimmed text (absent → empty string). */
export function val(env: Env, key: string): string {
  return (env[key] ?? '').trim();
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
