// ---------------------------------------------------------------------------
// Secret redaction for operation results
//
// The agent can run ANY discovered GraphQL read, including `configs` (and every
// plugin's own config query), which return raw credential VALUES — object
// storage keys, SES/Cloudflare secrets, ERP API tokens, integration passwords.
// Returning those verbatim leaks them into the model context and onward to the
// LLM provider, the conversation transcript, working memory, and semantic
// recall — a serious exposure even when the calling user is an admin who may
// read configs in the erxes UI.
//
// This module redacts secret-bearing values from EVERY operation result before
// it reaches the model. It is applied at the single execution chokepoint
// (executeErxesOperation), so both the chat meta-tool and the workflow runtime
// are covered, and it is value/field-shaped rather than operation-name-based —
// a config query added by any future plugin is redacted automatically, with no
// allowlist to maintain. It mirrors the provider module's stance (utils/mask.ts:
// the real apiKey never crosses the GraphQL boundary), extended to arbitrary
// operation results.
// ---------------------------------------------------------------------------

// Shown in place of a redacted value. Descriptive so the model explains it
// correctly to the user ("this value is hidden for security") instead of
// trying to recover or reconstruct the real secret.
export const REDACTED = '[redacted — secret value hidden for security]';

// A field/config name denotes a secret when, with separators removed, it
// contains one of these fragments. Tuned against the real erxes config codes
// (AWS_/SES_/CLOUDFLARE_ credentials, ERKHET ApiKey/ApiSecret/ApiToken,
// MSDynamic password) while leaving benign neighbours untouched — …_ACCOUNT_ID,
// …_BUCKET_NAME, …_REGION, …_URL, …_ENDPOINT, username, hostname all pass
// through, so the model can still answer "what storage/region is configured?".
const SECRET_NAME_RE =
  /(password|passwd|passphrase|pwd|secret|token|apikey|accesskey|privatekey|secretkey|signingkey|encryptionkey|clientsecret|credential)/;

/** Normalise a key for matching: lowercase, strip non-alphanumerics. */
const normalize = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** True when a field/config name denotes a secret value. */
export function isSecretName(name: string): boolean {
  return SECRET_NAME_RE.test(normalize(name));
}

// erxes stores settings as { code, value } (and some modules as { key, value })
// rows. The value-holding key is the generic "value", so the secret signal
// lives in the SIBLING code/key — that shape is handled explicitly so a row
// like { code: "AWS_SECRET_ACCESS_KEY", value: "…" } has its `value` hidden
// while the `code` stays visible (the model can still report WHICH secret is
// set, never its content).
const CODE_SIBLING_KEYS = ['code', 'key'] as const;

// An empty value carries no secret and signals "not configured" — keep it so
// the model can truthfully say a credential is unset rather than implying one
// exists behind the placeholder.
const isEmpty = (value: unknown): boolean => value == null || value === '';

// Defensive bound on recursion depth. GraphQL results are finite trees (no
// cycles), but nested config blobs can be deep; this just caps pathological
// inputs without affecting any real response shape.
const MAX_DEPTH = 16;

function redactValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    // { code|key, value } row whose code/key denotes a secret → hide `value`.
    const codeKey =
      'value' in obj
        ? CODE_SIBLING_KEYS.find((k) => typeof obj[k] === 'string')
        : undefined;
    const codeIsSecret =
      codeKey !== undefined && isSecretName(obj[codeKey] as string);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'value' && codeIsSecret) {
        out[k] = isEmpty(v) ? v : REDACTED;
      } else if (isSecretName(k)) {
        // A property whose own NAME is secret (apiKey, password, accessToken,
        // clientSecret, …) — redact regardless of nesting depth.
        out[k] = isEmpty(v) ? v : REDACTED;
      } else {
        out[k] = redactValue(v, depth + 1);
      }
    }
    return out;
  }

  return value;
}

/**
 * Redact secret-bearing values anywhere in an operation result. Returns a new
 * structure (the input is not mutated); plain strings/numbers and non-secret
 * fields pass through unchanged. Safe to apply to any result shape — arrays,
 * nested objects, or primitives.
 */
export function redactSecrets<T>(result: T): T {
  return redactValue(result, 0) as T;
}
