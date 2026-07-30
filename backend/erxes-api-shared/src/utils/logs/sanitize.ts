export const SAFE_LOG_HEADER_NAMES = {
  accept: true,
  'accept-language': true,
  'content-length': true,
  'content-type': true,
  host: true,
  origin: true,
  'user-agent': true,
  'x-correlation-id': true,
  'x-erxes-process-id': true,
  'x-forwarded-host': true,
  'x-forwarded-proto': true,
  'x-request-id': true,
} as const;
export type SafeLogHeaderName = keyof typeof SAFE_LOG_HEADER_NAMES;
export type SafeLogValue =
  | boolean
  | Date
  | null
  | number
  | string
  | SafeLogValue[]
  | { [key: string]: SafeLogValue };

type SanitizedLogValue = SafeLogValue | typeof DROP | undefined;

type HeaderPolicy = 'allowlist' | 'strip-credentials';

type SanitizationContext = {
  activeObjects: WeakSet<object>;
  headerPolicy: HeaderPolicy;
};

const DROP = Symbol('drop-log-value');

const requestHeaderContainerNames: Record<string, true> = {
  headers: true,
  httpheaders: true,
  requestheaders: true,
};

const credentialFieldNames: Record<string, true> = {
  apikey: true,
  apikeys: true,
  auth: true,
  authtoken: true,
  bearer: true,
  clientsecret: true,
  cookie: true,
  cookies: true,
  credential: true,
  credentials: true,
  csrf: true,
  idtoken: true,
  jwt: true,
  password: true,
  privatekey: true,
  proxyauthorization: true,
  refreshtoken: true,
  secret: true,
  session: true,
  sessionid: true,
  sessiontoken: true,
  setcookie: true,
  token: true,
};

const credentialCookieValuePattern =
  /(?:^|[;,\s])(?:auth[-_]?token|access[-_]?token|refresh[-_]?token|id[-_]?token|session(?:[-_]?id|[-_]?token)?|__?stripe[^=]*)\s*=/i;
const credentialPrefixPattern =
  /^\s*(?:bearer\s+[A-Za-z0-9\-._~+/]{8,}=*|basic\s+[A-Za-z0-9+/]{8,}={0,2})\s*$/i;
const jwtValuePattern =
  /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/;
const serializedCredentialPattern =
  /"(?:access[-_]?token|api[-_]?key|auth[-_]?token|authorization|cookie|credentials?|id[-_]?token|password|refresh[-_]?token|secret|session(?:[-_]?(?:id|token))?|token)"\s*:/i;
const tokenMetricFieldPattern =
  /^(?:(?:prompt|completion|input|output|total|cached|reasoning|max)tokens?(?:count|usage|used|limit)?|tokens?(?:count|usage|used|limit))$/;

const normalizeName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

const isCredentialField = (name: string) => {
  const normalizedName = normalizeName(name);
  const isTokenMetric = tokenMetricFieldPattern.test(normalizedName);

  return (
    credentialFieldNames[normalizedName] === true ||
    (!isTokenMetric && normalizedName.includes('token')) ||
    normalizedName.includes('cookie') ||
    normalizedName.includes('credential') ||
    normalizedName.includes('authorization') ||
    normalizedName.includes('jwt') ||
    normalizedName.includes('password') ||
    normalizedName.includes('secret') ||
    normalizedName.endsWith('apikey')
  );
};

const isCredentialValue = (value: string) =>
  credentialPrefixPattern.test(value) ||
  credentialCookieValuePattern.test(value) ||
  jwtValuePattern.test(value) ||
  serializedCredentialPattern.test(value);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getJsonValue = (value: Record<string, unknown>) => {
  const toJSON = value.toJSON;

  if (typeof toJSON !== 'function') {
    return undefined;
  }

  try {
    return toJSON.call(value);
  } catch {
    return DROP;
  }
};

const sanitizeHeaders = (
  headers: unknown,
  context: SanitizationContext,
  depth: number,
): { [key: string]: SafeLogValue } => {
  if (!isObject(headers)) {
    return {};
  }

  const sanitizedHeaders: { [key: string]: SafeLogValue } = {};

  for (const [name, value] of Object.entries(headers)) {
    const headerName = name.toLowerCase();

    if (isCredentialField(headerName)) {
      continue;
    }

    if (
      context.headerPolicy === 'allowlist' &&
      SAFE_LOG_HEADER_NAMES[headerName as SafeLogHeaderName] !== true
    ) {
      continue;
    }

    const sanitizedValue = sanitizeValue(value, context, depth + 1);

    if (sanitizedValue !== DROP && sanitizedValue !== undefined) {
      sanitizedHeaders[headerName] = sanitizedValue;
    }
  }

  return sanitizedHeaders;
};

const sanitizeValue = (
  value: unknown,
  context: SanitizationContext,
  depth: number,
): SanitizedLogValue => {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value;
  }

  if (typeof value === 'string') {
    return isCredentialValue(value) ? DROP : value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    if (context.activeObjects.has(value)) {
      return DROP;
    }

    context.activeObjects.add(value);
    const sanitizedValues = value.reduce<SafeLogValue[]>((values, entry) => {
      const sanitizedEntry = sanitizeValue(entry, context, depth + 1);

      if (sanitizedEntry !== DROP && sanitizedEntry !== undefined) {
        values.push(sanitizedEntry);
      }

      return values;
    }, []);
    context.activeObjects.delete(value);

    return sanitizedValues;
  }

  if (!isObject(value)) {
    return DROP;
  }

  if (context.activeObjects.has(value)) {
    return DROP;
  }

  const jsonValue = getJsonValue(value);

  if (jsonValue === DROP) {
    return DROP;
  }

  if (jsonValue !== undefined && jsonValue !== value) {
    return sanitizeValue(jsonValue, context, depth);
  }

  context.activeObjects.add(value);
  const sanitizedObject: { [key: string]: SafeLogValue } = {};

  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = normalizeName(key);

    const isHeaderContainer =
      requestHeaderContainerNames[normalizedKey] === true ||
      (depth === 0 && normalizedKey === 'requestdata');

    if (isHeaderContainer) {
      sanitizedObject[key] = sanitizeHeaders(entry, context, depth);
      continue;
    }

    if (isCredentialField(key)) {
      continue;
    }

    const sanitizedEntry = sanitizeValue(entry, context, depth + 1);

    if (sanitizedEntry !== DROP && sanitizedEntry !== undefined) {
      sanitizedObject[key] = sanitizedEntry;
    }
  }

  context.activeObjects.delete(value);

  return sanitizedObject;
};

const sanitizeLogPayloadWithHeaderPolicy = (
  value: unknown,
  headerPolicy: HeaderPolicy,
): SafeLogValue => {
  const sanitizedValue = sanitizeValue(
    value,
    {
      activeObjects: new WeakSet<object>(),
      headerPolicy,
    },
    0,
  );

  return sanitizedValue === DROP || sanitizedValue === undefined
    ? null
    : sanitizedValue;
};

/**
 * Produces a detached, credential-safe representation for durable event-log
 * storage. Request headers are projected through the explicit allowlist.
 */
export const sanitizeLogPayload = (value: unknown): SafeLogValue =>
  sanitizeLogPayloadWithHeaderPolicy(value, 'allowlist');

/**
 * Produces a detached queue payload that strips credentials while retaining
 * non-credential custom headers needed by after-process hooks.
 */
export const sanitizeLogTransportPayload = (value: unknown): SafeLogValue =>
  sanitizeLogPayloadWithHeaderPolicy(value, 'strip-credentials');

const sanitizeDocumentWith = <T extends { payload: unknown }>(
  logDocument: T,
  sanitizePayload: (value: unknown) => SafeLogValue,
): T =>
  ({
    ...logDocument,
    payload: sanitizePayload(logDocument.payload),
  } as T);

/** Returns a detached log document safe for durable storage. */
export const sanitizeLogDocument = <T extends { payload: unknown }>(
  logDocument: T,
): T => sanitizeDocumentWith(logDocument, sanitizeLogPayload);

/** Returns a detached log document safe for queue transport. */
export const sanitizeLogTransportDocument = <T extends { payload: unknown }>(
  logDocument: T,
): T => sanitizeDocumentWith(logDocument, sanitizeLogTransportPayload);
