import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from 'crypto';
import { ExpectedError } from 'erxes-api-shared/utils';

const ENVELOPE_PREFIX = 'enc:v2:';
const IV_BYTES = 12;
const TAG_BYTES = 16;

interface IDerivedKey {
  kid: string;
  key: Buffer;
}

const derivedKeys = new Map<string, IDerivedKey>();

const deriveKey = (masterKey: string): IDerivedKey => {
  const cached = derivedKeys.get(masterKey);

  if (cached) {
    return cached;
  }

  const key = Buffer.from(
    hkdfSync(
      'sha256',
      masterKey,
      'erxes-connections',
      'connection-secrets-v1',
      32,
    ),
  );
  const derived = {
    key,
    kid: createHash('sha256').update(key).digest('hex').slice(0, 8),
  };

  derivedKeys.set(masterKey, derived);

  return derived;
};

const currentKey = (): IDerivedKey | null => {
  const masterKey = process.env.ERXES_MASTER_KEY;

  return masterKey ? deriveKey(masterKey) : null;
};

const openingKeys = (): IDerivedKey[] => {
  const previous = (process.env.ERXES_MASTER_KEY_PREVIOUS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map(deriveKey);
  const current = currentKey();

  return current ? [current, ...previous] : previous;
};

const aad = (connectionId: string, field: string): Buffer =>
  Buffer.from(`${connectionId}:${field}`, 'utf8');

export const canSealSecrets = (): boolean => currentKey() !== null;

export const isSealedSecret = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith(ENVELOPE_PREFIX);

export const sealSecret = ({
  connectionId,
  field,
  plain,
}: {
  connectionId: string;
  field: string;
  plain: string;
}): string => {
  const derived = currentKey();

  if (!derived) {
    throw new ExpectedError(
      'Connection encryption is not configured. Ask an administrator to set ERXES_MASTER_KEY.',
      'SERVER_ERROR',
    );
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', derived.key, iv);

  cipher.setAAD(aad(connectionId, field));

  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);

  return [
    'enc',
    'v2',
    derived.kid,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
};

export const openSecret = ({
  connectionId,
  field,
  stored,
}: {
  connectionId: string;
  field: string;
  stored: unknown;
}): string | null => {
  if (!isSealedSecret(stored)) {
    return null;
  }

  const [, , kid, ivPart, tagPart, dataPart, ...rest] = stored.split(':');

  if (!kid || !ivPart || !tagPart || dataPart === undefined || rest.length) {
    return null;
  }

  const derived = openingKeys().find((candidate) => candidate.kid === kid);

  if (!derived) {
    return null;
  }

  try {
    const iv = Buffer.from(ivPart, 'base64url');
    const tag = Buffer.from(tagPart, 'base64url');

    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      return null;
    }

    const decipher = createDecipheriv('aes-256-gcm', derived.key, iv, {
      authTagLength: TAG_BYTES,
    });

    decipher.setAAD(aad(connectionId, field));
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
};

export const canOpenSecret = ({
  connectionId,
  field,
  stored,
}: {
  connectionId: string;
  field: string;
  stored: unknown;
}): boolean => openSecret({ connectionId, field, stored }) !== null;
