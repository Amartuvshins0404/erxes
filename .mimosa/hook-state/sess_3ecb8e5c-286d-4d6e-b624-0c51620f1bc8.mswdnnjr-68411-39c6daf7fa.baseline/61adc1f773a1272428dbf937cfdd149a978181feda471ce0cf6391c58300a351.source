export interface HumanOrderError {
  reason: string;
  raw: string;
}

// Matches the messages `sendSupplierMessage` (mushop_api) throws when
// forwarding an order to a supplier's own SaaS fails — see
// backend/plugins/mushop_api/src/utils/sendSupplierMessage.ts.
const matchers: Array<{ test: RegExp; reason: string }> = [
  {
    test: /not configured/i,
    reason: 'Mushop is not set up to reach suppliers yet.',
  },
  {
    test: /HTTP 401|Invalid signature|Missing signature/i,
    reason: 'Authentication with the supplier failed.',
  },
  { test: /HTTP 403/i, reason: 'The supplier refused the request.' },
  {
    test: /HTTP 404/i,
    reason: "The supplier's order endpoint was not found.",
  },
  { test: /HTTP 5\d\d/i, reason: "The supplier's system returned an error." },
  {
    test: /aborted|timeout|timed out/i,
    reason: 'The supplier did not respond in time.',
  },
  {
    test: /fetch failed|ECONNREFUSED|ENOTFOUND|getaddrinfo/i,
    reason: "Could not reach the supplier's system.",
  },
];

export const humanizeOrderError = (raw?: string | null): HumanOrderError => {
  if (!raw) return { reason: 'Unknown error.', raw: raw || '' };

  const matched = matchers.find((m) => m.test.test(raw));
  if (matched) return { reason: matched.reason, raw };

  const cleaned = raw.charAt(0).toUpperCase() + raw.slice(1);
  return { reason: cleaned, raw };
};
