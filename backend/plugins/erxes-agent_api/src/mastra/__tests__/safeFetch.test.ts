import { EventEmitter } from 'node:events';

// Override only the functions safeFetch uses; keep the rest of each module
// intact (other code in the import graph extends http.Agent etc.).
jest.mock('node:dns/promises', () => ({
  ...jest.requireActual('node:dns/promises'),
  lookup: jest.fn(),
}));
jest.mock('node:https', () => ({
  ...jest.requireActual('node:https'),
  request: jest.fn(),
}));
jest.mock('node:http', () => ({
  ...jest.requireActual('node:http'),
  request: jest.fn(),
}));

import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { isPrivateIp, assertPublicHttpUrl, safeFetch } from '../safeFetch';

const mockLookup = lookup as unknown as jest.Mock;
const mockHttps = httpsRequest as unknown as jest.Mock;
const mockHttp = httpRequest as unknown as jest.Mock;

type FakeRes = EventEmitter & {
  statusCode?: number;
  statusMessage?: string;
  headers: Record<string, string | string[]>;
};
type FakeReq = EventEmitter & { end: jest.Mock; destroy: jest.Mock };

/** Queue one fake HTTP(S) response for the next request() call. */
function queueResponse(
  mock: jest.Mock,
  opts: { status?: number; headers?: Record<string, string>; body?: string },
) {
  mock.mockImplementationOnce((_options: unknown, cb: (res: FakeRes) => void) => {
    const res = Object.assign(new EventEmitter(), {
      statusCode: opts.status ?? 200,
      statusMessage: 'OK',
      headers: opts.headers ?? {},
    }) as FakeRes;
    process.nextTick(() => {
      cb(res);
      process.nextTick(() => {
        if (opts.body) res.emit('data', Buffer.from(opts.body));
        res.emit('end');
      });
    });
    const req = Object.assign(new EventEmitter(), {
      end: jest.fn(),
      destroy: jest.fn(),
    }) as FakeReq;
    return req;
  });
}

beforeEach(() => {
  mockLookup.mockReset();
  mockHttps.mockReset();
  mockHttp.mockReset();
});

describe('isPrivateIp — reserved range coverage (finding C)', () => {
  const priv = [
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1', // CGNAT
    '100.127.255.254', // CGNAT
    '127.0.0.1',
    '169.254.169.254', // cloud metadata
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.1', // IETF protocol assignments
    '192.168.1.1',
    '198.18.0.1', // benchmarking
    '198.19.255.255',
    '224.0.0.1', // multicast
    '240.0.0.1', // reserved
    '255.255.255.255', // broadcast
    '::1',
    '::',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    'ff02::1', // multicast
    '::ffff:169.254.169.254', // IPv4-mapped metadata
    '::ffff:127.0.0.1',
    '64:ff9b::a9fe:a9fe', // NAT64 of 169.254.169.254
  ];
  const pub = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111'];

  it.each(priv)('blocks reserved/private %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });
  it.each(pub)('allows public %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(false);
  });
  it('treats unparseable input as unsafe', () => {
    expect(isPrivateIp('not-an-ip')).toBe(true);
  });
});

describe('assertPublicHttpUrl', () => {
  it('rejects non-http(s) schemes', async () => {
    await expect(assertPublicHttpUrl('ftp://example.com')).rejects.toThrow(
      /http\(s\)/,
    );
    await expect(assertPublicHttpUrl('file:///etc/passwd')).rejects.toThrow();
  });

  it('rejects IP-literal private hosts without any DNS lookup', async () => {
    await expect(
      assertPublicHttpUrl('http://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow(/private or unknown/);
    await expect(assertPublicHttpUrl('http://127.0.0.1/')).rejects.toThrow();
    await expect(assertPublicHttpUrl('http://[::1]/')).rejects.toThrow();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('rejects a hostname that resolves to a private address (rebinding-time)', async () => {
    mockLookup.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
    await expect(assertPublicHttpUrl('http://rebind.evil/')).rejects.toThrow(
      /private or unknown/,
    );
  });

  it('pins the validated public address for connection', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const target = await assertPublicHttpUrl('https://example.com/a');
    expect(target.address).toBe('93.184.216.34');
    expect(target.url.hostname).toBe('example.com');
  });
});

describe('safeFetch — IP pinning closes DNS rebinding (finding B)', () => {
  it('connects to the validated IP, not the re-resolved hostname', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    queueResponse(mockHttps, { body: 'hello' });

    const { res, finalUrl } = await safeFetch('https://example.com/path?q=1');

    expect(mockHttps).toHaveBeenCalledTimes(1);
    const options = mockHttps.mock.calls[0][0];
    // Socket targets the pre-validated IP — no connect-time re-resolution.
    expect(options.host).toBe('93.184.216.34');
    // Host header + TLS SNI preserve the original hostname.
    expect(options.headers.Host).toBe('example.com');
    expect(options.servername).toBe('example.com');
    expect(options.path).toBe('/path?q=1');
    expect(await res.text()).toBe('hello');
    expect(finalUrl).toBe('https://example.com/path?q=1');
    // DNS resolved exactly once (the validation), never again at connect time.
    expect(mockLookup).toHaveBeenCalledTimes(1);
  });

  it('re-validates each redirect hop and blocks a redirect to a private target', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    queueResponse(mockHttp, {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data/' },
    });

    await expect(safeFetch('http://example.com/start')).rejects.toThrow(
      /private or unknown/,
    );
    // The redirect target (an IP literal) is validated and never connected to.
    expect(mockHttp).toHaveBeenCalledTimes(1);
  });
});
