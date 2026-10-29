import {
  deriveServiceToken,
  signServiceRequest,
  verifyServiceRequest,
} from './serviceAuth';
import {
  buildServiceAuthHeader,
  setCurrentServiceName,
} from './serviceIdentity';

const masterKey = 'test-master-key-for-service-auth';
const now = 1_900_000_000_000;
const request = {
  subdomain: 'acme',
  path: 'connections.resolve',
  body: '{"_id":"c1"}',
};

const sign = (serviceName = 'automations', at = now, overrides = {}) =>
  signServiceRequest({
    serviceName,
    token: deriveServiceToken(masterKey, serviceName),
    ...request,
    now: at,
    ...overrides,
  });

const verify = (header: string | undefined, overrides = {}) =>
  verifyServiceRequest({
    header,
    masterKey,
    ...request,
    now,
    ...overrides,
  });

describe('service auth', () => {
  it('accepts a request signed with the service token derived from the master key', () => {
    expect(verify(sign())).toEqual({ serviceName: 'automations' });
  });

  it('derives a different token per service and per master key', () => {
    expect(deriveServiceToken(masterKey, 'automations')).not.toBe(
      deriveServiceToken(masterKey, 'sales'),
    );
    expect(deriveServiceToken(masterKey, 'automations')).not.toBe(
      deriveServiceToken('another-master-key', 'automations'),
    );
  });

  it('rejects a signature made with another service token', () => {
    const forged = signServiceRequest({
      serviceName: 'automations',
      token: deriveServiceToken(masterKey, 'sales'),
      ...request,
      now,
    });

    expect(verify(forged)).toBeNull();
  });

  it('rejects a header that claims a different service than the one that signed it', () => {
    const [version, , timestamp, signature] = sign('sales').split('.');

    expect(
      verify([version, 'automations', timestamp, signature].join('.')),
    ).toBeNull();
  });

  it('rejects tampered tenant, path or body', () => {
    const header = sign();

    expect(verify(header, { subdomain: 'other' })).toBeNull();
    expect(verify(header, { path: 'connections.other' })).toBeNull();
    expect(verify(header, { body: '{"_id":"c2"}' })).toBeNull();
  });

  it('rejects expired and future-dated signatures but allows clock skew inside the window', () => {
    expect(verify(sign('automations', now - 301_000))).toBeNull();
    expect(verify(sign('automations', now + 301_000))).toBeNull();
    expect(verify(sign('automations', now - 299_000))).toEqual({
      serviceName: 'automations',
    });
  });

  it('rejects malformed headers and a missing master key', () => {
    expect(verify(undefined)).toBeNull();
    expect(verify('')).toBeNull();
    expect(verify('v2.automations.1.abc')).toBeNull();
    expect(verify('v1.automations.notanumber.abc')).toBeNull();
    expect(verify(sign(), { masterKey: undefined })).toBeNull();
    expect(verify(sign(), { masterKey: 'wrong-master-key' })).toBeNull();
  });

  it('refuses to sign for a service name that could break the header format', () => {
    expect(() => sign('bad.name')).toThrow('Invalid service name');
  });
});

describe('buildServiceAuthHeader', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('derives the token from the master key when no service token is set', () => {
    delete process.env.ERXES_SERVICE_TOKEN;
    process.env.ERXES_MASTER_KEY = masterKey;
    setCurrentServiceName('sales');

    const header = buildServiceAuthHeader({
      subdomain: 'acme',
      path: 'connections.resolve',
      input: { _id: 'c1' },
    });

    expect(
      verifyServiceRequest({
        header,
        masterKey,
        subdomain: 'acme',
        path: 'connections.resolve',
        body: JSON.stringify({ _id: 'c1' }),
      }),
    ).toEqual({ serviceName: 'sales' });
  });

  it('prefers an explicit service token and sends nothing without credentials', () => {
    process.env.ERXES_MASTER_KEY = masterKey;
    process.env.ERXES_SERVICE_TOKEN = deriveServiceToken(masterKey, 'sales');
    setCurrentServiceName('sales');

    expect(
      buildServiceAuthHeader({ subdomain: 'acme', path: 'x.y', input: {} }),
    ).toBeDefined();

    delete process.env.ERXES_MASTER_KEY;
    delete process.env.ERXES_SERVICE_TOKEN;

    expect(
      buildServiceAuthHeader({ subdomain: 'acme', path: 'x.y', input: {} }),
    ).toBeUndefined();
  });
});
