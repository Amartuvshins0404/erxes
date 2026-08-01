// ---------------------------------------------------------------------------
// Live evaluation + central observability — persisted per-tenant runtime
// configuration. The DSN is write-only in GraphQL and parsed here into the
// Langfuse connection.

import { createHash } from 'node:crypto';
import type { IMastraSettings } from '@/settings/@types/settings';

export interface LangfuseConfig {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
}

/** Evaluation is tenant-controlled and changes take effect without a restart. */
export function isEvaluationEnabled(
  settings?: Pick<IMastraSettings, 'evaluationEnabled'>,
): boolean {
  return settings?.evaluationEnabled === true;
}

/**
 * Parse a persisted Langfuse DSN
 * (`https://<publicKey>:<secretKey>@host[:port][/path]`) into the connection.
 */
export function langfuseConfig(
  settings?: Pick<IMastraSettings, 'evaluationDsn'>,
): LangfuseConfig | null {
  const dsn = settings?.evaluationDsn?.trim();
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const publicKey = decodeURIComponent(u.username);
    const secretKey = decodeURIComponent(u.password);
    if (!publicKey || !secretKey) return null;
    // Base URL = everything but the userinfo (supports path-prefixed installs).
    const path = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '');
    return { baseUrl: `${u.origin}${path}`, publicKey, secretKey };
  } catch {
    return null;
  }
}

/** True when evaluation is on and scores can be exported centrally. */
export function isExportConfigured(
  settings?: Pick<IMastraSettings, 'evaluationEnabled' | 'evaluationDsn'>,
): boolean {
  return isEvaluationEnabled(settings) && langfuseConfig(settings) !== null;
}

/** Secret-safe cache dimension for evaluation behavior and Langfuse routing. */
export function evaluationConfigFingerprint(
  settings?: Pick<IMastraSettings, 'evaluationEnabled' | 'evaluationDsn'>,
): string {
  if (!isEvaluationEnabled(settings)) return 'off';
  const config = langfuseConfig(settings);
  if (!config) return 'local';
  return createHash('sha256')
    .update(
      JSON.stringify([config.baseUrl, config.publicKey, config.secretKey]),
    )
    .digest('hex')
    .slice(0, 16);
}
