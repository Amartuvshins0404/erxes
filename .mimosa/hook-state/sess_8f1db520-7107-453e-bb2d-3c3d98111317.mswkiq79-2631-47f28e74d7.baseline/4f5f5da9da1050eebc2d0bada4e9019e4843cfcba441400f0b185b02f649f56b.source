// DNS label rules (RFC 1035): 3-63 chars, a-z/0-9/-, no leading/trailing dash.
export const SUBDOMAIN_MIN = 3;
export const SUBDOMAIN_MAX = 63;

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export const normalizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, SUBDOMAIN_MAX);

export const isValidSubdomain = (value: string) =>
  value.length >= SUBDOMAIN_MIN &&
  value.length <= SUBDOMAIN_MAX &&
  SUBDOMAIN_RE.test(value);
