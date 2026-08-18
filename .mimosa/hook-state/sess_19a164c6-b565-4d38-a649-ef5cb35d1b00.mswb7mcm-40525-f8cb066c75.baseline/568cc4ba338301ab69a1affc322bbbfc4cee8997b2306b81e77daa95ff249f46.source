export interface HumanSyncError {
  productCode?: string;
  reason: string;
  raw: string;
}

const matchers: Array<{ test: RegExp; reason: string }> = [
  {
    test: /does not have an active "?mushop-coshop"? bundle/i,
    reason: 'Target shop is not set up for collectives.',
  },
  {
    test: /does not match the category mask/i,
    reason: 'Product category does not exist on the target shop.',
  },
  {
    test: /code already exists|duplicate key|E11000/i,
    reason: 'A product with the same code already exists on the target shop.',
  },
  {
    test: /Code does not match/i,
    reason: 'Product code is not valid for the target shop category.',
  },
  {
    test: /Invalid host|subdomain.*invalid|Invalid host, subdomain/i,
    reason: 'Target shop subdomain is invalid.',
  },
  {
    test: /HTTP 401|Invalid signature|Missing signature/i,
    reason: 'Authentication with target shop failed.',
  },
  { test: /HTTP 403/i, reason: 'Target shop refused the request.' },
  {
    test: /HTTP 5\d\d|fetch failed|ECONNREFUSED|ENOTFOUND|getaddrinfo|timeout|aborted/i,
    reason: 'Could not reach the target shop.',
  },
  {
    test: /createProduct returned null/i,
    reason: 'Target shop did not accept the product.',
  },
  {
    test: /missing code or name/i,
    reason: 'Product is missing a name or code.',
  },
];

export const humanizeSyncError = (raw: string): HumanSyncError => {
  if (!raw) return { reason: 'Unknown error.', raw };

  // Backend formats: "<code>: <message>" or "transport: <message>"
  const idx = raw.indexOf(':');
  let prefix: string | undefined;
  let body = raw;
  if (idx > 0) {
    prefix = raw.slice(0, idx).trim();
    body = raw.slice(idx + 1).trim();
  }

  const isTransport = prefix === 'transport';
  const productCode =
    !isTransport && prefix && prefix !== '<no-code>' ? prefix : undefined;

  const matched = matchers.find((m) => m.test.test(body));
  if (matched) return { productCode, reason: matched.reason, raw };

  if (isTransport) {
    return {
      productCode,
      reason: 'Could not connect to the target shop.',
      raw,
    };
  }

  // Fall back to the raw message but capitalised; still readable enough
  // for non-technical users when no matcher fires.
  const cleaned = body.charAt(0).toUpperCase() + body.slice(1);
  return { productCode, reason: cleaned || 'Unknown error.', raw };
};
