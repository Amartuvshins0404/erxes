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
// (executeErxesOperation), so every agent tool path is covered, and it is
// value/field-shaped rather than operation-name-based —
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
// `connectionstring` covers AZURE_STORAGE_CONNECTION_STRING / dbConnectionString.
// Fragments here are long enough to be collision-free as substrings; SHORT
// fragments (`pass`, `dsn`) are matched as whole tokens by hasShortSecretToken
// below, NOT here, to avoid substring false positives (compass, …fieldsnavigation).
const SECRET_NAME_RE =
  /(password|passwd|passphrase|pwd|secret|token|apikey|accesskey|privatekey|secretkey|signingkey|encryptionkey|clientsecret|credential|connectionstring)/;

// Names that END WITH "key" but are PUBLIC by design (Stripe publishableKey,
// client-portal / socialpay publicKey, reCAPTCHA siteKey, web-push
// applicationServerKey). Exempted from the endsWith("key") rule — but ONLY after
// SECRET_NAME_RE has had first refusal, so PUBLIC_API_KEY-style names (which
// carry "apikey") still redact.
const PUBLIC_KEY_NAMES = [
  'publickey',
  'publishablekey',
  'sitekey',
  'applicationserverkey',
] as const;

/** Normalise a key for matching: lowercase, strip non-alphanumerics. */
const normalize = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

// Split a name into lowercased word tokens (camelCase boundaries + separators).
const tokenize = (name: string): string[] =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

// Short secret fragments matched as WHOLE TOKENS (never substrings of the
// separator-stripped name), so benign words don't collide:
//   • "pass" only as a TRAILING token → MAIL_PASS / SMTP_PASS / dbPass are
//     passwords, while a LEADING "pass" is pass/fail semantics (passRate,
//     passCount) and stays visible; compass/passenger/bypass never tokenize to a
//     bare "pass" at all.
//   • "dsn" in any position → SENTRY_DSN, without
//     the substring collisions a normalized match would cause
//     (CustomFieldsNavigation → "…fieldsnavigation" contains "dsn").
// Their VALUES are additionally caught by the value-shape pass below.
const hasShortSecretToken = (name: string): boolean => {
  const tokens = tokenize(name);
  if (!tokens.length) return false;
  return tokens[tokens.length - 1] === 'pass' || tokens.includes('dsn');
};

// Database / message-broker connection codes (MONGO_URL, CORE_MONGO_URL,
// REDIS_URL, RABBITMQ_URL) are credential-bearing secrets by NAME — even when a
// particular stored value omits inline credentials (they may be supplied
// out-of-band, and the host/port/db topology is itself sensitive). Requires BOTH
// a store token AND a url/uri token, so benign endpoints keep passing through
// (CDN_URL, API_URL, ELASTICSEARCH_URL, MAIN_API_DOMAIN).
const DB_HOST_TOKENS = new Set([
  'mongo',
  'mongodb',
  'redis',
  'rediss',
  'postgres',
  'postgresql',
  'mysql',
  'mariadb',
  'rabbitmq',
  'amqp',
  'amqps',
]);
const isDbConnectionName = (name: string): boolean => {
  const tokens = tokenize(name);
  return (
    tokens.some((t) => DB_HOST_TOKENS.has(t)) &&
    tokens.some((t) => t === 'url' || t === 'uri')
  );
};

/** True when a field/config name denotes a secret value. */
export function isSecretName(name: string): boolean {
  const normalized = normalize(name);
  // (1) A concrete secret fragment always wins — checked FIRST so a name that
  // also looks public stays redacted: BLOCKADMIN_PUBLIC_API_KEY /
  // MUSHOP_PUBLIC_API_KEY carry "apikey" and never reach the public exemption.
  if (SECRET_NAME_RE.test(normalized)) return true;
  // (2) A short secret token matched as a whole word (trailing "pass", any
  // "dsn") — MAIL_PASS, SENTRY_DSN — without substring false positives.
  if (hasShortSecretToken(name)) return true;
  // (2b) A database/broker connection code (MONGO_URL, REDIS_URL) — the value
  // may omit inline creds yet still be a secret; hide it by name.
  if (isDbConnectionName(name)) return true;
  // (3) A name ending in "key" is secret (config.key/golomt, inStoreSPKey/
  // socialpay, serviceAccountKey/firebase) EXCEPT the public-by-design
  // allowlist. Safe: a name here that ALSO carried a secret fragment already
  // returned at (1). Over-redacting a non-listed field ending in "key" is
  // accepted (security > minor utility).
  if (normalized.endsWith('key')) {
    return !PUBLIC_KEY_NAMES.some((p) => normalized.endsWith(p));
  }
  // (4) One-off exact matches.
  return normalized === 'otp' || normalized === 'pin';
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

// Some secrets are smuggled inside a single STRING field as serialised JSON —
// erkhet's `sendStr`, Firebase's `serviceAccountKey` blob. Those strings are
// opaque to the field-name pass, so we parse them and run the redactor over the
// parsed structure. Cap the length to avoid parsing pathological inputs.
const MAX_JSON_STRING_LENGTH = 100_000;

// Value-shape detectors for secrets that ride inside a plain string under an
// innocuous field NAME (MONGO_URL, SENTRY_DSN, dbConnectionString, an Azure
// storage blob). Applied to every string leaf regardless of its field name.
//   - URI_CREDENTIAL_RE: a URI whose userinfo carries a PASSWORD
//     (scheme://user:secret@host). The ":…@" is the signal — a bare host, a
//     host:port, a userinfo WITHOUT a password, or a ${VAR}/path template all
//     lack it and pass through, so the model can still report endpoints/hosts.
//     Covers mongodb:// connection strings and Sentry-style DSNs
//     (https://pk:sk@host/1).
//   - KEYED_SECRET_RE: an Azure AccountKey= / SharedAccessKey= assignment with a
//     non-empty value in a semicolon blob (AccountKey=; unset stays visible).
const URI_CREDENTIAL_RE = /[a-z][a-z0-9+.-]*:\/\/[^/\s:@]*:[^/\s@]+@/i;
const KEYED_SECRET_RE = /(?:accountkey|sharedaccesskey)\s*=\s*[^;\s]/i;
// A PEM private-key block — unambiguous, zero false positives.
const PEM_PRIVATE_KEY_RE = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/;
// A bearer/authorization token value (needs a long token to avoid prose hits).
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/i;
// A credential carried in a URL query parameter (?token=…, &api_key=…). The
// param name must sit directly after ?/& so utm_token / csrf_ref don't collide.
const QUERY_CRED_RE =
  /[?&](?:access[_-]?token|api[_-]?key|apikey|auth[_-]?token|client[_-]?secret|secret|passwd|password|token|signature)=[^&\s#]+/i;
const looksLikeEmbeddedCredential = (s: string): boolean =>
  URI_CREDENTIAL_RE.test(s) ||
  KEYED_SECRET_RE.test(s) ||
  PEM_PRIVATE_KEY_RE.test(s) ||
  BEARER_RE.test(s) ||
  QUERY_CRED_RE.test(s);

function redactValue(value: unknown, depth: number): unknown {
  // Past the defensive depth cap, fail SAFE: redact rather than pass a value
  // through unscanned. Real GraphQL/config trees never approach this depth, so
  // this only ever fires on pathological input.
  if (depth > MAX_DEPTH) return REDACTED;

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
      } else if (k === codeKey) {
        // The sibling code/key field carries the LABEL (e.g. "AWS_SECRET_KEY"),
        // not the secret value, so it stays visible — guarding it from the
        // broadened endsWith("key") rule. Still run it through redactValue (not a
        // verbatim passthrough) so a label that is itself a serialised
        // secret-bearing JSON blob gets scrubbed; a plain label string is
        // returned unchanged.
        out[k] = redactValue(v, depth + 1);
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

  if (typeof value === 'string') {
    // Value-shape pass: catch a secret carried INSIDE a string under an
    // innocuous field name (MONGO_URL, SENTRY_DSN, dbConnectionString, an Azure
    // storage blob) — regardless of the field name, and even when embedded in a
    // JSON blob. Redacting the WHOLE string is the safe choice, consistent with
    // the JSON handling below. A benign URL with no userinfo password
    // (https://host/path, mongodb://host/db, host:port, ${VAR}/path) does NOT
    // match and passes through, so the model can still report endpoints.
    if (looksLikeEmbeddedCredential(value)) return REDACTED;

    // A JSON-looking string may itself be a serialised secret-bearing structure
    // (erkhet `sendStr`, Firebase `serviceAccountKey`). Parse it, redact the
    // parsed value, and if that changed anything the string carried a secret — in
    // which case replace the WHOLE string (re-serialising a partially-redacted
    // blob is not worth the risk; redacting the entire string is the safe choice).
    const trimmed = value.trim();
    if (
      value.length <= MAX_JSON_STRING_LENGTH &&
      (trimmed.startsWith('{') || trimmed.startsWith('['))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          const redacted = redactValue(parsed, depth + 1);
          if (JSON.stringify(parsed) !== JSON.stringify(redacted)) {
            return REDACTED;
          }
        }
      } catch {
        // Not valid JSON — leave the opaque string untouched.
      }
    }
    return value;
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
