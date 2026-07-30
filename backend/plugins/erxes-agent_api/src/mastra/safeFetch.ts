import { ExpectedError } from 'erxes-api-shared/utils';
import { lookup } from 'node:dns/promises';

// ---------------------------------------------------------------------------
// SSRF-guarded HTTP(S) fetch. The URL is controlled by the model or a link the
// user pasted, so every fetch must refuse non-http(s) schemes and private /
// link-local targets, and re-validate each redirect hop — otherwise a request
// could reach internal services or the cloud metadata endpoint.
//
// Shared by the web tools (tools/builtins.ts) and the file reader's URL path
// (files/storage.ts → tools/fileReaderTool.ts).
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 15_000;
const UA = 'Mozilla/5.0 (compatible; erxes-agent/1.0)';
const MAX_REDIRECTS = 4;

/** True for loopback, RFC1918, link-local, and IPv6 private ranges. */
export function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const v6 = ip.toLowerCase();
    if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7));
    return (
      v6 === '::1' ||
      v6 === '::' ||
      v6.startsWith('fc') ||
      v6.startsWith('fd') ||
      v6.startsWith('fe80')
    );
  }
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/** Parse a URL and refuse non-http(s) schemes or private/unknown hosts. */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ExpectedError('Only http(s) URLs are allowed');
  }
  const addrs = await lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((entry) => isPrivateIp(entry.address))) {
    throw new ExpectedError('URL resolves to a private or unknown address');
  }
  return url;
}

/** Fetch with manual redirects, re-validating every hop against SSRF. */
export async function safeFetch(
  raw: string,
): Promise<{ res: Response; finalUrl: string }> {
  let url = await assertPublicHttpUrl(raw);
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      url = await assertPublicHttpUrl(new URL(loc, url).toString());
      continue;
    }
    return { res, finalUrl: url.toString() };
  }
  throw new Error('Too many redirects');
}
