jest.mock('erxes-api-shared/utils', () => ({
  ExpectedError: class ExpectedError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
    }
  },
}));

import {
  canSealSecrets,
  isSealedSecret,
  openSecret,
  sealSecret,
} from '@/connections/crypto';

const KEY_A = 'master-key-a-for-connection-tests';
const KEY_B = 'master-key-b-for-connection-tests';
const original = { ...process.env };

const seal = (
  plain = 'sk-live-secret',
  connectionId = 'c1',
  field = 'apiKey',
) => sealSecret({ connectionId, field, plain });

const open = (stored: string, connectionId = 'c1', field = 'apiKey') =>
  openSecret({ connectionId, field, stored });

beforeEach(() => {
  process.env.ERXES_MASTER_KEY = KEY_A;
  delete process.env.ERXES_MASTER_KEY_PREVIOUS;
});

afterAll(() => {
  process.env = { ...original };
});

describe('connection secret sealing', () => {
  it('round-trips and never stores the plaintext', () => {
    const sealed = seal('sk-live-secret');

    expect(sealed).toMatch(/^enc:v2:[0-9a-f]{8}:[\w-]+:[\w-]+:[\w-]*$/);
    expect(sealed).not.toContain('sk-live-secret');
    expect(isSealedSecret(sealed)).toBe(true);
    expect(open(sealed)).toBe('sk-live-secret');
  });

  it('uses a fresh IV for every seal', () => {
    expect(seal()).not.toBe(seal());
  });

  it('fails closed when no master key is configured', () => {
    delete process.env.ERXES_MASTER_KEY;

    expect(canSealSecrets()).toBe(false);
    expect(() => seal()).toThrow('ERXES_MASTER_KEY');
  });

  it('refuses ciphertext moved to another connection or another field', () => {
    const sealed = seal('sk-live-secret', 'c1', 'apiKey');

    expect(open(sealed, 'c2', 'apiKey')).toBeNull();
    expect(open(sealed, 'c1', 'gatewayToken')).toBeNull();
  });

  it('rejects tampered ciphertext, tag and malformed envelopes', () => {
    const [prefix, version, kid, iv, tag, data] = seal().split(':');
    const flip = (value: string) =>
      `${value.startsWith('A') ? 'B' : 'A'}${value.slice(1)}`;

    expect(
      open([prefix, version, kid, iv, tag, flip(data)].join(':')),
    ).toBeNull();
    expect(
      open([prefix, version, kid, iv, flip(tag), data].join(':')),
    ).toBeNull();
    expect(
      open([prefix, version, kid, flip(iv), tag, data].join(':')),
    ).toBeNull();
    expect(open(`${prefix}:${version}:${kid}:${iv}`)).toBeNull();
    expect(open(`${seal()}:extra`)).toBeNull();
  });

  it('does not open legacy or plaintext values', () => {
    expect(open('enc:v1:AAAA:BBBB:CCCC')).toBeNull();
    expect(open('sk-plain-value')).toBeNull();
  });

  it('cannot be opened with a different master key', () => {
    const sealed = seal();

    process.env.ERXES_MASTER_KEY = KEY_B;

    expect(open(sealed)).toBeNull();
  });

  it('opens values sealed under a previous key after rotation, and seals with the new one', () => {
    const oldSealed = seal('sk-old');

    process.env.ERXES_MASTER_KEY = KEY_B;
    process.env.ERXES_MASTER_KEY_PREVIOUS = `unrelated-key, ${KEY_A}`;

    expect(open(oldSealed)).toBe('sk-old');

    const newSealed = seal('sk-new');

    expect(newSealed.split(':')[2]).not.toBe(oldSealed.split(':')[2]);

    delete process.env.ERXES_MASTER_KEY_PREVIOUS;

    expect(open(newSealed)).toBe('sk-new');
    expect(open(oldSealed)).toBeNull();
  });
});
