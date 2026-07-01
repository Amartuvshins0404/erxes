import { ExpectedError } from 'erxes-api-shared/utils';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

// ---------------------------------------------------------------------------
// SSRF-guarded HTTP(S) fetch. The URL is controlled by the model or a link the
// user pasted, so every fetch must refuse non-http(s) schemes and private /
// link-local targets, and re-validate each redirect hop — otherwise a request
// could reach internal services or the cloud metadata endpoint.
//
// Two hardening properties beyond a naive "resolve, check, fetch":
//   • IP pinning — DNS is resolved and validated ONCE, then the connection is
//     made to that exact validated address (host = IP, Host header + TLS SNI =
//     original hostname). A naive fetch hands the hostname to the HTTP client,
//     which re-resolves at connect time, so an attacker-controlled DNS record
//     can return a public IP for the check and a private one for the fetch
//     (DNS rebinding / TOCTOU). Pinning closes that window.
//   • Comprehensive reserved-range blocklist (net.BlockList) covering the
//     ranges a hand-rolled prefix check misses (CGNAT, benchmarking, IPv4
//     broadcast/multicast/reserved, IPv6 mapped + reserved).
//
// Shared by the web tools (tools/builtins.ts) and the file reader's URL path
// (files/storage.ts → tools/fileReaderTool.ts).
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 15_000;
const UA = 'Mozilla/5.0 (compatible; erxes-agent/1.0)';
const MAX_REDIRECTS = 4;
// Hard ceiling on a single response body so a guarded fetch can't be turned
// into an unbounded memory read; callers apply their own (smaller) caps too.
const MAX_RESPONSE_BYTES = 30 * 1024 * 1024;

// Reserved / non-public ranges. Anything in here must never be reachable via a
// model- or user-supplied URL. Prefer net.BlockList + a vetted CIDR set over
// hand-rolled string prefixes so the ranges stay auditable.
const blocked = new BlockList();
// ── IPv4 ──────────────────────────────────────────────────────────────────
blocked.addSubnet('0.0.0.0', 8, 'ipv4'); // "this host" / current network
blocked.addSubnet('10.0.0.0', 8, 'ipv4'); // RFC1918 private
blocked.addSubnet('100.64.0.0', 10, 'ipv4'); // RFC6598 CGNAT
blocked.addSubnet('127.0.0.0', 8, 'ipv4'); // loopback
blocked.addSubnet('169.254.0.0', 16, 'ipv4'); // link-local (incl. cloud metadata)
blocked.addSubnet('172.16.0.0', 12, 'ipv4'); // RFC1918 private
blocked.addSubnet('192.0.0.0', 24, 'ipv4'); // IETF protocol assignments
blocked.addSubnet('192.0.2.0', 24, 'ipv4'); // TEST-NET-1 (documentation)
blocked.addSubnet('192.168.0.0', 16, 'ipv4'); // RFC1918 private
blocked.addSubnet('198.18.0.0', 15, 'ipv4'); // RFC2544 benchmarking
blocked.addSubnet('198.51.100.0', 24, 'ipv4'); // TEST-NET-2 (documentation)
blocked.addSubnet('203.0.113.0', 24, 'ipv4'); // TEST-NET-3 (documentation)
blocked.addSubnet('224.0.0.0', 4, 'ipv4'); // multicast
blocked.addSubnet('240.0.0.0', 4, 'ipv4'); // reserved (incl. 255.255.255.255 broadcast)
// ── IPv6 ──────────────────────────────────────────────────────────────────
blocked.addAddress('::1', 'ipv6'); // loopback
blocked.addAddress('::', 'ipv6'); // unspecified
// NB: IPv4-mapped (::ffff:0:0/96) is handled by unwrapping to the embedded
// IPv4 below — adding it as a BlockList subnet makes net.BlockList treat EVERY
// IPv4 address as matched (v4 ≡ v4-mapped internally), which would block all
// public IPv4 traffic.
blocked.addSubnet('64:ff9b::', 96, 'ipv6'); // NAT64 (maps to IPv4)
blocked.addSubnet('100::', 64, 'ipv6'); // discard-only
blocked.addSubnet('2001:db8::', 32, 'ipv6'); // documentation
blocked.addSubnet('fc00::', 7, 'ipv6'); // unique local
blocked.addSubnet('fe80::', 10, 'ipv6'); // link-local
blocked.addSubnet('ff00::', 8, 'ipv6'); // multicast

/** If `ip` is an IPv4-mapped IPv6 address, return the embedded dotted IPv4. */
function unwrapMappedV4(ip: string): string | null {
  const m = ip.toLowerCase().match(/^::ffff:(.+)$/);
  if (!m) return null;
  const rest = m[1];
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(rest)) return rest; // ::ffff:a.b.c.d
  const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/); // ::ffff:hhhh:hhhh
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
  }
  return null;
}

/** True for loopback, RFC1918/6598, link-local, and reserved IPv4/IPv6 ranges. */
export function isPrivateIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 0) return true; // not a parseable IP → treat as unsafe
  if (family === 6) {
    // IPv4-mapped addresses (any notation) carry an embedded IPv4 — validate it
    // against the IPv4 rules so e.g. ::ffff:169.254.169.254 is caught.
    const mapped = unwrapMappedV4(ip);
    if (mapped) return isPrivateIp(mapped);
  }
  return blocked.check(ip, family === 4 ? 'ipv4' : 'ipv6');
}

interface ValidatedTarget {
  url: URL;
  /** The validated IP the connection must be pinned to. */
  address: string;
  family: number;
}

/**
 * Parse a URL, refuse non-http(s) schemes, resolve the host ONCE and reject if
 * any resolved address is private/reserved. Returns the URL plus the exact IP
 * the caller must connect to (so the connection can't re-resolve to a different,
 * private address).
 */
export async function assertPublicHttpUrl(raw: string): Promise<ValidatedTarget> {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ExpectedError('Only http(s) URLs are allowed');
  }

  // Host given as an IP literal — validate directly, no DNS.
  const literal = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(literal)) {
    if (isPrivateIp(literal)) {
      throw new ExpectedError('URL resolves to a private or unknown address');
    }
    return { url, address: literal, family: isIP(literal) };
  }

  const addrs = await lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((entry) => isPrivateIp(entry.address))) {
    throw new ExpectedError('URL resolves to a private or unknown address');
  }
  const pick = addrs[0];
  return { url, address: pick.address, family: pick.family };
}

/**
 * Issue a single GET to the validated IP. The socket connects to `address`
 * (never re-resolving the hostname), while the Host header and TLS servername
 * keep the original hostname so vhosts and certificate validation still work.
 * Redirects are NOT followed here — safeFetch re-validates each hop.
 */
function pinnedRequest(
  url: URL,
  address: string,
  family: number,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    const port = url.port ? Number(url.port) : isHttps ? 443 : 80;

    const req = requestFn(
      {
        host: address, // pin to the validated IP — no connect-time re-resolution
        port,
        family,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        servername: isHttps ? url.hostname : undefined, // TLS SNI → real host
        headers: {
          Host: url.host, // preserve vhost
          'User-Agent': UA,
          'Accept-Encoding': 'identity', // we don't decompress manually
        },
        timeout: FETCH_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let total = 0;
        res.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_RESPONSE_BYTES) {
            req.destroy();
            reject(new ExpectedError('Response exceeds the maximum allowed size'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          const headers = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (Array.isArray(value)) {
              value.forEach((v) => headers.append(key, v));
            } else if (value != null) {
              headers.set(key, String(value));
            }
          }
          const status = res.statusCode ?? 502;
          const noBody = status === 204 || status === 304 || total === 0;
          resolve(
            new Response(noBody ? null : Buffer.concat(chunks), {
              status,
              statusText: res.statusMessage || '',
              headers,
            }),
          );
        });
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
    req.end();
  });
}

/** Fetch with manual redirects, re-validating + re-pinning every hop. */
export async function safeFetch(
  raw: string,
): Promise<{ res: Response; finalUrl: string }> {
  let target = await assertPublicHttpUrl(raw);
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const res = await pinnedRequest(target.url, target.address, target.family);
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      target = await assertPublicHttpUrl(new URL(loc, target.url).toString());
      continue;
    }
    return { res, finalUrl: target.url.toString() };
  }
  throw new ExpectedError('Too many redirects');
}
